"use client";

import React from "react";
import Link from "next/link";
import type { MockExercise } from "@/lib/types";

interface ExerciseCardProps {
  exercise: MockExercise;
  onStart?: (exercise: MockExercise) => void;
}

const CAT_COLORS: Record<string, string> = {
  breathing: "var(--retro-neon-cyan)",
  cbt: "var(--retro-neon-pink)",
  grounding: "var(--success)",
  pmr: "var(--retro-neon-orange)",
  values: "var(--retro-neon-purple)",
};

const CAT_LABELS: Record<string, string> = {
  breathing: "Breathing",
  cbt: "CBT",
  grounding: "Grounding",
  pmr: "PMR",
  values: "Values",
};

export default function ExerciseCard({ exercise, onStart }: ExerciseCardProps) {
  const color = CAT_COLORS[exercise.category] ?? "var(--accent)";

  return (
    <div className="neobrutalism-card p-5 flex flex-col gap-3" style={{ background: "var(--retro-surface)" }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className="status-pill"
            style={{
              background: color,
              borderColor: "var(--border)",
              color: "#130b3b",
              fontSize: 10,
            }}
          >
            {CAT_LABELS[exercise.category]}
          </span>
        </div>
        <span className="mono text-xs font-bold opacity-60 shrink-0">
          {exercise.durationMinutes}m
        </span>
      </div>

      <h4 className="neon-text">{exercise.name}</h4>
      <p className="text-sm font-medium opacity-70 leading-relaxed">{exercise.description}</p>

      <div className="flex flex-col gap-1 mt-1">
        <p className="text-xs font-bold uppercase tracking-widest opacity-50">
          {exercise.steps.length} steps
        </p>
        <ul className="flex flex-col gap-0.5">
          {exercise.steps.slice(0, 2).map((step, i) => (
            <li key={i} className="text-xs font-medium opacity-60 flex gap-1.5">
              <span style={{ color, flexShrink: 0 }}>›</span>
              <span className="truncate">{step}</span>
            </li>
          ))}
          {exercise.steps.length > 2 && (
            <li className="text-xs font-bold opacity-40">+{exercise.steps.length - 2} more…</li>
          )}
        </ul>
      </div>

      {onStart ? (
        <button
          onClick={() => onStart(exercise)}
          className="hybrid-button px-4 py-2 mt-auto w-full text-sm"
        >
          Try Now →
        </button>
      ) : (
        <Link
          href={`/app/sessions/new?technique=${encodeURIComponent(exercise.name)}&mode=guided`}
          className="hybrid-button px-4 py-2 mt-auto w-full text-sm text-center block no-underline"
        >
          Try Now →
        </Link>
      )}
    </div>
  );
}
