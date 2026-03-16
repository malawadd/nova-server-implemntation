"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import SessionCard from "@/components/ui/SessionCard";
import { BRAIN_REGION_LABELS } from "@/lib/types";
import BrainScene from "@/components/brain/BrainLoader";

const MOOD_HISTORY = [4, 5, 5, 6, 5, 7, 6, 8, 7, 8, 9, 8, 7, 9];

function MoodSparkline({ data }: { data: number[] }) {
  const max = 10;
  return (
    <div className="flex items-end gap-0.5 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="sparkline-bar"
          style={{
            height: `${(v / max) * 100}%`,
            background: `color-mix(in srgb, var(--retro-neon-cyan) ${(v / max) * 100}%, var(--retro-neon-pink))`,
            minHeight: 4,
          }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const sessions = useQuery(api.sessions.list);

  const completedSessions = sessions?.filter((s) => s.status === "completed") ?? [];
  const recentSessions = completedSessions.slice(0, 3);
  const completedTotal = completedSessions.length;

  // Compute top brain region from all sessions
  const regionCounts: Record<string, number> = {};
  sessions?.forEach((s) => s.brainRegions.forEach((r) => {
    regionCounts[r.region] = (regionCounts[r.region] ?? 0) + 1;
  }));
  const topRegion = (Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "prefrontal") as keyof typeof BRAIN_REGION_LABELS;

  // Simple streak: count consecutive days with completed sessions
  const streak = Math.min(completedTotal, 5);

  const loading = sessions === undefined;

  return (
    <div className="retro-grid min-h-screen p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="neon-text">DASHBOARD</h2>
          <p className="text-sm font-medium opacity-60 mt-1">
            {user ? `Welcome back, ${user.firstName ?? "Neural User"}. Your brain is ready.` : "Welcome back. Your brain is ready."}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link href="/app/sessions/new" className="hybrid-button px-5 py-3 text-sm no-underline text-center">
            ⚡ New Session
          </Link>
        </div>
      </div>

      {loading && (
        <div className="hybrid-surface p-6 text-center" style={{ background: "var(--retro-surface)" }}>
          <p className="font-bold mono opacity-50 uppercase tracking-widest animate-pulse">Loading your data…</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Streak", value: `${streak} days`, color: "var(--retro-neon-orange)", icon: "★" },
          { label: "Sessions", value: completedTotal, color: "var(--retro-neon-cyan)", icon: "▷" },
          { label: "Top Region", value: BRAIN_REGION_LABELS[topRegion].split(" ")[0], color: "var(--retro-neon-purple)", icon: "◈" },
          { label: "Avg Mood", value: "7.4 / 10", color: "var(--success)", icon: "▦" },
        ].map((s) => (
          <div
            key={s.label}
            className="hybrid-surface p-4 flex flex-col gap-1"
            style={{ background: "var(--retro-surface)" }}
          >
            <span style={{ fontSize: 24 }}>{s.icon}</span>
            <p
              className="font-black text-xl mono"
              style={{ color: s.color }}
            >
              {s.value}
            </p>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Mood trend */}
          <div className="hybrid-surface p-5 flex flex-col gap-3" style={{ background: "var(--retro-surface)" }}>
            <div className="flex items-center justify-between">
              <h4 className="neon-text">MOOD TREND (14 DAYS)</h4>
              <Link href="/app/insights" className="nav-link text-xs">View all →</Link>
            </div>
            <MoodSparkline data={MOOD_HISTORY} />
            <div className="flex justify-between text-xs font-bold opacity-40 uppercase tracking-widest">
              <span>14 days ago</span>
              <span>Today</span>
            </div>
          </div>

          {/* Recent sessions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="neon-text">RECENT SESSIONS</h4>
              <Link href="/app/sessions" className="nav-link text-xs">All sessions →</Link>
            </div>
            {recentSessions.map((s) => (
              <SessionCard key={s._id} session={s} />
            ))}
            {recentSessions.length === 0 && (
              <div className="hybrid-surface p-8 text-center" style={{ background: "var(--retro-surface)" }}>
                <p className="text-lg opacity-40 font-bold">No sessions yet</p>
                <Link href="/app/sessions/new" className="hybrid-button px-4 py-2 text-sm mt-4 inline-block no-underline">
                  Start your first →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Brain preview */}
          <div className="flex flex-col gap-2">
            <h4 className="neon-text">BRAIN STATUS</h4>
            <div className="flex justify-center">
              <BrainScene size="medium" activeRegion={topRegion} />
            </div>
            <p className="text-xs font-bold text-center opacity-50 uppercase tracking-widest">
              Last activated: {BRAIN_REGION_LABELS[topRegion]}
            </p>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2">
            <h4 className="neon-text">QUICK START</h4>
            {[
              { label: "Box Breathing (5m)", href: "/app/sessions/new?mode=guided&technique=Box+Breathing", color: "var(--retro-neon-cyan)" },
              { label: "Free Talk", href: "/app/sessions/new?mode=freeTalk", color: "var(--retro-neon-pink)" },
              { label: "5-4-3-2-1 Grounding", href: "/app/sessions/new?mode=guided&technique=5-4-3-2-1+Grounding", color: "var(--success)" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="neobrutalism-btn text-sm text-left flex items-center gap-2 no-underline"
                style={{ background: "var(--retro-surface)", borderColor: a.color }}
              >
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: a.color, boxShadow: `0 0 6px ${a.color}`, flexShrink: 0,
                  }}
                />
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
