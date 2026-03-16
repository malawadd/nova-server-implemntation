"use client";

import React from "react";
import MoodSlider from "@/components/ui/MoodSlider";

interface BaselineStepProps {
  mood: number;
  onChange: (val: number) => void;
}

const MOOD_LABELS = [
  "Overwhelmed", "Very Low", "Low", "Below Average",
  "Neutral", "Okay", "Good", "Great", "Excellent", "Peak"
];

export default function BaselineStep({ mood, onChange }: BaselineStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h3 className="neon-text">HOW ARE YOU RIGHT NOW?</h3>
        <p className="text-sm font-medium opacity-60 mt-2">
          This sets your baseline. We&apos;ll track changes across sessions.
        </p>
      </div>

      <div className="hybrid-surface p-6 flex flex-col gap-6" style={{ background: "var(--retro-surface)" }}>
        <MoodSlider
          value={mood}
          onChange={onChange}
          label="Current mood"
          min={1}
          max={10}
        />

        <div className="text-center">
          <p
            className="font-black text-2xl neon-text"
            style={{ color: "var(--retro-neon-cyan)" }}
          >
            {MOOD_LABELS[mood - 1]}
          </p>
          <p className="text-xs font-bold opacity-50 mt-1 uppercase tracking-widest">
            Baseline recorded
          </p>
        </div>

        <div className="hybrid-surface p-3" style={{ borderColor: "var(--retro-neon-purple)" }}>
          <p className="text-xs font-medium leading-relaxed opacity-70">
            <strong>How this is used:</strong> Your AI companion uses this to calibrate its tone and choose the right starting technique. It&apos;s not a diagnosis — just a starting point.
          </p>
        </div>
      </div>
    </div>
  );
}
