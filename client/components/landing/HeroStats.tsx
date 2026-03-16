"use client";

import React from "react";

const STATS = [
  { value: "3+", label: "Session modes", color: "var(--retro-neon-cyan)" },
  { value: "5", label: "Brain regions tracked", color: "var(--retro-neon-pink)" },
  { value: "8+", label: "Therapy techniques", color: "var(--retro-neon-purple)" },
  { value: "∞", label: "Sessions available", color: "var(--accent)" },
];

export default function HeroStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl">
      {STATS.map((s) => (
        <div key={s.label} className="hybrid-surface p-4 text-center" style={{ background: "var(--retro-surface)" }}>
          <p
            className="font-black text-3xl mono neon-text"
            style={{ color: s.color }}
          >
            {s.value}
          </p>
          <p className="text-xs font-bold uppercase tracking-widest opacity-60 mt-1">
            {s.label}
          </p>
        </div>
      ))}
    </div>
  );
}
