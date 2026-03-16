"use client";

import React from "react";
import { BRAIN_REGION_LABELS, BRAIN_REGION_COLORS, type BrainRegion } from "@/lib/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const REGIONS = Object.keys(BRAIN_REGION_LABELS) as BrainRegion[];

// Mock activation data: 0–1 intensity per region per day
const DATA: Record<BrainRegion, number[]> = {
  prefrontal:         [0.8, 0.6, 0.9, 0.7, 0.5, 0.0, 0.4],
  amygdala:           [0.9, 0.7, 0.8, 0.6, 0.3, 0.0, 0.2],
  hippocampus:        [0.3, 0.4, 0.5, 0.6, 0.8, 0.0, 0.3],
  anterior_cingulate: [0.4, 0.5, 0.7, 0.8, 0.6, 0.0, 0.5],
  insula:             [0.2, 0.3, 0.4, 0.5, 0.7, 0.0, 0.4],
};

export default function BrainRegionHeatmap() {
  return (
    <div className="hybrid-surface p-5 flex flex-col gap-4" style={{ background: "var(--retro-surface)" }}>
      <h4 className="neon-text">BRAIN REGION ACTIVATION — PAST WEEK</h4>
      <p className="text-xs font-medium opacity-50">
        Darker = more activation during sessions that day.
      </p>

      <div className="overflow-x-auto">
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ padding: "4px 8px", textAlign: "left", fontSize: 10, fontWeight: 900, opacity: 0.4 }}>Region</th>
              {DAYS.map((d) => (
                <th key={d} style={{ padding: "4px 6px", textAlign: "center", fontSize: 10, fontWeight: 900, opacity: 0.4 }}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REGIONS.map((region) => {
              const color = BRAIN_REGION_COLORS[region];
              return (
                <tr key={region}>
                  <td style={{ padding: "4px 8px", fontSize: 11, fontWeight: 700, opacity: 0.7, whiteSpace: "nowrap" }}>
                    {BRAIN_REGION_LABELS[region]}
                  </td>
                  {DATA[region].map((intensity, di) => (
                    <td key={di} style={{ padding: "3px 4px", textAlign: "center" }}>
                      <div
                        style={{
                          width: 28,
                          height: 20,
                          margin: "0 auto",
                          background: intensity === 0
                            ? "color-mix(in srgb, var(--border) 10%, transparent)"
                            : `color-mix(in srgb, ${color} ${Math.round(intensity * 90)}%, transparent)`,
                          border: `2px solid ${intensity === 0 ? "transparent" : "var(--border)"}`,
                          boxShadow: intensity > 0.5
                            ? `0 0 6px color-mix(in srgb, ${color} 50%, transparent)`
                            : undefined,
                        }}
                        title={`${BRAIN_REGION_LABELS[region]}: ${Math.round(intensity * 100)}%`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
