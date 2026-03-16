"use client";

import React from "react";

interface MoodSliderProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  label?: string;
}

export default function MoodSlider({
  value,
  onChange,
  min = 1,
  max = 10,
  label,
}: MoodSliderProps) {
  const EMOJIS = ["😣", "😢", "😟", "😐", "🙂", "😊", "😄", "🌟", "✨", "🚀"];
  const idx = Math.max(0, Math.min(value - 1, EMOJIS.length - 1));

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <label className="font-bold text-sm uppercase tracking-widest" style={{ color: "var(--foreground)" }}>
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <span className="text-3xl w-10 text-center">{EMOJIS[idx]}</span>
        <div className="flex-1 relative">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
            style={{
              WebkitAppearance: "none",
              height: 8,
              background: `linear-gradient(90deg, var(--retro-neon-pink) 0%, var(--retro-neon-cyan) 100%)`,
              border: "3px solid var(--border)",
              outline: "none",
              cursor: "pointer",
            }}
          />
        </div>
        <span
          className="font-black text-xl mono w-8 text-center"
          style={{ color: "var(--retro-neon-cyan)" }}
        >
          {value}
        </span>
      </div>
      <div className="flex justify-between text-xs font-bold uppercase tracking-widest opacity-60">
        <span>{min} — Low</span>
        <span>{max} — High</span>
      </div>
    </div>
  );
}
