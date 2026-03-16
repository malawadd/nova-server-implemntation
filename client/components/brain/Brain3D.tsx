"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useProgress } from "@react-three/drei";
import BrainPointCloud from "./BrainPointCloud";

const SIZES: Record<string, number> = {
  small: 232,
  medium: 312,
  large: 392,
};

interface Brain3DProps {
  activeRegion?: string;
  size?: "small" | "medium" | "large";
  highlightAllRegions?: boolean;
}

function LoadingFallback() {
  const { active, progress } = useProgress();
  const isLoading = active || progress < 100;

  if (!isLoading) {
    return null;
  }

  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      className="flex items-center justify-center"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "radial-gradient(ellipse at center, rgba(138,91,255,0.15) 0%, transparent 70%)",
        zIndex: 5,
        pointerEvents: "none",
      }}
    >
      <div
        style={{ color: "var(--retro-neon-cyan)", animation: "pulse-danger 1.5s infinite" }}
      >
        <div
          className="mono font-bold text-xs uppercase tracking-widest"
          style={{ textAlign: "center", marginBottom: 8 }}
        >
          LOADING NEURAL MAP... {Math.round(clamped)}%
        </div>
        <div
          style={{
            width: 180,
            height: 8,
            border: "1px solid var(--border)",
            background: "rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              width: `${clamped}%`,
              height: "100%",
              background: "var(--retro-neon-cyan)",
              boxShadow: "0 0 10px var(--retro-neon-cyan)",
              transition: "width 120ms linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function Brain3D({
  activeRegion,
  size = "medium",
  highlightAllRegions = false,
}: Brain3DProps) {
  const px = SIZES[size];

  return (
    <div
      style={{
        width: px,
        height: px,
        position: "relative",
        margin: "0 auto",
      }}
    >
      {/* Canvas */}
      <Canvas
        camera={{ position: [0, 0, 0.5], fov: 50 }}
        style={{ width: "100%", height: "100%", background: "transparent" }}
        gl={{ alpha: true }}
      >
        <Suspense fallback={null}>
          <BrainPointCloud
            activeRegion={activeRegion}
            highlightAllRegions={highlightAllRegions}
          />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>

      <LoadingFallback />

      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
          zIndex: 2,
        }}
      />

      {/* Frame corners */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 3 }}>
        {/* Top-left */}
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 4,
            left: 6,
            fontSize: 10,
            opacity: 0.3,
            color: "var(--retro-neon-cyan)",
          }}
        >
          +
        </span>
        {/* Top-right */}
        <span
          className="mono"
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontSize: 10,
            opacity: 0.3,
            color: "var(--retro-neon-cyan)",
          }}
        >
          +
        </span>
        {/* Bottom-left */}
        <span
          className="mono"
          style={{
            position: "absolute",
            bottom: 4,
            left: 6,
            fontSize: 10,
            opacity: 0.3,
            color: "var(--retro-neon-cyan)",
          }}
        >
          +
        </span>
        {/* Bottom-right */}
        <span
          className="mono"
          style={{
            position: "absolute",
            bottom: 4,
            right: 6,
            fontSize: 10,
            opacity: 0.3,
            color: "var(--retro-neon-cyan)",
          }}
        >
          +
        </span>
      </div>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        <span
          className="status-pill mono"
          style={{
            fontSize: 9,
            background: "rgba(0,0,0,0.6)",
            color: "var(--retro-neon-cyan)",
            border: "1px solid var(--border)",
            padding: "2px 8px",
            whiteSpace: "nowrap",
          }}
        >
          NEURAL SCAN ACTIVE
        </span>
      </div>
    </div>
  );
}
