"use client";

import React, { useEffect, useRef, useState } from "react";
import type { TranscriptMessage } from "@/lib/types";
import EmotionCue from "@/components/ui/EmotionCue";

interface ConversationPanelProps {
  transcript: TranscriptMessage[];
  isStreaming?: boolean;
  partialAssistantText?: string;
  error?: string | null;
}

export default function ConversationPanel({
  transcript,
  isStreaming = false,
  partialAssistantText = "",
  error = null,
}: ConversationPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [whyOpen, setWhyOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [error, partialAssistantText, transcript]);

  function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div
      className="session-conversation-panel"
      style={{ background: "var(--retro-surface)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 border-b"
        style={{ borderColor: "var(--border)", borderWidth: "var(--border-width)", background: "var(--retro-surface)" }}
      >
        <h4 className="neon-text text-sm">CONVERSATION</h4>
        <button
          onClick={() => setWhyOpen((o) => !o)}
          className="nav-link text-xs"
          style={{ padding: "4px 10px" }}
        >
          {whyOpen ? "▲ Hide" : "▾ Why this?"}
        </button>
      </div>

      {/* Why disclosure drawer */}
      {whyOpen && (
        <div
          className="px-4 py-3 border-b slide-up text-xs font-medium opacity-70 leading-relaxed"
          style={{
            background: `color-mix(in srgb, var(--retro-neon-purple) 10%, var(--retro-surface))`,
            borderColor: "var(--border)",
            borderWidth: "var(--border-width)",
          }}
        >
          <strong className="font-black uppercase tracking-wide opacity-100">
            Why I&apos;m suggesting this:
          </strong>{" "}
          Your cortisol markers and breathing pattern suggest elevated amygdala activation. Box breathing
          activates the prefrontal cortex via vagal tone stimulation — this is the most
          evidence-backed intervention for acute stress.
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {transcript.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-widest opacity-40">
                {msg.role === "ai" ? "◈ AI" : "You"}
              </span>
              <span className="text-xs opacity-30 mono">{formatTime(msg.timestamp)}</span>
              {msg.emotionCue && (
                <EmotionCue
                  text={msg.emotionCue}
                  direction={
                    msg.emotionCue.includes("rising") ? "rising" :
                    msg.emotionCue.includes("calm") ? "falling" : "stable"
                  }
                />
              )}
            </div>
            <div className={`chat-bubble ${msg.role === "ai" ? "chat-bubble-ai" : "chat-bubble-user"}`}>
              {msg.text}
            </div>
          </div>
        ))}

        {partialAssistantText && (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs font-black uppercase tracking-widest opacity-40">◈ AI</span>
            <div className="chat-bubble chat-bubble-ai">
              {partialAssistantText}
            </div>
          </div>
        )}

        {isStreaming && !partialAssistantText && (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs font-black uppercase tracking-widest opacity-40">◈ AI</span>
            <div className="chat-bubble chat-bubble-ai flex items-center gap-1">
              <span className="animate-pulse">●</span>
              <span className="animate-pulse delay-75">●</span>
              <span className="animate-pulse delay-150">●</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className="hybrid-surface p-3 text-xs font-medium"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
