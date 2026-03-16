"use client";

import React from "react";

const STYLES = [
  {
    id: "gentle",
    icon: "🌿",
    title: "Gentle",
    desc: "Warm, patient, encouraging. The AI takes it slow, never pushes, and celebrates small wins.",
    color: "var(--success)",
  },
  {
    id: "direct",
    icon: "⚡",
    title: "Direct",
    desc: "Concise, structured, action-oriented. Gets straight to techniques. No fluff.",
    color: "var(--retro-neon-cyan)",
  },
];

interface StyleStepProps {
  selected: "gentle" | "direct" | null;
  onChange: (style: "gentle" | "direct") => void;
}

export default function StyleStep({ selected, onChange }: StyleStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="neon-text">YOUR PREFERRED STYLE</h3>
        <p className="text-sm font-medium opacity-60 mt-2">
          How should your AI companion communicate with you?
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
        {STYLES.map((s) => {
          const active = selected === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id as "gentle" | "direct")}
              className="hybrid-surface text-left p-6 flex flex-col gap-3 cursor-pointer transition-all duration-150"
              style={{
                background: active
                  ? `color-mix(in srgb, ${s.color} 18%, var(--retro-surface))`
                  : "var(--retro-surface)",
                borderColor: active ? s.color : "var(--border)",
                boxShadow: active
                  ? `6px 6px 0 ${s.color}, 0 0 20px color-mix(in srgb, ${s.color} 35%, transparent)`
                  : undefined,
                transform: active ? "translate(2px, 2px)" : undefined,
              }}
            >
              <span style={{ fontSize: 40 }}>{s.icon}</span>
              <h4 style={{ color: active ? s.color : "var(--foreground)" }}>{s.title}</h4>
              <p className="text-sm font-medium opacity-70 leading-relaxed">{s.desc}</p>
              {active && (
                <span
                  className="status-pill self-start"
                  style={{ background: s.color, color: "#130b3b", borderColor: "var(--border)", fontSize: 10 }}
                >
                  ✓ Selected
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
