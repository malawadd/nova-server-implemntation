import express from 'express';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';
import { fromIni } from "@aws-sdk/credential-providers";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { NovaSonicBidirectionalStreamClient, StreamSession } from './client';
import { Buffer } from 'node:buffer';
import { maraStore, EmotionSnapshot } from './mara';
import { NeuroFeedbackSystemPrompt } from './consts';
import dotenv from 'dotenv';

dotenv.config();

// ─── AWS Credentials ──────────────────────────────────────────────────────────

function assertValidLongTermAwsCredentials(accessKeyId: string, secretAccessKey: string) {
    const normalizedAccessKeyId = accessKeyId.trim();
    const normalizedSecretAccessKey = secretAccessKey.trim();
    const looksLikeLongTermIamAccessKey = /^AKIA[A-Z0-9]{16}$/.test(normalizedAccessKeyId);
    const looksLikeTemporaryAccessKey = /^ASIA[A-Z0-9]{16}$/.test(normalizedAccessKeyId);
    const looksLikeAwsSecret = normalizedSecretAccessKey.length === 40;

    if (!looksLikeLongTermIamAccessKey && !looksLikeTemporaryAccessKey) {
        throw new Error(`Invalid AWS_ACCESS_KEY_ID format. Got prefix "${normalizedAccessKeyId.slice(0, 8)}...".`);
    }
    if (!looksLikeAwsSecret) {
        throw new Error(`Invalid AWS_SECRET_ACCESS_KEY format. Got length ${normalizedSecretAccessKey.length}.`);
    }
}

function resolveAwsCredentials() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
    const sessionToken = process.env.AWS_SESSION_TOKEN?.trim();
    const profile = process.env.AWS_PROFILE?.trim();

    if (accessKeyId && secretAccessKey) {
        assertValidLongTermAwsCredentials(accessKeyId, secretAccessKey);
        return { accessKeyId, secretAccessKey, ...(sessionToken ? { sessionToken } : {}) };
    }
    if (profile) return fromIni({ profile });
    return defaultProvider();
}

// ─── Nova Lite: Emotion Classifier ───────────────────────────────────────────
//


const bedrockLiteClient = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: resolveAwsCredentials() as any,
});

interface EmotionData {
    emotion: 'anxiety' | 'stress' | 'sadness' | 'neutral';
    brain_region: 'amygdala' | 'insula' | 'prefrontal_cortex' | 'none';
    technique: 'box_breathing' | 'body_scan' | 'cognitive_reframe' | 'none';
    confidence: number;
}

async function classifyEmotionWithNovaLite(utterance: string, sessionId: string): Promise<EmotionData> {
    const mem = maraStore.getSession(sessionId);
    const historyCtx = mem?.emotionHistory.length
        ? `Session history (last 3): ${mem.emotionHistory.slice(-3).map(s => s.emotion).join(' → ')}.`
        : 'First utterance in session.';

    const prompt = `You are an emotion classifier for a neurofeedback application. Be precise.

${historyCtx}
User said: "${utterance}"

Return ONLY valid JSON, no explanation, no markdown:
{"emotion":"anxiety|stress|sadness|neutral","brain_region":"amygdala|insula|prefrontal_cortex|none","technique":"box_breathing|body_scan|cognitive_reframe|none","confidence":0.0}

Mapping rules:
- anxiety  → amygdala          → box_breathing
- stress   → insula            → body_scan
- sadness  → prefrontal_cortex → cognitive_reframe
- neutral  → none              → none`;

    try {
        const cmd = new InvokeModelCommand({
            modelId: "amazon.nova-lite-v1:0",
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify({
                messages: [{ role: "user", content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 80, temperature: 0.05 }
            })
        });

        const resp = await bedrockLiteClient.send(cmd);
        const body = JSON.parse(new TextDecoder().decode(resp.body));
        const text: string = body.output?.message?.content?.[0]?.text || '{}';
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) {
            const result = JSON.parse(match[0]) as EmotionData;
            console.log(`[Nova Lite] "${utterance.slice(0, 45)}..." → ${result.emotion} (${Math.round(result.confidence * 100)}%)`);
            return result;
        }
    } catch (e) {
        console.error('[Nova Lite] Classification error:', e);
    }

    return { emotion: 'neutral', brain_region: 'none', technique: 'none', confidence: 0 };
}

