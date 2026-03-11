import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
  InvokeModelWithBidirectionalStreamInput,
} from "@aws-sdk/client-bedrock-runtime";
import { EventEmitter } from "events";
import {
  DefaultAudioInputConfiguration,
  DefaultAudioOutputConfiguration,
  DefaultInferenceConfiguration,
  DefaultTextConfiguration,
  RegulationTechniqueToolSchema,
  EmotionalInsightToolSchema,
} from "./consts";
import { SessionConfig } from "./types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SessionOptions {
  inferenceConfig?: typeof DefaultInferenceConfiguration;
  audioInputConfig?: typeof DefaultAudioInputConfiguration;
  audioOutputConfig?: typeof DefaultAudioOutputConfiguration;
  textConfig?: typeof DefaultTextConfiguration;
  systemPrompt?: string;
}

// ─── StreamSession ────────────────────────────────────────────────────────────

export class StreamSession {
  private eventEmitter = new EventEmitter();
  private sessionId: string;
  private client: NovaSonicBidirectionalStreamClient;
  private options: SessionOptions;
  private activeToolUse: { id: string; name: string; content: string } | null = null;

  // Queued events sent before stream is ready
  private pendingEvents: Array<() => Promise<void>> = [];
  private streamReady = false;

  // Stream control
  private sendQueue: Buffer[] = [];
  private isSending = false;
  private streamClosed = false;

  // The AWS stream (set by NovaSonicBidirectionalStreamClient)
  public stream: any = null;

  constructor(sessionId: string, client: NovaSonicBidirectionalStreamClient, options: SessionOptions = {}) {
    this.sessionId = sessionId;
    this.client = client;
    this.options = options;
    this.eventEmitter.setMaxListeners(50);
  }

  onEvent(event: string, handler: (data: any) => void): void {
    this.eventEmitter.on(event, handler);
  }

  emit(event: string, data?: any): void {
    this.eventEmitter.emit(event, data);
  }

  // ── Setup methods ──────────────────────────────────────────────────────────

  async setupSessionAndPromptStart(): Promise<void> {
    await this.sendEvent(this.buildSessionStartEvent());
    await this.sendEvent(this.buildPromptStartEvent());
  }

  async setupSystemPrompt(config?: Partial<SessionOptions>, systemPromptText?: string): Promise<void> {
    const text = systemPromptText || this.options.systemPrompt || "You are a helpful assistant.";
    await this.sendEvent(this.buildSystemPromptEvent(text));
  }

  async setupStartAudio(): Promise<void> {
    await this.sendEvent(this.buildAudioStartEvent());
  }

  async streamAudio(audioChunk: Buffer): Promise<void> {
    await this.sendEvent(this.buildAudioInputEvent(audioChunk));
  }

  async endAudioContent(): Promise<void> {
    await this.sendEvent(this.buildAudioEndEvent());
  }

  async endPrompt(): Promise<void> {
    await this.sendEvent(this.buildPromptEndEvent());
  }

  async close(): Promise<void> {
    await this.sendEvent(this.buildSessionEndEvent());
    this.streamClosed = true;
  }

  // ── Event builders ─────────────────────────────────────────────────────────

  private buildSessionStartEvent() {
    return {
      event: {
        sessionStart: {
          inferenceConfiguration: this.options.inferenceConfig || DefaultInferenceConfiguration,
        }
      }
    };
  }

  private buildPromptStartEvent() {
    return {
      event: {
        promptStart: {
          promptName: this.sessionId,
          textOutputConfiguration: { mediaType: "text/plain" },
          audioOutputConfiguration: this.options.audioOutputConfig || DefaultAudioOutputConfiguration,
          toolConfiguration: {
            tools: [
              {
                toolSpec: {
                  name: "triggerRegulationTechnique",
                  description: "Activates a visual regulation technique panel for the user and highlights the corresponding brain region on the 3D brain model. Call this when you decide to guide the user into a specific evidence-based technique. This will automatically open the exercise panel on screen.",
                  inputSchema: {
                    json: RegulationTechniqueToolSchema
                  }
                }
              },
              {
                toolSpec: {
                  name: "logEmotionalInsight",
                  description: "Logs an emotional insight or state shift into the session memory (MARA). Call this when you have a clear read on the user's emotional state or notice a meaningful shift between turns.",
                  inputSchema: {
                    json: EmotionalInsightToolSchema
                  }
                }
              }
            ]
          }
        }
      }
    };
  }

