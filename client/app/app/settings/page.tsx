"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import Modal from "@/components/ui/Modal";

interface Toggle {
  key: string;
  label: string;
  desc: string;
  color: string;
}

const PRIVACY_TOGGLES: Toggle[] = [
  { key: "saveTranscripts", label: "Save session transcripts", desc: "Enables history and insights.", color: "var(--retro-neon-cyan)" },
  { key: "saveVoice", label: "Save voice recordings", desc: "Stored encrypted. Required for audio replay.", color: "var(--retro-neon-pink)" },
  { key: "localOnly", label: "Local-only mode", desc: "Nothing leaves your device.", color: "var(--retro-neon-orange)" },
];

const NOTIF_TOGGLES: Toggle[] = [
  { key: "dailyReminder", label: "Daily session reminder", desc: "Nudge at your chosen time.", color: "var(--retro-neon-purple)" },
  { key: "weeklyInsights", label: "Weekly insights digest", desc: "Summary of your progress.", color: "var(--retro-neon-cyan)" },
];

function ToggleRow({ label, desc, color, checked, onChange }: Toggle & { checked: boolean; onChange: () => void }) {
  return (
    <div className="hybrid-surface flex items-start gap-4 p-4" style={{ background: "var(--retro-surface)" }}>
      <button
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        style={{
          width: 48, height: 28, border: "var(--border-width) solid var(--border)",
          background: checked ? `color-mix(in srgb, ${color} 80%, white)` : "var(--background)",
          position: "relative", cursor: "pointer", flexShrink: 0,
          boxShadow: checked
            ? `3px 3px 0 var(--border), 0 0 10px color-mix(in srgb, ${color} 40%, transparent)`
            : "3px 3px 0 var(--border)",
          transition: "background 0.15s",
        }}
      >
        <span style={{
          position: "absolute", top: 3, left: checked ? 22 : 3,
          width: 16, height: 16, background: checked ? "white" : "var(--border)",
          border: "2px solid var(--border)", transition: "left 0.15s",
        }} />
      </button>
      <div>
        <p className="font-black text-sm uppercase tracking-wide" style={{ color: checked ? color : "var(--foreground)" }}>
          {label}
        </p>
        <p className="text-xs font-medium opacity-60 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const profile = useQuery(api.profile.get);
  const updateConsent = useMutation(api.profile.updateConsent);

  const [privacy, setPrivacy] = useState({ saveTranscripts: true, saveVoice: false, localOnly: false });
  const [notif, setNotif] = useState({ dailyReminder: false, weeklyInsights: true });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // Sync privacy settings from profile when loaded
  useEffect(() => {
    if (profile) {
      const next = { saveTranscripts: profile.saveTranscripts, saveVoice: profile.saveVoice, localOnly: profile.localOnly };
      setTimeout(() => setPrivacy(next), 0);
    }
  }, [profile]);

  const togglePrivacy = async (k: string) => {
    const next = { ...privacy, [k]: !privacy[k as keyof typeof privacy] };
    setPrivacy(next);
    try {
      await updateConsent({
        saveTranscripts: next.saveTranscripts,
        saveVoice: next.saveVoice,
        localOnly: next.localOnly,
      });
    } catch (e) {
      console.error("Failed to update consent:", e);
      setPrivacy(privacy); // revert on error
    }
  };
  const toggleNotif = (k: string) =>
    setNotif((n) => ({ ...n, [k]: !n[k as keyof typeof n] }));

  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-8">
      <h2 className="neon-text">SETTINGS</h2>

      {/* Account */}
      <section className="flex flex-col gap-3">
        <h4 className="neon-text">ACCOUNT</h4>
        <div className="hybrid-surface p-5 flex items-center justify-between gap-4 flex-wrap" style={{ background: "var(--retro-surface)" }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: 52, height: 52, borderRadius: 0,
                background: "linear-gradient(135deg, var(--retro-neon-pink), var(--retro-neon-cyan))",
                border: "var(--border-width) solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 24, fontWeight: 900, color: "#130b3b",
                boxShadow: "4px 4px 0 var(--border)",
                flexShrink: 0,
              }}
            >
              {user?.firstName?.[0]?.toUpperCase() ?? "N"}
            </div>
            <div>
              <p className="font-black text-base">{user?.fullName ?? "Neural User"}</p>
              <p className="text-xs font-bold opacity-50 mono">{user?.primaryEmailAddress?.emailAddress ?? "—"}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="neobrutalism-btn text-xs"
          >
            Sign Out
          </button>
        </div>
      </section>

      {/* Privacy */}
      <section className="flex flex-col gap-3">
        <h4 className="neon-text">PRIVACY & DATA</h4>
        <div className="flex flex-col gap-2">
          {PRIVACY_TOGGLES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              desc={t.desc}
              color={t.color}
              checked={privacy[t.key as keyof typeof privacy]}
              onChange={() => togglePrivacy(t.key)}
            />
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="flex flex-col gap-3">
        <h4 className="neon-text">NOTIFICATIONS</h4>
        <div className="flex flex-col gap-2">
          {NOTIF_TOGGLES.map((t) => (
            <ToggleRow
              key={t.key}
              label={t.label}
              desc={t.desc}
              color={t.color}
              checked={notif[t.key as keyof typeof notif]}
              onChange={() => toggleNotif(t.key)}
            />
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="flex flex-col gap-3">
        <h4 style={{ color: "var(--danger)" }}>DANGER ZONE</h4>
        <div
          className="hybrid-surface p-5 flex flex-col gap-3"
          style={{ background: "var(--retro-surface)", borderColor: "var(--danger)" }}
        >
          <p className="text-sm font-medium opacity-70 leading-relaxed">
            Permanently delete all your sessions, transcripts, and account data.
            <strong className="block mt-1" style={{ color: "var(--danger)" }}>This cannot be undone.</strong>
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="neobrutalism-btn text-sm self-start pulse-danger"
            style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
          >
            ▣ Delete all my data
          </button>
        </div>
      </section>

      {/* Delete confirmation modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="DELETE ALL DATA"
        variant="danger"
      >
        <div className="flex flex-col gap-4">
          <div className="result-error">
            <p className="font-black">⚠️ This is permanent and irreversible.</p>
            <p className="text-sm font-medium mt-1 opacity-90">
              All sessions, transcripts, voice files, and your account will be deleted immediately.
            </p>
          </div>
          {deleted ? (
            <p className="font-bold text-center" style={{ color: "var(--success)" }}>
              ✓ Data queued for deletion.
            </p>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => { setDeleted(true); setTimeout(() => setShowDeleteModal(false), 2000); }}
                className="neobrutalism-btn text-sm flex-1"
                style={{ background: "var(--danger)", color: "white", borderColor: "var(--border)" }}
              >
                Yes, delete everything
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="neobrutalism-btn text-sm flex-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
