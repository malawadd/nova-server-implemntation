"use client";

import React from "react";
import Link from "next/link";

interface ConsentSettings {
  saveTranscripts: boolean;
  saveVoice: boolean;
  localOnly: boolean;
}

interface ConsentStepProps {
  settings: ConsentSettings;
  onChange: (key: keyof ConsentSettings, value: boolean) => void;
}

const TOGGLES: {
  key: keyof ConsentSettings;
  label: string;
  desc: string;
  color: string;
}[] = [
  {
    key: "saveTranscripts",
    label: "Save session transcripts",
    desc: "Allows reviewing conversation history and computing insights.",
    color: "var(--retro-neon-cyan)",
  },
  {
    key: "saveVoice",
    label: "Save voice recordings",
    desc: "Required for audio replay. Stored encrypted. Disabled = transcript only.",
    color: "var(--retro-neon-pink)",
  },
  {
    key: "localOnly",
    label: "Local-only mode",
    desc: "Nothing leaves your device. Disables sync and insights across devices.",
    color: "var(--retro-neon-orange)",
  },
];

export default function ConsentStep({ settings, onChange }: ConsentStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h3 className="neon-text">YOUR DATA, YOUR RULES</h3>
        <p className="text-sm font-medium opacity-60 mt-2">
          We never sell or share your mental health data. Configure what you&apos;re comfortable with.
        </p>
      </div>

      <div className="flex flex-col gap-3 mt-2">
        {TOGGLES.map((t) => {
          const on = settings[t.key];
          return (
            <div
              key={t.key}
              className="hybrid-surface flex items-start gap-4 p-4"
              style={{ background: "var(--retro-surface)" }}
            >
              <button
                role="switch"
                aria-checked={on}
                onClick={() => onChange(t.key, !on)}
                style={{
                  width: 48,
                  height: 28,
                  borderRadius: 0,
                  border: "var(--border-width) solid var(--border)",
                  background: on
                    ? `color-mix(in srgb, ${t.color} 80%, white)`
                    : "var(--background)",
                  position: "relative",
                  cursor: "pointer",
                  flexShrink: 0,
                  boxShadow: on
                    ? `3px 3px 0 var(--border), 0 0 10px color-mix(in srgb, ${t.color} 40%, transparent)`
                    : "3px 3px 0 var(--border)",
                  transition: "background 0.15s, box-shadow 0.15s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 3,
                    left: on ? 22 : 3,
                    width: 16,
                    height: 16,
                    background: on ? "white" : "var(--border)",
                    border: "2px solid var(--border)",
                    transition: "left 0.15s",
                  }}
                />
              </button>
              <div className="flex-1">
                <p
                  className="font-black text-sm uppercase tracking-wide"
                  style={{ color: on ? t.color : "var(--foreground)" }}
                >
                  {t.label}
                </p>
                <p className="text-xs font-medium opacity-60 mt-0.5 leading-relaxed">{t.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center text-xs font-medium opacity-50 leading-relaxed">
        By continuing you agree to our{" "}
        <Link href="/privacy" className="underline font-bold">Privacy Policy</Link>
        {" "}and{" "}
        <Link href="/terms" className="underline font-bold">Terms of Service</Link>.
      </p>
    </div>
  );
}
