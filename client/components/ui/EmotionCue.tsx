"use client";

import React from "react";

interface EmotionCueProps {
  text: string;
  direction?: "rising" | "falling" | "stable";
}

const ARROWS = { rising: "↑", falling: "↓", stable: "→" };
const COLORS = {
  rising: "var(--danger)",
  falling: "var(--success)",
  stable: "var(--accent)",
};

export default function EmotionCue({ text, direction = "stable" }: EmotionCueProps) {
  return (
    <span
      className="status-pill inline-flex items-center gap-1"
      style={{
        background: "transparent",
        borderColor: COLORS[direction],
        color: COLORS[direction],
        fontSize: 10,
        padding: "2px 8px",
      }}
    >
      <span>{ARROWS[direction]}</span>
      {text}
    </span>
  );
}
