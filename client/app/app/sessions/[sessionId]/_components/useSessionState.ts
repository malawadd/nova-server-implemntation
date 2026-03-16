"use client";

import { useState, useCallback } from "react";
import type { SessionStatus } from "@/lib/types";

export interface SessionStateValue {
  status: SessionStatus;
  activeRegion: string | null;
  elapsed: number; // seconds
}

export interface SessionStateActions {
  startListening: () => void;
  stopListening: () => void;
  setProcessing: () => void;
  setResponding: () => void;
  setExerciseStep: () => void;
  pause: () => void;
  resume: () => void;
  complete: (outcome?: string) => void;
  activateRegion: (region: string) => void;
}

const TRANSITIONS: Partial<Record<SessionStatus, SessionStatus[]>> = {
  idle: ["listening"],
  listening: ["processing", "paused"],
  processing: ["responding", "paused"],
  responding: ["listening", "exerciseStep", "paused", "completed"],
  exerciseStep: ["listening", "responding", "paused", "completed"],
  paused: ["listening", "completed"],
};

function canTransition(from: SessionStatus, to: SessionStatus) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function useSessionState(): [SessionStateValue, SessionStateActions] {
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [elapsed] = useState(0);

  const transition = useCallback((to: SessionStatus) => {
    setStatus((curr) => {
      if (curr === "idle" || canTransition(curr, to)) return to;
      return curr;
    });
  }, []);

  const actions: SessionStateActions = {
    startListening: () => transition("listening"),
    stopListening: () => transition("processing"),
    setProcessing: () => transition("processing"),
    setResponding: () => transition("responding"),
    setExerciseStep: () => transition("exerciseStep"),
    pause: () => transition("paused"),
    resume: () => transition("listening"),
    complete: () => transition("completed"),
    activateRegion: (region) => setActiveRegion(region),
  };

  return [{ status, activeRegion, elapsed }, actions];
}
