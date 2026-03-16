import React from "react";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="retro-shell min-h-screen p-8">
      <header className="hybrid-surface retro-grid px-6 py-3 border-x-0 border-t-0 flex items-center justify-between mb-8">
        <Link href="/" className="font-black neon-text tracking-widest no-underline">
          NEURO<span style={{ color: "var(--retro-neon-pink)" }}>FEEDBACK</span>
        </Link>
        <Link href="/" className="nav-link text-xs">← Back</Link>
      </header>

      <main className="max-w-3xl mx-auto">
        <div className="hybrid-surface p-8 flex flex-col gap-6" style={{ background: "var(--retro-surface)" }}>
          <h1 className="neon-text">PRIVACY POLICY</h1>
          <p className="text-sm font-bold opacity-50 mono">Last updated: March 3, 2026</p>

          {[
            {
              title: "Data We Collect",
              content: "We collect session transcripts (if enabled), voice recordings (if enabled), mood data, and usage analytics. All collection is opt-in and configurable in Settings.",
            },
            {
              title: "How We Use Your Data",
              content: "Your data is used exclusively to provide personalized therapy guidance, compute insights, and improve the AI model. We never sell, rent, or share your mental health data.",
            },
            {
              title: "Local-Only Mode",
              content: "Enabling local-only mode in Settings means all data stays on your device. No data is sent to our servers. Insights and sync features are unavailable in this mode.",
            },
            {
              title: "Data Retention",
              content: "You can delete all your data at any time from Settings → Danger Zone. Upon account deletion, all data is permanently removed within 30 days.",
            },
            {
              title: "Security",
              content: "All data is encrypted at rest (AES-256) and in transit (TLS 1.3). Voice recordings are encrypted with a key derived from your account credentials.",
            },
            {
              title: "Mental Health Data",
              content: "We recognize the sensitivity of mental health data. It is never used for advertising, never shared with employers or insurers, and never used to make decisions about you.",
            },
            {
              title: "Contact",
              content: "Privacy questions? Email privacy@neurofeedback.app",
            },
          ].map((s) => (
            <div key={s.title} className="flex flex-col gap-2">
              <h4 className="neon-text">{s.title.toUpperCase()}</h4>
              <p className="text-sm font-medium opacity-70 leading-relaxed">{s.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
