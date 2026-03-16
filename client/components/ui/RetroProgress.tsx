"use client";

import React from "react";

interface RetroProgressProps {
  value: number; // 0–100
  color?: string;
  label?: string;
  height?: number;
  animated?: boolean;
}

export default function RetroProgress({
  value,
  color = "var(--retro-neon-cyan)",
  label,
  height = 12,
  animated = false,
}: RetroProgressProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</span>
          <span className="text-xs font-black mono" style={{ color }}>
            {value}%
          </span>
        </div>
      )}
      <div
        style={{
          height,
          background: "color-mix(in srgb, var(--border) 15%, transparent)",
          border: "3px solid var(--border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${Math.min(value, 100)}%`,
            background: `linear-gradient(90deg, ${color} 0%, color-mix(in srgb, ${color} 70%, white) 100%)`,
            boxShadow: `0 0 12px ${color}`,
            transition: "width 0.5s ease-out",
            animation: animated ? "pulseBar 2s ease-in-out infinite" : undefined,
          }}
        />
      </div>
    </div>
  );
}
