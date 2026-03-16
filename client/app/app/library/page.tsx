"use client";

import React, { useState } from "react";
import ExerciseCard from "@/components/ui/ExerciseCard";
import { MOCK_EXERCISES, type ExerciseCategory } from "@/lib/types";

const CATEGORIES: { label: string; value: ExerciseCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Breathing", value: "breathing" },
  { label: "CBT", value: "cbt" },
  { label: "Grounding", value: "grounding" },
  { label: "PMR", value: "pmr" },
  { label: "Values", value: "values" },
];

export default function LibraryPage() {
  const [cat, setCat] = useState<ExerciseCategory | "all">("all");

  const filtered = MOCK_EXERCISES.filter(
    (e) => cat === "all" || e.category === cat
  );

  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-6">
      <div>
        <h2 className="neon-text">EXERCISE LIBRARY</h2>
        <p className="text-sm font-medium opacity-60 mt-1">
          {MOCK_EXERCISES.length} evidence-based techniques. Choose one to start a guided session.
        </p>
      </div>

      {/* Category filter */}
      <div className="tab-bar">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setCat(c.value)}
            className={`tab-btn ${cat === c.value ? "tab-btn-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ex) => (
          <ExerciseCard key={ex.id} exercise={ex} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="hybrid-surface p-12 text-center"
          style={{ background: "var(--retro-surface)" }}
        >
          <p className="font-bold opacity-50 uppercase tracking-widest">No exercises in this category yet</p>
        </div>
      )}
    </div>
  );
}
