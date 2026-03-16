"use client";

import React, { useState, useEffect } from "react";
import RetroProgress from "@/components/ui/RetroProgress";

interface ExerciseStepViewProps {
  name: string;
  steps: string[];
  onComplete: () => void;
}

export default function ExerciseStepView({ name, steps, onComplete }: ExerciseStepViewProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);

  const STEP_DURATION = 8; // seconds per step

  useEffect(() => {
    if (!running) return;
    const id = setTimeout(() => {
      setTimer((t) => {
        const next = t + 1;
        if (next >= STEP_DURATION) {
          if (currentStep < steps.length - 1) {
            // advance step on next tick to avoid cascading setState
            setTimeout(() => {
              setCurrentStep((s) => s + 1);
              setTimer(0);
            }, 0);
          } else {
            setTimeout(() => {
              setRunning(false);
              onComplete();
            }, 0);
          }
        }
        return next;
      });
    }, 1000);
    return () => clearTimeout(id);
  }, [running, timer, currentStep, steps.length, onComplete]);

  const progress = Math.round((timer / STEP_DURATION) * 100);
  const totalProgress = Math.round(
    ((currentStep + timer / STEP_DURATION) / steps.length) * 100
  );

  return (
    <div
      className="p-4 flex flex-col gap-4 hybrid-surface slide-up"
      style={{ background: "var(--retro-surface)" }}
    >
      <div className="flex items-center justify-between">
        <h4 className="neon-text text-sm">{name.toUpperCase()}</h4>
        <span className="mono text-xs font-bold opacity-50">
          {currentStep + 1} / {steps.length}
        </span>
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`step-dot ${i === currentStep ? "step-dot-active" : i < currentStep ? "step-dot-done" : ""}`}
          />
        ))}
      </div>

      {/* Current step */}
      <div
        className="hybrid-surface p-4"
        style={{ borderColor: "var(--retro-neon-pink)", background: `color-mix(in srgb, var(--retro-neon-pink) 8%, var(--retro-surface))` }}
      >
        <p className="font-black text-base leading-relaxed">
          {steps[currentStep]}
        </p>
      </div>

      {/* Timer bar */}
      {running && (
        <RetroProgress
          value={progress}
          color="var(--retro-neon-cyan)"
          label={`${STEP_DURATION - timer}s remaining`}
        />
      )}

      {/* Total progress */}
      <RetroProgress
        value={totalProgress}
        color="var(--retro-neon-purple)"
        label="Exercise progress"
      />

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="hybrid-button px-4 py-2 text-sm flex-1"
          >
            {currentStep === 0 ? "▶ Start" : "▶ Continue"}
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="neobrutalism-btn text-sm px-4 py-2 flex-1"
          >
            ⏸ Pause step
          </button>
        )}
        <button
          onClick={() => {
            setTimer(0);
            if (currentStep < steps.length - 1) {
              setCurrentStep((s) => s + 1);
            } else {
              onComplete();
            }
          }}
          className="neobrutalism-btn text-xs px-3 py-2"
        >
          Skip →
        </button>
        {currentStep > 0 && (
          <button
            onClick={() => { setCurrentStep((s) => s - 1); setTimer(0); }}
            className="neobrutalism-btn text-xs px-3 py-2"
          >
            ← Repeat
          </button>
        )}
      </div>
    </div>
  );
}
