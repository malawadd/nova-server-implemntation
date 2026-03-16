"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import GoalsStep from "./_components/GoalsStep";
import StyleStep from "./_components/StyleStep";
import ConsentStep from "./_components/ConsentStep";
import BaselineStep from "./_components/BaselineStep";
import RetroProgress from "@/components/ui/RetroProgress";

const STEPS = ["Goals", "Style", "Privacy", "Baseline"];

interface ConsentSettings {
  saveTranscripts: boolean;
  saveVoice: boolean;
  localOnly: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const upsertProfile = useMutation(api.profile.upsert);
  const [step, setStep] = useState(0);
  const [goals, setGoals] = useState<string[]>([]);
  const [style, setStyle] = useState<"gentle" | "direct" | null>(null);
  const [consent, setConsent] = useState<ConsentSettings>({
    saveTranscripts: true,
    saveVoice: false,
    localOnly: false,
  });
  const [mood, setMood] = useState(5);
  const [saving, setSaving] = useState(false);

  const toggleGoal = (id: string) => {
    setGoals((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const canAdvance =
    step === 0 ? goals.length > 0 :
    step === 1 ? style !== null :
    true;

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      await upsertProfile({
        goals,
        preferredStyle: style!,
        saveTranscripts: consent.saveTranscripts,
        saveVoice: consent.saveVoice,
        localOnly: consent.localOnly,
        baselineMood: mood,
      });
      router.push("/app");
    } catch (e) {
      console.error("Failed to save profile:", e);
      setSaving(false);
    }
  };

  const progress = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="retro-shell min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl flex flex-col gap-6">
        {/* Header */}
        <div className="text-center">
          <span className="font-black text-lg neon-text tracking-widest">
            NEURO<span style={{ color: "var(--retro-neon-pink)" }}>FEEDBACK</span>
          </span>
          <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-1">
            Setup — Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* Step nav */}
        <div className="tab-bar">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className={`tab-btn ${i === step ? "tab-btn-active" : ""}`}
              style={{
                opacity: i > step ? 0.4 : 1,
                cursor: i < step ? "pointer" : "default",
              }}
            >
              {i < step ? "✓ " : ""}{s}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <RetroProgress
          value={progress}
          color="var(--retro-neon-pink)"
          animated={saving}
        />

        {/* Step content */}
        <div className="hybrid-surface p-6 slide-up" style={{ background: "var(--retro-surface)" }}>
          {step === 0 && <GoalsStep selected={goals} onToggle={toggleGoal} />}
          {step === 1 && <StyleStep selected={style} onChange={setStyle} />}
          {step === 2 && (
            <ConsentStep
              settings={consent}
              onChange={(k, v) => setConsent((c) => ({ ...c, [k]: v }))}
            />
          )}
          {step === 3 && <BaselineStep mood={mood} onChange={setMood} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="neobrutalism-btn text-sm"
            style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? "none" : "auto" }}
          >
            ← Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canAdvance || saving}
            className="hybrid-button px-8 py-3 text-sm"
          >
            {saving ? "Saving…" : step === STEPS.length - 1 ? "⚡ Let's Go →" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
