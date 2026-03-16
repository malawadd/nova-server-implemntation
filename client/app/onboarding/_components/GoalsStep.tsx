"use client";

import React from "react";

const GOALS = [
  { id: "stress", label: "Reduce Stress", icon: "😤", color: "var(--retro-neon-pink)" },
  { id: "focus", label: "Improve Focus", icon: "🎯", color: "var(--retro-neon-cyan)" },
  { id: "sleep", label: "Better Sleep", icon: "🌙", color: "var(--retro-neon-purple)" },
  { id: "mood", label: "Lift My Mood", icon: "🌅", color: "var(--accent)" },
  { id: "anxiety", label: "Ease Anxiety", icon: "🌊", color: "var(--success)" },
  { id: "resilience", label: "Build Resilience", icon: "🔥", color: "var(--retro-neon-orange)" },
];

interface GoalsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export default function GoalsStep({ selected, onToggle }: GoalsStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="neon-text">WHAT ARE YOU WORKING ON?</h3>
        <p className="text-sm font-medium opacity-60 mt-2">Select all that apply. You can change this anytime.</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
        {GOALS.map((g) => {
          const active = selected.includes(g.id);
          return (
            <button
              key={g.id}
              onClick={() => onToggle(g.id)}
              className="hybrid-surface text-left p-4 flex flex-col gap-2 cursor-pointer transition-all duration-150"
              style={{
                background: active
                  ? `color-mix(in srgb, ${g.color} 20%, var(--retro-surface))`
                  : "var(--retro-surface)",
                borderColor: active ? g.color : "var(--border)",
                boxShadow: active
                  ? `6px 6px 0 ${g.color}, 0 0 16px color-mix(in srgb, ${g.color} 30%, transparent)`
                  : undefined,
                transform: active ? "translate(2px, 2px)" : undefined,
              }}
            >
              <span style={{ fontSize: 28 }}>{g.icon}</span>
              <span
                className="font-black uppercase text-xs tracking-wide"
                style={{ color: active ? g.color : "var(--foreground)" }}
              >
                {g.label}
              </span>
            </button>
          );
        })}
      </div>
      {selected.length === 0 && (
        <p className="text-center text-xs font-bold opacity-40 uppercase tracking-widest">
          Pick at least one goal to continue
        </p>
      )}
    </div>
  );
}
