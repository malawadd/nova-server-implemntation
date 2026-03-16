"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { Socket } from "socket.io-client";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type {
  BrainRegion,
  SessionMode,
  SessionStatus,
  TranscriptMessage,
} from "@/lib/types";
import { NovaAudioCapture } from "@/lib/nova/audio/capture";
import { NovaAudioPlayer } from "@/lib/nova/audio/player";
import { buildNovaSystemPrompt } from "@/lib/nova/prompt";
import { connectSocket, createNovaSocket, initializeNovaSession } from "@/lib/nova/client";
import type {
  NovaContentEndEvent,
  NovaContentStartEvent,
  NovaErrorEvent,
  NovaProfileContext,
  NovaRole,
  NovaTextOutputEvent,
} from "@/lib/nova/types";
import { inferBrainActivation } from "./brainHeuristics";

type SessionBrainRegion = { region: string; timestamp: number; intensity: number };

interface UseNovaSessionArgs {
  sessionId: Id<"sessions">;
  initialStatus?: SessionStatus;
  mode?: SessionMode;
  techniqueUsed?: string;
  transcript: TranscriptMessage[];
  brainRegions: SessionBrainRegion[];
  profile?: NovaProfileContext | null;
}

const NOVA_SERVER_URL = process.env.NEXT_PUBLIC_NOVA_SERVER_URL;

