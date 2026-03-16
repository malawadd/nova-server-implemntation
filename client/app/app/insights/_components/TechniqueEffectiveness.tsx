"use client";

import React from "react";

const TECHNIQUES = [
  { name: "Box Breathing", avgLift: 2.8, sessions: 5, color: "var(--retro-neon-cyan)" },
  { name: "5-4-3-2-1 Grounding", avgLift: 2.4, sessions: 3, color: "var(--success)" },
  { name: "Free Talk", avgLift: 1.6, sessions: 7, color: "var(--retro-neon-pink)" },
  { name: "CBT Thought Record", avgLift: 2.1, sessions: 2, color: "var(--retro-neon-orange)" },
  { name: "4-7-8 Breathing", avgLift: 2.6, sessions: 4, color: "var(--retro-neon-purple)" },
];

const MAX_LIFT = 3;

export default function TechniqueEffectiveness() {
  return (
    <div className="hybrid-surface p-5 flex flex-col gap-4" style={{ background: "var(--retro-surface)" }}>
      <h4 className="neon-text">TECHNIQUE EFFECTIVENESS</h4>
      <p className="text-xs font-medium opacity-50">
        Average mood lift per technique (points on 1–10 scale).
      </p>

      <div className="flex flex-col gap-3">
        {[...TECHNIQUES].sort((a, b) => b.avgLift - a.avgLift).map((t) => {
          const pct = (t.avgLift / MAX_LIFT) * 100;
          return (
            <div key={t.name} className="insight-bar-row">
              <span
                className="font-bold text-xs uppercase tracking-wide shrink-0"
                style={{ width: 160 }}
              >
                {t.name}
              </span>
              <div className="flex-1 relative" style={{ height: 20, border: "3px solid var(--border)", background: "color-mix(in srgb, var(--border) 10%, transparent)" }}>
                <div
                  className="insight-bar-fill h-full"
                  style={{
                    width: `${pct}%`,
                    background: t.color,
                    border: "none",
                    boxShadow: `0 0 8px color-mix(in srgb, ${t.color} 50%, transparent)`,
                  }}
                />
              </div>
              <div className="flex flex-col items-end shrink-0" style={{ width: 60 }}>
                <span
                  className="font-black mono text-sm"
                  style={{ color: t.color }}
                >
                  +{t.avgLift}
                </span>
                <span className="text-xs opacity-40">{t.sessions}x</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