// ─── App Setup ────────────────────────────────────────────────────────────────

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const bedrockClient = new NovaSonicBidirectionalStreamClient({
    requestHandlerConfig: { maxConcurrentStreams: 10 },
    clientConfig: {
        region: process.env.AWS_REGION || "us-east-1",
        credentials: resolveAwsCredentials()
    }
});

const socketSessions = new Map<string, StreamSession>();

enum SessionState {
    INITIALIZING = 'initializing',
    READY = 'ready',
    ACTIVE = 'active',
    CLOSED = 'closed'
}

const sessionStates = new Map<string, SessionState>();
const cleanupInProgress = new Map<string, boolean>();

// ─── Inactive Session Cleanup ─────────────────────────────────────────────────

setInterval(() => {
    const now = Date.now();
    bedrockClient.getActiveSessions().forEach(sessionId => {
        if (now - bedrockClient.getLastActivityTime(sessionId) > 5 * 60 * 1000) {
            console.log(`[Cleanup] Closing inactive session ${sessionId}`);
            try { bedrockClient.forceCloseSession(sessionId); } catch { }
        }
    });
}, 60000);

// ─── REST ─────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        activeSessions: bedrockClient.getActiveSessions().length,
        socketConnections: Object.keys(io.sockets.sockets).length,
    });
});

app.post('/api/classify-emotion', async (req: any, res: any) => {
    try {
        const { transcript } = req.body;
        const sessionId = req.body.sessionId || 'diagnostic-test';

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        console.log(`[Diagnostic] Manuel classification istendi: "${transcript.slice(0, 30)}..."`);

        const result = await classifyEmotionWithNovaLite(transcript, sessionId);
        res.json(result);
    } catch (error: any) {
        console.error('[API Error]', error);
        res.status(500).json({ error: error.message });
    }
});
app.get('/api/mara/:sessionId', (req: any, res: any) => {
    const mem = maraStore.getSession(req.params.sessionId);
    if (!mem) return res.status(404).json({ error: 'Session not found' });
    res.json(mem);
});

// ─── NeuroFeedback Tool Handler ───────────────────────────────────────────────


function handleNeuroFeedbackTool(
    toolName: string,
    toolInput: any,
    sessionId: string,
    socket: any
): object {
    const tool = toolName.toLowerCase();
    console.log(`[Tool ⚡] ${toolName}`, JSON.stringify(toolInput));

    // ── triggerRegulationTechnique ────────────────────────────────────────────
    if (tool === 'triggerregulationtechnique') {
        const { technique, emotion, brain_region, intensity, rationale } = toolInput;

        socket.emit('emotionDetected', {
            emotion, brain_region, technique, intensity, confidence: 0.95
        });
        console.log(`[Tool] → emotionDetected emitted: ${emotion} / ${technique}`);

        maraStore.addTechnique(sessionId, technique);
        maraStore.addEmotionSnapshot(sessionId, {
            timestamp: Date.now(),
            emotion,
            brain_region,
            technique,
            confidence: 0.95,
            utterance: `[Nova Sonic triggered: ${rationale}]`,
        });

        return {
            success: true,
            activated: technique,
            brain_region_highlighted: brain_region,
            message: `${technique.replace(/_/g, ' ')} panel activated.`
        };
    }

    // ── logEmotionalInsight ───────────────────────────────────────────────────
    if (tool === 'logemotionalinsight') {
        const { insight, shift_detected, current_emotion, previous_emotion } = toolInput;

        if (shift_detected && current_emotion) {
            socket.emit('emotionShift', {
                from: previous_emotion || 'unknown',
                to: current_emotion,
                insight,
            });
            console.log(`[Tool] → emotionShift: ${previous_emotion} → ${current_emotion}`);
        }

        return { logged: true, insight };
    }

    console.warn(`[Tool] Unknown tool: ${toolName}`);
    return { error: `Tool ${toolName} not recognized` };
}

