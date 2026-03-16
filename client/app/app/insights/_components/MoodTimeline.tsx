"use client";

import React from "react";

const MOOD_DATA = [
  { date: "Feb 18", mood: 4 }, { date: "Feb 19", mood: 5 }, { date: "Feb 20", mood: 5 },
  { date: "Feb 21", mood: 6 }, { date: "Feb 22", mood: 5 }, { date: "Feb 23", mood: 7 },
  { date: "Feb 24", mood: 6 }, { date: "Feb 25", mood: 8 }, { date: "Feb 26", mood: 7 },
  { date: "Feb 27", mood: 8 }, { date: "Feb 28", mood: 9 }, { date: "Mar 1", mood: 8 },
  { date: "Mar 2", mood: 7 }, { date: "Mar 3", mood: 9 },
];

export default function MoodTimeline() {
  const max = 10;
  const avg = (MOOD_DATA.reduce((s, d) => s + d.mood, 0) / MOOD_DATA.length).toFixed(1);

  return (
    <div className="hybrid-surface p-5 flex flex-col gap-4" style={{ background: "var(--retro-surface)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h4 className="neon-text">MOOD TIMELINE — 14 DAYS</h4>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold opacity-50 uppercase tracking-widest">Avg</span>
          <span
            className="font-black text-xl mono"
            style={{ color: "var(--retro-neon-cyan)" }}
          >
            {avg}
          </span>
          <span className="text-xs font-bold opacity-50">/ 10</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-32 pt-4">
        {MOOD_DATA.map((d, i) => {
          const heightPct = (d.mood / max) * 100;
          const color = d.mood >= 7
            ? "var(--retro-neon-cyan)"
            : d.mood >= 5
            ? "var(--accent)"
            : "var(--retro-neon-pink)";
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
              <div
                className="w-full border-2 relative"
                style={{
                  height: `${heightPct}%`,
                  background: color,
                  borderColor: "var(--border)",
                  boxShadow: `0 0 8px color-mix(in srgb, ${color} 50%, transparent)`,
                  minHeight: 4,
                  transition: "height 0.5s ease",
                }}
              />
              <span
                className="text-xs font-bold opacity-0 group-hover:opacity-60 transition-opacity"
                style={{ fontSize: 9, writingMode: "vertical-rl", textOrientation: "mixed" }}
              >
                {d.date.split(" ")[1]}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest">
        <span>Feb 18</span>
        <span>Today</span>
      </div>
    </div>
  );
}
