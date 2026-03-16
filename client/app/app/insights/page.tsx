"use client";

import React from "react";
import MoodTimeline from "./_components/MoodTimeline";
import BrainRegionHeatmap from "./_components/BrainRegionHeatmap";
import TechniqueEffectiveness from "./_components/TechniqueEffectiveness";

export default function InsightsPage() {
  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-8">
      <div>
        <h2 className="neon-text">INSIGHTS</h2>
        <p className="text-sm font-medium opacity-60 mt-1">
          Patterns across your sessions. What works, what your brain loves.
        </p>
      </div>

      <MoodTimeline />
      <BrainRegionHeatmap />
      <TechniqueEffectiveness />
    </div>
  );
}