// ─── Session Event Handlers ───────────────────────────────────────────────────

function setupSessionEventHandlers(session: StreamSession, socket: any) {
    const sessionId = socket.id;

    session.onEvent('contentStart', (data) => {
        socket.emit('contentStart', data);
    });

    // ── textOutput: her USER utterance → Nova Lite + MARA ────────────────────
    session.onEvent('textOutput', async (data) => {
        socket.emit('textOutput', data);

        if (data.role === 'USER' && data.content?.trim().length > 8) {
            const utterance: string = data.content.trim();

            // MARA transcript 
            maraStore.addUtterance(sessionId, utterance);

            // Nova Lite classification — non-blocking
            classifyEmotionWithNovaLite(utterance, sessionId)
                .then(emotionData => {
                    if (emotionData.emotion !== 'neutral' && emotionData.confidence >= 0.45) {

                        // MARA timeline
                        const snapshot: EmotionSnapshot = {
                            timestamp: Date.now(),
                            emotion: emotionData.emotion,
                            brain_region: emotionData.brain_region,
                            technique: emotionData.technique,
                            confidence: emotionData.confidence,
                            utterance,
                        };
                        maraStore.addEmotionSnapshot(sessionId, snapshot);

                        socket.emit('emotionDetected', emotionData);

                        const mem = maraStore.getSession(sessionId);
                        if (mem) {
                            socket.emit('maraUpdate', {
                                dominantEmotion: mem.dominantEmotion,
                                emotionalArc: mem.emotionalArc,
                                utteranceCount: mem.utteranceCount,
                                techniqueHistory: mem.techniqueHistory,
                                recentHistory: mem.emotionHistory.slice(-5).map(s => ({
                                    emotion: s.emotion,
                                    confidence: s.confidence,
                                    timestamp: s.timestamp,
                                })),
                            });
                        }
                    }
                })
                .catch(e => console.error('[Nova Lite]', e));
        }
    });

    session.onEvent('audioOutput', (data) => {
        socket.emit('audioOutput', data);
    });

    session.onEvent('error', (data) => {
        console.error('[Session error]', data);
        socket.emit('error', data);
    });

    session.onEvent('contentEnd', (data) => {
        socket.emit('contentEnd', data);
    });

    session.onEvent('streamComplete', () => {
        console.log(`[Session] Stream complete: ${sessionId}`);
        socket.emit('streamComplete');
        sessionStates.set(sessionId, SessionState.CLOSED);
    });

    session.onEvent('toolEnd', async (data: any) => {
        const { toolName, toolUseContent } = data;

        let toolInput: any = {};
        try {
            if (toolUseContent?.content) {
                toolInput = JSON.parse(toolUseContent.content);
            }
        } catch {
            console.error('[Tool] Failed to parse tool input');
        }

        handleNeuroFeedbackTool(toolName, toolInput, sessionId, socket);
    });

    session.onEvent('usageEvent', (_data) => { /* intentionally silent */ });
}

// ─── Session Lifecycle ────────────────────────────────────────────────────────

async function createNewSession(socket: any): Promise<StreamSession> {
    const sessionId = socket.id;
    console.log(`[Session] Creating: ${sessionId}`);
    sessionStates.set(sessionId, SessionState.INITIALIZING);

    const session = bedrockClient.createStreamSession(sessionId);
    setupSessionEventHandlers(session, socket);

    // MARA memory başlat
    maraStore.createSession(sessionId);
    console.log(`[MARA] Memory initialized for ${sessionId}`);

    socketSessions.set(sessionId, session);
    sessionStates.set(sessionId, SessionState.READY);
    return session;
}

