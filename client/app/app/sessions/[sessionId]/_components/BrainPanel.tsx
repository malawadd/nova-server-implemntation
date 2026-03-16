"use client";

import React from "react";
import BrainScene from "@/components/brain/BrainLoader";
import BrainRegionBadge from "@/components/ui/BrainRegionBadge";
import { BRAIN_REGION_LABELS, BRAIN_REGION_DESC, type BrainRegion } from "@/lib/types";

interface BrainPanelProps {
  activeRegion: string | null;
  regionHistory: { region: string; timestamp: number }[];
}

export default function BrainPanel({ activeRegion, regionHistory }: BrainPanelProps) {
  const recentRegions = [...new Set(regionHistory.slice(-8).map((r) => r.region))].slice(0, 5);

  return (
    <div
      className="session-brain-panel flex flex-col gap-4 p-4"
      style={{ background: "var(--retro-surface)" }}
    >
      <div className="flex items-center justify-between">
        <h4 className="neon-text text-sm">NEURAL SCAN</h4>
        {activeRegion && (
          <span
            className="state-badge state-listening"
            style={{ fontSize: 9 }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "white",
                animation: "pulse-danger 1.5s infinite",
              }}
            />
            Active
          </span>
        )}
      </div>

      {/* Brain visual — centered */}
      <div className="flex justify-center">
        <BrainScene size="medium" activeRegion={activeRegion ?? undefined} />
      </div>

      {/* Active region info */}
      {activeRegion && BRAIN_REGION_LABELS[activeRegion as BrainRegion] && (
        <div
          className="hybrid-surface p-3 flex flex-col gap-1 slide-up"
          style={{ borderColor: "var(--retro-neon-pink)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest opacity-50">Activating</span>
            <BrainRegionBadge region={activeRegion as BrainRegion} size="sm" />
          </div>
          <p className="text-xs font-medium opacity-70 leading-relaxed">
            {BRAIN_REGION_DESC[activeRegion as BrainRegion]}
          </p>
        </div>
      )}

      {/* Region history */}
      {recentRegions.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold uppercase tracking-widest opacity-40">This session</p>
          <div className="flex flex-wrap gap-1">
            {recentRegions.map((r) => (
              <BrainRegionBadge key={r} region={r as BrainRegion} size="sm" />
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-col gap-1.5 mt-auto">
        <p className="text-xs font-bold uppercase tracking-widest opacity-40 mb-1">Brain Region Legend</p>
        {(Object.keys(BRAIN_REGION_LABELS) as BrainRegion[]).map((r) => (
          <div key={r} className="flex items-center gap-2">
            <BrainRegionBadge region={r} size="sm" showLabel={false} />
            <span className="text-xs font-medium opacity-60">
              {BRAIN_REGION_LABELS[r]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
