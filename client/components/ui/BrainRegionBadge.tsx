"use client";

import React from "react";
import { BRAIN_REGION_COLORS, BRAIN_REGION_LABELS, type BrainRegion } from "@/lib/types";

interface BrainRegionBadgeProps {
  region: BrainRegion;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function BrainRegionBadge({
  region,
  size = "md",
  showLabel = true,
}: BrainRegionBadgeProps) {
  const color = BRAIN_REGION_COLORS[region];
  const label = BRAIN_REGION_LABELS[region];

  return (
    <span
      className="status-pill inline-flex items-center gap-1.5"
      style={{
        fontSize: size === "sm" ? 10 : 12,
        padding: size === "sm" ? "3px 8px" : "6px 12px",
        background: "transparent",
        borderColor: color,
        color: "var(--foreground)",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 6px ${color}`,
          flexShrink: 0,
        }}
      />
      {showLabel && label}
    </span>
  );
}
