"use client";

import React, { useState } from "react";
import type { SessionStatus } from "@/lib/types";

interface SessionControlsProps {
  status: SessionStatus;
  onToggleMic: () => void;
  onSwitchMode: () => void;
  onPause: () => void;
  onEnd: () => void;
  onGround: () => void;
  mode: "talk" | "exercise";
}

const STATUS_LABELS: Record<SessionStatus, string> = {
  idle: "Ready",
  listening: "Listening…",
  processing: "Processing…",
  responding: "AI Responding…",
  exerciseStep: "Exercise",
  paused: "Paused",
  completed: "Completed",
};

export default function SessionControls({
  status,
  onToggleMic,
  onSwitchMode,
  onEnd,
  onGround,
  mode,
}: SessionControlsProps) {
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const isListening = status === "listening";
  const canMic = ["idle", "listening", "responding"].includes(status);

  return (
    <div
      className="session-controls-bar px-4 py-3 flex items-center gap-3 flex-wrap"
      style={{ background: "var(--retro-surface)" }}
    >
      {/* State badge */}
      <span className={`state-badge state-${status}`}>
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "currentColor",
            opacity: 0.8,
          }}
        />
        {STATUS_LABELS[status]}
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Ground button — always visible */}
      <button
        onClick={onGround}
        className="neobrutalism-btn text-xs px-3 py-2"
        style={{ borderColor: "var(--success)", color: "var(--success)" }}
        title="Quick grounding exercise"
      >
        ◎ Ground
      </button>

      {/* Switch mode */}
      <button
        onClick={onSwitchMode}
        className="neobrutalism-btn text-xs px-3 py-2"
      >
        {mode === "talk" ? "⊕ Guided" : "▷ Talk"}
      </button>

      {/* Mic button */}
      <button
        onClick={onToggleMic}
        disabled={!canMic}
        className={`mic-btn ${isListening ? "mic-btn-listen" : ""}`}
        title={isListening ? "Stop" : "Speak"}
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening ? "■" : "◉"}
      </button>

      {/* End session */}
      {!showEndConfirm ? (
        <button
          onClick={() => setShowEndConfirm(true)}
          className="neobrutalism-btn text-xs px-3 py-2"
          style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
        >
          End Session
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--danger)" }}>
            End?
          </span>
          <button
            onClick={onEnd}
            className="neobrutalism-btn text-xs px-3 py-2"
            style={{ background: "var(--danger)", color: "white", borderColor: "var(--border)" }}
          >
            Yes, End
          </button>
          <button
            onClick={() => setShowEndConfirm(false)}
            className="neobrutalism-btn text-xs px-3 py-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
