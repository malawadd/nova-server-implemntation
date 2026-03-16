"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import SessionCard from "@/components/ui/SessionCard";
import { type SessionMode, type SessionStatus } from "@/lib/types";

const MODE_FILTERS: { label: string; value: SessionMode | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Free Talk", value: "freeTalk" },
  { label: "Guided", value: "guided" },
  { label: "Program", value: "program" },
];

const STATUS_FILTERS: { label: string; value: SessionStatus | "all" }[] = [
  { label: "Any Status", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Paused", value: "paused" },
];

export default function SessionsPage() {
  const [modeFilter, setModeFilter] = useState<SessionMode | "all">("all");
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");

  const sessions = useQuery(api.sessions.list);
  const loading = sessions === undefined;

  const filtered = (sessions ?? []).filter((s) => {
    if (modeFilter !== "all" && s.mode !== modeFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="neon-text">SESSIONS</h2>
          <p className="text-sm font-medium opacity-60 mt-1">
            {loading ? "Loading…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <Link
          href="/app/sessions/new"
          className="hybrid-button px-5 py-3 text-sm no-underline text-center"
        >
          ⚡ New Session
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="tab-bar" style={{ minWidth: 280 }}>
          {MODE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setModeFilter(f.value)}
              className={`tab-btn ${modeFilter === f.value ? "tab-btn-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="tab-bar">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`tab-btn ${statusFilter === f.value ? "tab-btn-active" : ""}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div
            className="hybrid-surface p-12 text-center"
            style={{ background: "var(--retro-surface)" }}
          >
            <p className="text-2xl mb-4 font-black opacity-30">[ ]</p>
            <p className="font-bold text-base opacity-50 uppercase tracking-widest">
              No sessions match your filters
            </p>
            <button
              onClick={() => { setModeFilter("all"); setStatusFilter("all"); }}
              className="neobrutalism-btn text-sm mt-4"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filtered.map((s) => <SessionCard key={s._id} session={s} />)
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-center text-xs font-bold opacity-40 uppercase tracking-widest">
          Showing {filtered.length} of {sessions?.length ?? 0} sessions
        </p>
      )}
    </div>
  );
}