// ─── Socket.IO ────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);
    sessionStates.set(socket.id, SessionState.CLOSED);

    const connectionInterval = setInterval(() => {
        const count = Object.keys(io.sockets.sockets).length;
        console.log(`Active socket connections: ${count}`);
    }, 60000);

    // ── initializeConnection ──────────────────────────────────────────────────
    socket.on('initializeConnection', async (callback) => {
        try {
            const currentState = sessionStates.get(socket.id);
            console.log(`[Socket] initializeConnection for ${socket.id}, state: ${currentState}`);

            if (currentState === SessionState.INITIALIZING ||
                currentState === SessionState.READY ||
                currentState === SessionState.ACTIVE) {
                if (callback) callback({ success: true });
                return;
            }

            await createNewSession(socket);
            bedrockClient.initiateBidirectionalStreaming(socket.id);
            sessionStates.set(socket.id, SessionState.ACTIVE);
            if (callback) callback({ success: true });

        } catch (error) {
            console.error('[Socket] initializeConnection error:', error);
            sessionStates.set(socket.id, SessionState.CLOSED);
            if (callback) callback({
                success: false,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    });

    // ── audioInput ────────────────────────────────────────────────────────────
    socket.on('audioInput', async (audioData) => {
        try {
            const session = socketSessions.get(socket.id);
            const currentState = sessionStates.get(socket.id);
            if (!session || currentState !== SessionState.ACTIVE) return;

            const audioBuffer = typeof audioData === 'string'
                ? Buffer.from(audioData, 'base64')
                : Buffer.from(audioData);
            await session.streamAudio(audioBuffer);
        } catch (error) {
            console.error('[Socket] audioInput error:', error);
        }
    });

    // ── promptStart ───────────────────────────────────────────────────────────
    socket.on('promptStart', async () => {
        try {
            const session = socketSessions.get(socket.id);
            if (!session) { socket.emit('error', { message: 'No session for promptStart' }); return; }
            await session.setupSessionAndPromptStart();
            console.log(`[Socket] promptStart done: ${socket.id}`);
        } catch (error) {
            console.error('[Socket] promptStart error:', error);
            socket.emit('error', { message: 'Error in promptStart', details: String(error) });
        }
    });

    // ── systemPrompt: NeuroFeedback prompt + MARA memory inject ──────────────
    socket.on('systemPrompt', async (_clientPrompt) => {
        try {
            const session = socketSessions.get(socket.id);
            if (!session) { socket.emit('error', { message: 'No session for systemPrompt' }); return; }

            const maraCtx = maraStore.buildMemoryContext(socket.id);
            const fullPrompt = maraCtx
                ? `${NeuroFeedbackSystemPrompt}\n\n${maraCtx}`
                : NeuroFeedbackSystemPrompt;

            await session.setupSystemPrompt(undefined, fullPrompt);
            console.log(`[MARA] Memory injected into system prompt (${maraCtx.length} chars)`);
        } catch (error) {
            console.error('[Socket] systemPrompt error:', error);
            socket.emit('error', { message: 'Error in systemPrompt', details: String(error) });
        }
    });

    // ── audioStart ────────────────────────────────────────────────────────────
    socket.on('audioStart', async (_data) => {
        try {
            const session = socketSessions.get(socket.id);
            if (!session) { socket.emit('error', { message: 'No session for audioStart' }); return; }
            await session.setupStartAudio();
            console.log(`[Socket] audioStart done: ${socket.id}`);
            socket.emit('audioReady');
        } catch (error) {
            console.error('[Socket] audioStart error:', error);
            sessionStates.set(socket.id, SessionState.CLOSED);
            socket.emit('error', { message: 'Error in audioStart', details: String(error) });
        }
    });

    // ── stopAudio ─────────────────────────────────────────────────────────────
    socket.on('stopAudio', async () => {
        try {
            const session = socketSessions.get(socket.id);
            if (!session || cleanupInProgress.get(socket.id)) {
                console.log('[Socket] stopAudio: no session or cleanup in progress');
                return;
            }

            console.log(`[Socket] Stop audio: ${socket.id}`);
            cleanupInProgress.set(socket.id, true);
            sessionStates.set(socket.id, SessionState.CLOSED);

            const mem = maraStore.getSession(socket.id);
            if (mem) {
                socket.emit('sessionSummary', {
                    durationSeconds: Math.round((Date.now() - mem.startedAt) / 1000),
                    utteranceCount: mem.utteranceCount,
                    dominantEmotion: mem.dominantEmotion,
                    emotionalArc: mem.emotionalArc,
                    techniquesUsed: mem.techniqueHistory,
                    emotionTimeline: mem.emotionHistory.map(s => ({
                        emotion: s.emotion,
                        confidence: s.confidence,
                        msFromStart: s.timestamp - mem.startedAt,
                    })),
                });
            }

            await Promise.race([
                (async () => {
                    await session.endAudioContent();
                    await session.endPrompt();
                    await session.close();
                    console.log('[Socket] Session cleanup complete');
                })(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 5000))
            ]);

            socketSessions.delete(socket.id);
            cleanupInProgress.delete(socket.id);
            maraStore.deleteSession(socket.id);
            socket.emit('sessionClosed');

        } catch (error) {
            console.error('[Socket] stopAudio error:', error);
            try {
                bedrockClient.forceCloseSession(socket.id);
                socketSessions.delete(socket.id);
                cleanupInProgress.delete(socket.id);
                maraStore.deleteSession(socket.id);
                sessionStates.set(socket.id, SessionState.CLOSED);
            } catch (fe) {
                console.error('[Socket] Force cleanup error:', fe);
            }
            socket.emit('error', { message: 'Error stopping session', details: String(error) });
        }
    });

    // ── disconnect ────────────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
        console.log(`[Socket] Disconnected: ${socket.id}`);
        clearInterval(connectionInterval);

        const session = socketSessions.get(socket.id);
        const sessionId = socket.id;

        if (session && bedrockClient.isSessionActive(sessionId) && !cleanupInProgress.get(socket.id)) {
            try {
                console.log(`[Socket] Cleaning up abrupt disconnect: ${sessionId}`);
                cleanupInProgress.set(socket.id, true);
                await Promise.race([
                    (async () => {
                        await session.endAudioContent();
                        await session.endPrompt();
                        await session.close();
                    })(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Cleanup timeout')), 3000))
                ]);
            } catch (error) {
                console.error(`[Socket] Cleanup error after disconnect:`, error);
                try { bedrockClient.forceCloseSession(sessionId); } catch { }
            }
        }

        socketSessions.delete(socket.id);
        sessionStates.delete(socket.id);
        cleanupInProgress.delete(socket.id);
        maraStore.deleteSession(socket.id);
        console.log(`[Socket] Cleanup complete: ${socket.id}`);
    });
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`\n🧠  NeuroFeedback Lite  ·  MARA-powered backend`);
    console.log(`    http://localhost:${PORT}`);
    console.log(`    Nova Sonic : amazon.nova-2-sonic-v1:0`);
    console.log(`    Nova Lite  : amazon.nova-lite-v1:0\n`);
});

process.on('SIGINT', async () => {
    console.log('[Server] Shutting down...');
    const forceExitTimer = setTimeout(() => process.exit(1), 5000);
    try {
        await new Promise(resolve => io.close(resolve));
        const activeSessions = bedrockClient.getActiveSessions();
        await Promise.all(activeSessions.map(async (sessionId) => {
            try { await bedrockClient.closeSession(sessionId); }
            catch { bedrockClient.forceCloseSession(sessionId); }
        }));
        await new Promise(resolve => server.close(resolve));
        clearTimeout(forceExitTimer);
        process.exit(0);
    } catch (error) {
        console.error('[Server] Shutdown error:', error);
        process.exit(1);
    }
});