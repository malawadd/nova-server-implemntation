"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MOCK_EXERCISES, type SessionMode } from "@/lib/types";

const MODES = [
  {
    id: "freeTalk" as SessionMode,
    icon: "▷",
    title: "Free Talk",
    desc: "Just start talking. Your AI companion listens, reflects, and gently guides you. No structure needed.",
    badge: "Most popular",
    badgeColor: "var(--retro-neon-cyan)",
    color: "var(--retro-neon-cyan)",
  },
  {
    id: "guided" as SessionMode,
    icon: "⊕",
    title: "Guided Exercise",
    desc: "Choose a specific therapy technique. Step-by-step guidance with brain visualization.",
    badge: "Structure + focus",
    badgeColor: "var(--retro-neon-pink)",
    color: "var(--retro-neon-pink)",
  },
  {
    id: "program" as SessionMode,
    icon: "▤",
    title: "Program",
    desc: "Multi-session plans for sustained improvement. 7-day stress reset, sleep improvement, and more.",
    badge: "Coming soon",
    badgeColor: "var(--retro-neon-purple)",
    color: "var(--retro-neon-purple)",
  },
];

const TECHNIQUE_CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Breathing", value: "breathing" },
  { label: "CBT", value: "cbt" },
  { label: "Grounding", value: "grounding" },
  { label: "PMR", value: "pmr" },
  { label: "Values", value: "values" },
];

function NewSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as SessionMode) ?? null;
  const initialTechnique = searchParams.get("technique") ?? null;

  const createSession = useMutation(api.sessions.create);
  const [mode, setMode] = useState<SessionMode | null>(initialMode);
  const [technique, setTechnique] = useState<string | null>(initialTechnique);
  const [catFilter, setCatFilter] = useState("all");
  const [starting, setStarting] = useState(false);

  const filteredExercises = MOCK_EXERCISES.filter(
    (e) => catFilter === "all" || e.category === catFilter
  );

  const canStart =
    mode === "freeTalk" ||
    (mode === "guided" && technique !== null);

  const handleStart = async () => {
    if (!canStart || !mode) return;
    setStarting(true);
    try {
      const sessionId = await createSession({
        mode,
        techniqueUsed: technique ?? undefined,
      });
      router.push(`/app/sessions/${sessionId}`);
    } catch (e) {
      console.error("Failed to create session:", e);
      setStarting(false);
    }
  };

  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-6">
      <div>
        <h2 className="neon-text">NEW SESSION</h2>
        <p className="text-sm font-medium opacity-60 mt-1">
          Choose how you want to work today.
        </p>
      </div>

      {/* Mode cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MODES.map((m) => {
          const active = mode === m.id;
          const disabled = m.id === "program";

          return (
            <button
              key={m.id}
              onClick={() => !disabled && setMode(m.id)}
              disabled={disabled}
              className="hybrid-surface text-left p-6 flex flex-col gap-3 transition-all duration-150"
              style={{
                background: active
                  ? `color-mix(in srgb, ${m.color} 18%, var(--retro-surface))`
                  : "var(--retro-surface)",
                borderColor: active ? m.color : "var(--border)",
                boxShadow: active
                  ? `6px 6px 0 ${m.color}, 0 0 20px color-mix(in srgb, ${m.color} 35%, transparent)`
                  : undefined,
                transform: active ? "translate(2px, 2px)" : undefined,
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 36 }}>{m.icon}</span>
                <span
                  className="status-pill"
                  style={{ background: m.badgeColor, color: "#130b3b", borderColor: "var(--border)", fontSize: 9 }}
                >
                  {m.badge}
                </span>
              </div>
              <h4 style={{ color: active ? m.color : "var(--foreground)" }}>{m.title}</h4>
              <p className="text-sm font-medium opacity-70 leading-relaxed">{m.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Technique picker (guided mode only) */}
      {mode === "guided" && (
        <div className="flex flex-col gap-4 slide-up">
          <h4 className="neon-text">CHOOSE A TECHNIQUE</h4>

          <div className="tab-bar">
            {TECHNIQUE_CATEGORIES.map((c) => (
              <button
                key={c.value}
                onClick={() => setCatFilter(c.value)}
                className={`tab-btn ${catFilter === c.value ? "tab-btn-active" : ""}`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExercises.map((ex) => {
              const selected = technique === ex.name;
              return (
                <button
                  key={ex.id}
                  onClick={() => setTechnique(selected ? null : ex.name)}
                  className="hybrid-surface text-left p-4 flex flex-col gap-2 cursor-pointer transition-all duration-150"
                  style={{
                    background: selected
                      ? `color-mix(in srgb, var(--retro-neon-pink) 18%, var(--retro-surface))`
                      : "var(--retro-surface)",
                    borderColor: selected ? "var(--retro-neon-pink)" : "var(--border)",
                    transform: selected ? "translate(2px,2px)" : undefined,
                    boxShadow: selected
                      ? "4px 4px 0 var(--retro-neon-pink)"
                      : undefined,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm">{ex.name}</span>
                    <span className="mono text-xs font-bold opacity-50 shrink-0">{ex.durationMinutes}m</span>
                  </div>
                  <p className="text-xs font-medium opacity-60 leading-relaxed line-clamp-2">
                    {ex.description}
                  </p>
                  {selected && (
                    <span
                      className="status-pill self-start"
                      style={{ background: "var(--retro-neon-pink)", color: "white", fontSize: 10 }}
                    >
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      <div
        className="hybrid-surface p-4 flex items-center justify-between gap-4 flex-wrap sticky bottom-4"
        style={{ background: "var(--retro-surface)" }}
      >
        <div>
          {mode && (
            <p className="font-black text-sm uppercase tracking-wide" style={{ color: "var(--retro-neon-cyan)" }}>
              {mode === "freeTalk" ? "▷ Free Talk" : mode === "guided" ? `⊕ ${technique ?? "Pick a technique"}` : "▤ Program"}
            </p>
          )}
          {!mode && (
            <p className="text-sm font-bold opacity-40 uppercase tracking-widest">Select a mode above</p>
          )}
        </div>
        <button
          onClick={handleStart}
          disabled={!canStart || starting}
          className="hybrid-button px-8 py-3 text-sm"
        >
          {starting ? "Starting…" : "⚡ Start Session →"}
        </button>
      </div>
    </div>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div className="p-6 font-bold neon-text">Loading…</div>}>
      <NewSessionContent />
    </Suspense>
  );
}
