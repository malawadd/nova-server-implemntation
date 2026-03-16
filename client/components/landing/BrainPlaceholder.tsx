"use client";

import React, { useEffect, useRef } from "react";

interface BrainPlaceholderProps {
  activeRegion?: string;
  size?: "small" | "medium" | "large";
}

const REGIONS = [
  { id: "prefrontal", label: "PFC", x: "50%", y: "18%", color: "var(--retro-neon-cyan)" },
  { id: "anterior_cingulate", label: "ACC", x: "50%", y: "35%", color: "var(--retro-neon-orange)" },
  { id: "amygdala", label: "AMY", x: "35%", y: "55%", color: "var(--retro-neon-pink)" },
  { id: "hippocampus", label: "HPC", x: "65%", y: "55%", color: "var(--retro-neon-purple)" },
  { id: "insula", label: "INS", x: "50%", y: "68%", color: "var(--accent)" },
];

export default function BrainPlaceholder({
  activeRegion,
  size = "medium",
}: BrainPlaceholderProps) {
  const svgSize = size === "large" ? 360 : size === "medium" ? 280 : 200;
  const rotateRef = useRef<SVGGElement>(null);
  const tickRef = useRef(0);

  useEffect(() => {
    let raf: number;
    const animate = () => {
      tickRef.current += 0.3;
      if (rotateRef.current) {
        const scaleX = Math.cos((tickRef.current * Math.PI) / 180);
        rotateRef.current.setAttribute(
          "transform",
          `translate(${svgSize / 2}, ${svgSize / 2}) scale(${scaleX}, 1) translate(${-svgSize / 2}, ${-svgSize / 2})`
        );
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [svgSize]);

  const cx = svgSize / 2;
  const cy = svgSize / 2;
  const rx = svgSize * 0.38;
  const ry = svgSize * 0.46;

  return (
    <div
      className="hybrid-surface flex items-center justify-center p-4"
      style={{
        width: svgSize + 32,
        height: svgSize + 32,
        background: "var(--retro-surface)",
        position: "relative",
      }}
    >
      {/* scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        style={{ overflow: "visible" }}
      >
        <defs>
          <filter id="glow-brain">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="brainGrad" cx="50%" cy="40%">
            <stop offset="0%" stopColor="color-mix(in srgb, var(--retro-neon-purple) 40%, var(--retro-surface))" />
            <stop offset="100%" stopColor="var(--retro-surface)" />
          </radialGradient>
        </defs>

        <g ref={rotateRef} transform={`translate(${cx}, ${cy}) scale(1, 1) translate(${-cx}, ${-cy})`}>
          {/* Brain outline */}
          <ellipse
            cx={cx}
            cy={cy}
            rx={rx}
            ry={ry}
            fill="url(#brainGrad)"
            stroke="var(--retro-neon-purple)"
            strokeWidth="3"
            filter="url(#glow-brain)"
            opacity={0.9}
          />
          {/* hemisphere divider */}
          <line
            x1={cx}
            y1={cy - ry + 10}
            x2={cx}
            y2={cy + ry - 10}
            stroke="var(--retro-neon-purple)"
            strokeWidth="2"
            opacity={0.5}
            strokeDasharray="6,4"
          />
          {/* cortex ridges */}
          {[0, 1, 2, 3].map((i) => (
            <ellipse
              key={i}
              cx={cx - 20 + i * 14}
              cy={cy - ry * 0.3 + i * 12}
              rx={rx * 0.35}
              ry={ry * 0.08}
              fill="none"
              stroke="var(--retro-neon-cyan)"
              strokeWidth="1.5"
              opacity={0.25}
            />
          ))}

          {/* Region dots */}
          {REGIONS.map((r) => {
            const px = parseFloat(r.x) / 100 * svgSize;
            const py = parseFloat(r.y) / 100 * svgSize;
            const isActive = activeRegion === r.id;

            return (
              <g key={r.id}>
                {isActive && (
                  <circle cx={px} cy={py} r={18} fill={r.color} opacity={0.25}>
                    <animate attributeName="r" values="14;22;14" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.35;0.1;0.35" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={px}
                  cy={py}
                  r={isActive ? 9 : 6}
                  fill={r.color}
                  stroke="var(--border)"
                  strokeWidth="2"
                  filter="url(#glow-brain)"
                  opacity={isActive ? 1 : 0.7}
                />
                <text
                  x={px}
                  y={py - 13}
                  textAnchor="middle"
                  fontSize={size === "large" ? 9 : 7}
                  fontWeight="900"
                  fill={r.color}
                  fontFamily="monospace"
                  opacity={isActive ? 1 : 0.6}
                >
                  {r.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Frame corners */}
        {[
          [8, 8], [svgSize - 8, 8], [8, svgSize - 8], [svgSize - 8, svgSize - 8]
        ].map(([fx, fy], i) => (
          <text
            key={i}
            x={fx}
            y={fy + 2}
            textAnchor="middle"
            fontSize={8}
            fill="var(--retro-neon-cyan)"
            fontFamily="monospace"
            opacity={0.5}
          >
            +
          </text>
        ))}
      </svg>

      {/* Label */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 3,
        }}
      >
        <span
          className="mono status-pill"
          style={{
            fontSize: 9,
            padding: "2px 10px",
            background: "var(--retro-surface)",
            borderColor: "var(--retro-neon-cyan)",
            color: "var(--retro-neon-cyan)",
          }}
        >
          NEURAL SCAN ACTIVE
        </span>
      </div>
    </div>
  );
}