  private buildSystemPromptEvent(text: string) {
    return {
      event: {
        contentStart: {
          promptName: this.sessionId,
          contentName: `${this.sessionId}-system`,
          type: "TEXT",
          role: "SYSTEM",
          interactive: false,
          textInputConfiguration: this.options.textConfig || DefaultTextConfiguration,
        }
      }
    };
    // Note: actual text is sent as a separate textInput event — handled below
  }

  private buildAudioStartEvent() {
    return {
      event: {
        contentStart: {
          promptName: this.sessionId,
          contentName: `${this.sessionId}-audio`,
          type: "AUDIO",
          role: "USER",
          interactive: true,
          audioInputConfiguration: this.options.audioInputConfig || DefaultAudioInputConfiguration,
        }
      }
    };
  }

  private buildAudioInputEvent(audioChunk: Buffer) {
    return {
      event: {
        audioInput: {
          promptName: this.sessionId,
          contentName: `${this.sessionId}-audio`,
          content: audioChunk.toString("base64"),
        }
      }
    };
  }

  private buildAudioEndEvent() {
    return {
      event: {
        contentEnd: {
          promptName: this.sessionId,
          contentName: `${this.sessionId}-audio`,
        }
      }
    };
  }

  private buildPromptEndEvent() {
    return {
      event: {
        promptEnd: {
          promptName: this.sessionId,
        }
      }
    };
  }

  private buildSessionEndEvent() {
    return {
      event: {
        sessionEnd: {}
      }
    };
  }

  // ── Stream send ────────────────────────────────────────────────────────────

  private async sendEvent(event: object): Promise<void> {
    if (this.stream && !this.streamClosed) {
      try {
        await this.stream.send(event);
      } catch (e) {
        console.error(`[Session ${this.sessionId}] Error sending event:`, e);
      }
    }
  }

  // ── Tool use processing ────────────────────────────────────────────────────

  /**
   * processToolUse is called by NovaSonicBidirectionalStreamClient
   * when Nova Sonic completes a tool call.
   *
   * NeuroFeedback tools are handled via the 'toolEnd' event in server.ts.
   * We return a simple acknowledgment here so the stream can continue.
   */
  async processToolUse(toolName: string, toolUseContent: object): Promise<object> {
    const tool = toolName.toLowerCase();

    // ── NeuroFeedback tools ────────────────────────────────────────────────
    // Side effects (brain visualization, MARA memory, frontend emit)
    // are all handled in server.ts via the 'toolEnd' event.
    // We just return an acknowledgment so Nova Sonic can continue speaking.
    if (tool === "triggerregulationtechnique") {
      console.log(`[Tool] triggerRegulationTechnique acknowledged`);
      return {
        success: true,
        message: "Regulation technique panel has been activated for the user."
      };
    }

    if (tool === "logemotionalinsight") {
      console.log(`[Tool] logEmotionalInsight acknowledged`);
      return {
        logged: true,
        message: "Emotional insight recorded in session memory."
      };
    }

    // ── Fallback ───────────────────────────────────────────────────────────
    console.warn(`[Tool] Unknown tool called: ${toolName}`);
    return {
      error: `Tool '${toolName}' is not supported in this session.`
    };
  }
}

// ─── NovaSonicBidirectionalStreamClient ──────────────────────────────────────

interface ClientConfig {
  requestHandlerConfig?: { maxConcurrentStreams?: number };
  clientConfig: {
    region: string;
    credentials: any;
  };
}

export class NovaSonicBidirectionalStreamClient {
  private bedrockClient: BedrockRuntimeClient;
  private activeSessions = new Map<string, StreamSession>();
  private lastActivityTime = new Map<string, number>();
  private activeStreams = new Map<string, any>();

  constructor(config: ClientConfig) {
    this.bedrockClient = new BedrockRuntimeClient({
      region: config.clientConfig.region,
      credentials: config.clientConfig.credentials,
      requestHandler: {
        requestTimeout: 300000,
        connectionTimeout: 10000,
        ...config.requestHandlerConfig,
      } as any,
    });
  }

  // ── Session lifecycle ──────────────────────────────────────────────────────

  createStreamSession(sessionId: string, options: SessionOptions = {}): StreamSession {
    const session = new StreamSession(sessionId, this, options);
    this.activeSessions.set(sessionId, session);
    this.lastActivityTime.set(sessionId, Date.now());
    return session;
  }

