import React from "react";
import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="neon-text">TERMS OF SERVICE</h1>
          <p className="text-sm font-bold opacity-50 mono">Last updated: March 3, 2026</p>

          <div
            className="hybrid-surface p-4"
            style={{ borderColor: "var(--retro-neon-orange)" }}
          >
            <p className="text-sm font-bold leading-relaxed" style={{ color: "var(--retro-neon-orange)" }}>
              ⚠️ Important: NeuroFeedback is a wellness tool, NOT a medical device or replacement
              for professional mental health care. If you are in crisis, please contact a qualified
              mental health professional or emergency services immediately.
            </p>
          </div>

          {[
            {
              title: "Acceptance of Terms",
              content: "By using NeuroFeedback, you agree to these Terms of Service and our Privacy Policy. If you do not agree, you may not use the service.",
            },
            {
              title: "Not Medical Advice",
              content: "NeuroFeedback provides general wellness guidance based on publicly available therapy techniques. Content is for informational and educational purposes only. It is not a substitute for professional diagnosis, treatment, or advice.",
            },
            {
              title: "User Responsibilities",
              content: "You are responsible for your own mental health. Use the app as a supplement to, not replacement for, professional care. You must be 18 or older to use this service.",
            },
            {
              title: "Intellectual Property",
              content: "All app content, design, and AI models are owned by NeuroFeedback. Your session data belongs to you.",
            },
            {
              title: "Limitation of Liability",
              content: "NeuroFeedback is not liable for any harm arising from use of the app, including decisions made based on AI suggestions or therapeutic exercises.",
            },
            {
              title: "Changes to Terms",
              content: "We may update these terms with 30 days notice. Continued use constitutes acceptance of updated terms.",
            },
            {
              title: "Contact",
              content: "Legal questions? Email legal@neurofeedback.app",
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
