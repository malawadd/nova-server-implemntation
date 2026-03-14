/**
 * MARA — Memory Augmented Regulation Agent */

export interface EmotionSnapshot {
    timestamp: number;
    emotion: 'anxiety' | 'stress' | 'sadness' | 'neutral';
    brain_region: 'amygdala' | 'insula' | 'prefrontal_cortex' | 'none';
    technique: 'box_breathing' | 'body_scan' | 'cognitive_reframe' | 'none';
    confidence: number;
    utterance: string;
}

export interface SessionMemory {
    sessionId: string;
    startedAt: number;
    emotionHistory: EmotionSnapshot[];
    techniqueHistory: string[];
    dominantEmotion: string;
    emotionalArc: 'improving' | 'worsening' | 'stable' | 'unknown';
    utteranceCount: number;
    fullTranscript: string;
}

export class MARAMemoryStore {
    private sessions = new Map<string, SessionMemory>();

    createSession(sessionId: string): SessionMemory {
        const memory: SessionMemory = {
            sessionId,
            startedAt: Date.now(),
            emotionHistory: [],
            techniqueHistory: [],
            dominantEmotion: 'neutral',
            emotionalArc: 'unknown',
            utteranceCount: 0,
            fullTranscript: '',
        };
        this.sessions.set(sessionId, memory);
        return memory;
    }

    getSession(sessionId: string): SessionMemory | undefined {
        return this.sessions.get(sessionId);
    }

    deleteSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    addUtterance(sessionId: string, text: string): void {
        const mem = this.sessions.get(sessionId);
        if (!mem) return;
        mem.utteranceCount++;
        mem.fullTranscript = (mem.fullTranscript + ' ' + text).trim();
        if (mem.fullTranscript.length > 800) {
            mem.fullTranscript = mem.fullTranscript.slice(-800);
        }
    }

    addEmotionSnapshot(sessionId: string, snapshot: EmotionSnapshot): void {
        const mem = this.sessions.get(sessionId);
        if (!mem) return;
        mem.emotionHistory.push(snapshot);
        if (mem.emotionHistory.length > 20) mem.emotionHistory.shift();

        const recent = mem.emotionHistory.slice(-5);
        const counts: Record<string, number> = {};
        recent.forEach(s => { counts[s.emotion] = (counts[s.emotion] || 0) + 1; });
        mem.dominantEmotion = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

        mem.emotionalArc = this.computeArc(mem.emotionHistory);
    }

    addTechnique(sessionId: string, technique: string): void {
        const mem = this.sessions.get(sessionId);
        if (!mem || technique === 'none') return;
        if (!mem.techniqueHistory.includes(technique)) {
            mem.techniqueHistory.push(technique);
        }
    }


    buildMemoryContext(sessionId: string): string {
        const mem = this.sessions.get(sessionId);
        if (!mem || mem.emotionHistory.length === 0) return '';

        const durationMin = Math.round((Date.now() - mem.startedAt) / 60000);
        const recentEmotions = mem.emotionHistory.slice(-3).map(s => s.emotion).join(' → ');
        const arcDesc = {
            improving: 'The user appears to be calming down.',
            worsening: 'The user seems to be getting more distressed.',
            stable: 'Emotional state is stable.',
            unknown: '',
        }[mem.emotionalArc];

        const techniquesUsed = mem.techniqueHistory.length > 0
            ? `Already suggested: ${mem.techniqueHistory.map(t => t.replace(/_/g, ' ')).join(', ')}. Do NOT repeat these.`
            : 'No techniques suggested yet.';

        return `[MARA SESSION MEMORY — ${durationMin}min in, utterance #${mem.utteranceCount}]
Emotional journey: ${recentEmotions}
Dominant state: ${mem.dominantEmotion}
Arc: ${arcDesc}
${techniquesUsed}
[END MARA]`;
    }

    private computeArc(history: EmotionSnapshot[]): SessionMemory['emotionalArc'] {
        if (history.length < 3) return 'unknown';
        const SEVERITY: Record<string, number> = { neutral: 0, sadness: 1, stress: 2, anxiety: 3 };
        const recent = history.slice(-3).map(s => SEVERITY[s.emotion] || 0);
        const older = history.slice(-6, -3).map(s => SEVERITY[s.emotion] || 0);
        if (older.length === 0) return 'unknown';
        const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const diff = avg(recent) - avg(older);
        if (diff < -0.3) return 'improving';
        if (diff > 0.3) return 'worsening';
        return 'stable';
    }
}

// Singleton export
export const maraStore = new MARAMemoryStore();