export function useNovaSession({
  sessionId,
  initialStatus = "idle",
  mode,
  techniqueUsed,
  transcript,
  brainRegions,
  profile,
}: UseNovaSessionArgs) {
  const addMessage = useMutation(api.sessions.addMessage);
  const activateBrainRegion = useMutation(api.sessions.activateBrainRegion);
  const updateStatus = useMutation(api.sessions.updateStatus);

  const [status, setStatus] = useState<SessionStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [partialAssistantText, setPartialAssistantText] = useState("");
  const [activeRegion, setActiveRegion] = useState<BrainRegion | null>(null);
  const statusRef = useRef<SessionStatus>(initialStatus);

  const socketRef = useRef<Socket | null>(null);
  const captureRef = useRef<NovaAudioCapture | null>(null);
  const playerRef = useRef<NovaAudioPlayer | null>(null);
  const initializedRef = useRef(false);
  const currentRoleRef = useRef<NovaRole | null>(null);
  const captureAssistantTextRef = useRef(true);
  const userBufferRef = useRef("");
  const assistantBufferRef = useRef("");

  const regionHistory = useMemo(
    () => brainRegions.map(({ region, timestamp }) => ({ region, timestamp })),
    [brainRegions],
  );

  const resolvedActiveRegion = useMemo(() => {
    const latestPersistedRegion = brainRegions.at(-1)?.region as BrainRegion | undefined;
    return activeRegion ?? latestPersistedRegion ?? null;
  }, [activeRegion, brainRegions]);

  const persistStatus = useCallback(
    (nextStatus: SessionStatus, outcome?: string) => {
      if (statusRef.current === nextStatus && !outcome) {
        return;
      }

      statusRef.current = nextStatus;
      setStatus(nextStatus);
      void updateStatus({ sessionId, status: nextStatus, outcome }).catch(() => {});
    },
    [sessionId, updateStatus],
  );

  const persistMessage = useCallback(
    (role: "user" | "ai", text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const lastMessage = transcript.at(-1);
      if (lastMessage?.role === role && lastMessage.text.trim() === trimmed) {
        return;
      }

      const activation = inferBrainActivation(trimmed);

      setActiveRegion(activation.region);

      void addMessage({
        sessionId,
        role,
        text: trimmed,
        emotionCue: activation.emotionCue,
      }).catch(() => {});

      void activateBrainRegion({
        sessionId,
        region: activation.region,
        intensity: activation.intensity,
      }).catch(() => {});
    },
    [activateBrainRegion, addMessage, sessionId, transcript],
  );

  const finalizeBufferedText = useCallback(
    (role: NovaRole | null) => {
      if (role === "USER") {
        persistMessage("user", userBufferRef.current);
        userBufferRef.current = "";
        return;
      }

      if (role === "ASSISTANT") {
        persistMessage("ai", assistantBufferRef.current);
        assistantBufferRef.current = "";
        setPartialAssistantText("");
      }
    },
    [persistMessage],
  );

  const teardownSocket = useCallback(() => {
    initializedRef.current = false;
    currentRoleRef.current = null;
    socketRef.current?.removeAllListeners();
    socketRef.current?.disconnect();
    socketRef.current = null;
  }, []);

  const stopCapture = useCallback(() => {
    captureRef.current?.stop();
  }, []);

  const endSession = useCallback(async () => {
    stopCapture();
    playerRef.current?.bargeIn();
    teardownSocket();
    setPartialAssistantText("");
    setError(null);
  }, [stopCapture, teardownSocket]);

  const attachSocketListeners = useCallback(
    (socket: Socket) => {
      socket.on("contentStart", (event: NovaContentStartEvent) => {
        if (event.type !== "TEXT") return;

        currentRoleRef.current = event.role ?? currentRoleRef.current;
        captureAssistantTextRef.current = true;

        if (currentRoleRef.current === "ASSISTANT" && event.additionalModelFields) {
          try {
            const additionalFields = JSON.parse(event.additionalModelFields) as {
              generationStage?: string;
            };
            captureAssistantTextRef.current = additionalFields.generationStage === "SPECULATIVE";
          } catch {
            captureAssistantTextRef.current = true;
          }
        }

        if (currentRoleRef.current === "ASSISTANT") {
          persistStatus("responding");
          assistantBufferRef.current = "";
          setPartialAssistantText("");
        }

        if (currentRoleRef.current === "USER") {
          userBufferRef.current = "";
        }
      });

      socket.on("textOutput", (event: NovaTextOutputEvent) => {
        const role = currentRoleRef.current ?? event.role ?? null;
        const content = event.content ?? "";
        if (!role || !content) return;

        if (role === "USER") {
          userBufferRef.current += content;
          persistStatus("processing");
          return;
        }

        if (!captureAssistantTextRef.current) {
          return;
        }

        assistantBufferRef.current += content;
        setPartialAssistantText(assistantBufferRef.current);
        persistStatus("responding");
      });

      socket.on("audioOutput", (event: { content?: string }) => {
        const audioContent = event.content ?? "";
        if (!audioContent) return;

        if (statusRef.current === "listening" || statusRef.current === "processing") {
          return;
        }

        persistStatus("responding");
        void playerRef.current?.playBase64(audioContent);
      });

      socket.on("contentEnd", (event: NovaContentEndEvent) => {
        if (event.type !== "TEXT") return;

        const stopReason = event.stopReason?.toUpperCase();
        const wasInterrupted = stopReason === "INTERRUPTED";

        if (wasInterrupted && currentRoleRef.current === "ASSISTANT") {
          playerRef.current?.bargeIn();
        }

        finalizeBufferedText(currentRoleRef.current);

        if (currentRoleRef.current === "USER") {
          persistStatus("processing");
        }

        if (currentRoleRef.current === "ASSISTANT" && !wasInterrupted && statusRef.current === "responding") {
          persistStatus("idle");
        }

        currentRoleRef.current = null;
      });

      socket.on("streamComplete", () => {
        finalizeBufferedText(currentRoleRef.current);
        persistStatus("idle");
        initializedRef.current = false;
        socket.disconnect();
      });

      socket.on("disconnect", () => {
        initializedRef.current = false;
      });

      socket.on("error", (event: NovaErrorEvent) => {
        setError(event.details ?? event.message ?? "Nova connection failed");
        persistStatus("idle");
      });
    },
    [finalizeBufferedText, persistStatus],
  );

  const ensureSocket = useCallback(async () => {
    if (!NOVA_SERVER_URL) {
      throw new Error("Missing NEXT_PUBLIC_NOVA_SERVER_URL");
    }

    if (!socketRef.current) {
      socketRef.current = createNovaSocket(NOVA_SERVER_URL);
      attachSocketListeners(socketRef.current);
    }

    await connectSocket(socketRef.current);

    if (!initializedRef.current) {
      const systemPrompt = buildNovaSystemPrompt({
        mode,
        techniqueUsed,
        profile,
      });
      await initializeNovaSession(socketRef.current, systemPrompt);
      initializedRef.current = true;
    }

    return socketRef.current;
  }, [attachSocketListeners, mode, profile, techniqueUsed]);

  const beginListening = useCallback(async () => {
    if (!playerRef.current) {
      playerRef.current = new NovaAudioPlayer();
    }

    if (!captureRef.current) {
      captureRef.current = new NovaAudioCapture();
    }

    await playerRef.current.start();
    const socket = await ensureSocket();
    await captureRef.current.start((chunk) => {
      socket.emit("audioInput", chunk);
    });
    persistStatus("listening");
  }, [ensureSocket, persistStatus]);

  const toggleMic = useCallback(async () => {
    setError(null);

    if (status === "listening") {
      stopCapture();
      persistStatus("processing");
      socketRef.current?.emit("stopAudio");
      return;
    }

    if (status === "processing") {
      return;
    }

    if (status !== "idle" && status !== "responding") {
      return;
    }

    try {
      if (status === "responding") {
        playerRef.current?.bargeIn();
      }

      await beginListening();
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to start microphone";
      setError(message);
      persistStatus("idle");
    }
  }, [beginListening, persistStatus, status, stopCapture]);

  useEffect(() => {
    return () => {
      void captureRef.current?.dispose();
      void playerRef.current?.stop();
      teardownSocket();
    };
  }, [teardownSocket]);

  return {
    status,
    transcript,
    regionHistory,
    activeRegion: resolvedActiveRegion,
    partialAssistantText,
    error,
    toggleMic,
    endSession,
  };
}