  isSessionActive(sessionId: string): boolean {
    return this.activeSessions.has(sessionId) && this.activeStreams.has(sessionId);
  }

  getActiveSessions(): string[] {
    return Array.from(this.activeSessions.keys());
  }

  getLastActivityTime(sessionId: string): number {
    return this.lastActivityTime.get(sessionId) || 0;
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        await session.endAudioContent();
        await session.endPrompt();
        await session.close();
      } finally {
        this.cleanupSession(sessionId);
      }
    }
  }

  forceCloseSession(sessionId: string): void {
    const stream = this.activeStreams.get(sessionId);
    if (stream) {
      try { stream.close?.(); } catch { }
    }
    this.cleanupSession(sessionId);
  }

  private cleanupSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.lastActivityTime.delete(sessionId);
    this.activeStreams.delete(sessionId);
  }

  // ── Bidirectional streaming ────────────────────────────────────────────────

  initiateBidirectionalStreaming(sessionId: string): void {
    const session = this.activeSessions.get(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    this.startStreamingAsync(sessionId, session).catch(e => {
      console.error(`[Client] Streaming error for ${sessionId}:`, e);
      session.emit("error", { message: String(e) });
    });
  }

  private async startStreamingAsync(sessionId: string, session: StreamSession): Promise<void> {
    const modelId = "amazon.nova-sonic-v1:0";

    try {
      const command = new InvokeModelWithBidirectionalStreamCommand({
        modelId,
        body: this.createAsyncIterable(sessionId, session),
      } as unknown as InvokeModelWithBidirectionalStreamInput);

      const response = await this.bedrockClient.send(command as any);
      this.activeStreams.set(sessionId, response);

      // Process response stream
      const body = (response as any).body;
      if (!body) {
        console.error(`[Client] No response body for ${sessionId}`);
        return;
      }

      for await (const event of body) {
        this.lastActivityTime.set(sessionId, Date.now());
        await this.handleStreamEvent(event, session, sessionId);
      }
    } catch (e: any) {
      if (!e.message?.includes("cancelled") && !e.message?.includes("closed")) {
        console.error(`[Client] Stream error for ${sessionId}:`, e.message);
        session.emit("error", { message: e.message });
      }
    } finally {
      session.emit("streamComplete");
      this.cleanupSession(sessionId);
    }
  }

  private createAsyncIterable(sessionId: string, session: StreamSession): AsyncIterable<any> {
    const queue: any[] = [];
    const resolvers: Array<(val: IteratorResult<any>) => void> = [];
    let done = false;

    // Attach send function to session
    (session as any).stream = {
      send: async (event: any) => {
        if (done) return;
        const chunk = { chunk: { bytes: Buffer.from(JSON.stringify(event)) } };
        if (resolvers.length > 0) {
          resolvers.shift()!({ value: chunk, done: false });
        } else {
          queue.push(chunk);
        }
        this.lastActivityTime.set(sessionId, Date.now());
      },
      close: () => {
        done = true;
        while (resolvers.length > 0) {
          resolvers.shift()!({ value: undefined, done: true });
        }
      }
    };

    return {
      [Symbol.asyncIterator]() {
        return {
          next(): Promise<IteratorResult<any>> {
            if (queue.length > 0) {
              return Promise.resolve({ value: queue.shift(), done: false });
            }
            if (done) {
              return Promise.resolve({ value: undefined, done: true });
            }
            return new Promise(resolve => resolvers.push(resolve));
          },
          return(): Promise<IteratorResult<any>> {
            done = true;
            return Promise.resolve({ value: undefined, done: true });
          }
        };
      }
    };
  }

  // ── Event handling ─────────────────────────────────────────────────────────

  private async handleStreamEvent(event: any, session: StreamSession, sessionId: string): Promise<void> {
    try {
      let parsed: any;

      // Parse the event bytes
      if (event?.chunk?.bytes) {
        const text = new TextDecoder().decode(event.chunk.bytes);
        try { parsed = JSON.parse(text); } catch { return; }
      } else if (event?.internalServerException) {
        session.emit("error", { message: "Internal server error from Bedrock" });
        return;
      } else {
        return;
      }

      const ev = parsed?.event;
      if (!ev) return;

      // ── completionStart ──────────────────────────────────────────────
      if (ev.completionStart) {
        session.emit("completionStart", ev.completionStart);
        return;
      }

      // ── contentStart ─────────────────────────────────────────────────
      if (ev.contentStart) {
        session.emit("contentStart", ev.contentStart);

        // Track tool use blocks
        if (ev.contentStart.type === "TOOL") {
          this.activeToolUseForSession(sessionId, ev.contentStart);
        }
        return;
      }

      // ── textOutput ───────────────────────────────────────────────────
      if (ev.textOutput) {
        session.emit("textOutput", ev.textOutput);
        return;
      }

      // ── audioOutput ──────────────────────────────────────────────────
      if (ev.audioOutput) {
        session.emit("audioOutput", ev.audioOutput);
        return;
      }

      // ── toolUse ──────────────────────────────────────────────────────
      if (ev.toolUse) {
        const toolData = ev.toolUse;
        session.emit("toolUse", { toolName: toolData.toolName, toolUseId: toolData.toolUseId });
        // Accumulate tool input
        this.accumulateToolInput(sessionId, toolData);
        return;
      }

      // ── contentEnd ───────────────────────────────────────────────────
      if (ev.contentEnd) {
        const contentEnd = ev.contentEnd;
        session.emit("contentEnd", contentEnd);

        // If this ends a TOOL block, process it
        if (contentEnd.type === "TOOL") {
          await this.finalizeToolUse(session, sessionId, contentEnd);
        }
        return;
      }

      // ── usageEvent ───────────────────────────────────────────────────
      if (ev.usageEvent) {
        session.emit("usageEvent", ev.usageEvent);
        return;
      }

    } catch (e) {
      console.error(`[Client] Error handling stream event:`, e);
    }
  }

  // ── Tool use tracking ──────────────────────────────────────────────────────

  private toolAccumulators = new Map<string, { id: string; name: string; input: string }>();

  private activeToolUseForSession(sessionId: string, contentStart: any): void {
    if (contentStart.toolUse) {
      this.toolAccumulators.set(sessionId, {
        id: contentStart.toolUse.toolUseId || "",
        name: contentStart.toolUse.toolName || "",
        input: "",
      });
    }
  }

  private accumulateToolInput(sessionId: string, toolUse: any): void {
    const acc = this.toolAccumulators.get(sessionId);
    if (acc && toolUse.content) {
      acc.input += toolUse.content;
    }
  }

  private async finalizeToolUse(session: StreamSession, sessionId: string, contentEnd: any): Promise<void> {
    const acc = this.toolAccumulators.get(sessionId);
    if (!acc) return;

    let toolInput: any = {};
    try {
      if (acc.input.trim()) toolInput = JSON.parse(acc.input);
    } catch {
      console.error(`[Client] Failed to parse tool input for ${acc.name}:`, acc.input);
    }

    // Emit toolEnd for server.ts side effects (brain visualization, MARA)
    session.emit("toolEnd", {
      toolName: acc.name,
      toolUseId: acc.id,
      toolUseContent: { content: acc.input },
    });

    // Get the tool result (from session.processToolUse)
    let toolResult: object = { acknowledged: true };
    try {
      toolResult = await session.processToolUse(acc.name, toolInput);
    } catch (e) {
      console.error(`[Client] processToolUse error:`, e);
    }

    // Send tool result back to Nova Sonic so it can continue speaking
    try {
      const toolResultContentName = `${sessionId}-tool-result-${acc.id}`;
      await (session as any).stream.send({
        event: {
          contentStart: {
            promptName: sessionId,
            contentName: toolResultContentName,
            type: "TOOL",
            role: "TOOL",
            interactive: false,
            toolResultInputConfiguration: {
              toolUseId: acc.id,
              type: "TEXT",
              textInputConfiguration: { mediaType: "text/plain" },
            }
          }
        }
      });
      await (session as any).stream.send({
        event: {
          toolResult: {
            promptName: sessionId,
            contentName: toolResultContentName,
            content: JSON.stringify(toolResult),
          }
        }
      });
      await (session as any).stream.send({
        event: {
          contentEnd: {
            promptName: sessionId,
            contentName: toolResultContentName,
          }
        }
      });
    } catch (e) {
      console.error(`[Client] Error sending tool result:`, e);
    }

    this.toolAccumulators.delete(sessionId);
    session.emit("toolResult", { toolName: acc.name, result: toolResult });
  }
}