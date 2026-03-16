"use client";

import React from "react";
import Link from "next/link";
import { BRAIN_REGION_COLORS } from "@/lib/types";

// Works with both Convex Doc and MockSession shapes
export interface SessionData {
  _id?: string;
  id?: string;
  mode: "freeTalk" | "guided" | "program";
  status: string;
  techniqueUsed?: string;
  outcome?: string;
  startedAt?: number;
  endedAt?: number;
  brainRegions: { region: string; timestamp: number; intensity: number }[];
}

interface SessionCardProps {
  session: SessionData;
  compact?: boolean;
}

function formatDuration(startedAt?: number, endedAt?: number) {
  if (!startedAt) return "—";
  const ms = (endedAt ?? Date.now()) - startedAt;
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MODE_LABELS: Record<string, string> = {
  freeTalk: "Free Talk",
  guided: "Guided",
  program: "Program",
};

const MODE_COLORS: Record<string, string> = {
  freeTalk: "var(--retro-neon-cyan)",
  guided: "var(--retro-neon-pink)",
  program: "var(--retro-neon-purple)",
};

export default function SessionCard({ session, compact = false }: SessionCardProps) {
  const sessionId = session._id ?? session.id ?? "";
  const uniqueRegions = [...new Set(session.brainRegions.map((r) => r.region))];

  return (
    <Link href={`/app/sessions/${sessionId}`} className="block no-underline">
      <div
        className="neobrutalism-card p-4 cursor-pointer"
        style={{ background: "var(--retro-surface)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="status-pill"
                style={{
                  background: MODE_COLORS[session.mode],
                  borderColor: "var(--border)",
                  color: "#130b3b",
                  fontSize: 10,
                }}
              >
                {MODE_LABELS[session.mode]}
              </span>
              {session.techniqueUsed && (
                <span className="text-xs font-bold uppercase opacity-70">
                  {session.techniqueUsed}
                </span>
              )}
            </div>
            <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-1">
              {formatDate(session.startedAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className={`status-pill status-${session.status}`}
              style={{ fontSize: 10 }}
            >
              {session.status}
            </span>
            <span className="mono text-xs font-bold opacity-60">
              {formatDuration(session.startedAt, session.endedAt)}
            </span>
          </div>
        </div>

        {session.outcome && (
          <p className="mt-2 text-sm font-bold" style={{ color: "var(--success)" }}>
            ✓ {session.outcome}
          </p>
        )}

        {!compact && uniqueRegions.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
            <span className="text-xs font-bold uppercase opacity-50 mr-1">Brain:</span>
            {uniqueRegions.map((r) => (
              <span
                key={r}
                title={r}
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: BRAIN_REGION_COLORS[r as keyof typeof BRAIN_REGION_COLORS] ?? "var(--border)",
                  border: "2px solid var(--border)",
                  boxShadow: `0 0 5px ${BRAIN_REGION_COLORS[r as keyof typeof BRAIN_REGION_COLORS] ?? "var(--border)"}`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}


// function formatDuration(startedAt: number, endedAt?: number) {
//   const ms = (endedAt ?? Date.now()) - startedAt;
//   const mins = Math.floor(ms / 60000);
//   const secs = Math.floor((ms % 60000) / 1000);
//   return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
// }

// function formatDate(ts: number) {
//   return new Date(ts).toLocaleDateString("en-US", {
//     month: "short",
//     day: "numeric",
//     hour: "2-digit",
//     minute: "2-digit",
//   });
// }

// const MODE_LABELS: Record<string, string> = {
//   freeTalk: "Free Talk",
//   guided: "Guided",
//   program: "Program",
// };

// const MODE_COLORS: Record<string, string> = {
//   freeTalk: "var(--retro-neon-cyan)",
//   guided: "var(--retro-neon-pink)",
//   program: "var(--retro-neon-purple)",
// };

// export default function SessionCard({ session, compact = false }: SessionCardProps) {
//   const uniqueRegions = [...new Set(session.brainRegions.map((r) => r.region))];

//   return (
//     <Link href={`/app/sessions/${session.id}`} className="block no-underline">
//       <div
//         className="neobrutalism-card p-4 cursor-pointer"
//         style={{ background: "var(--retro-surface)" }}
//       >
//         <div className="flex items-start justify-between gap-3">
//           <div className="flex flex-col gap-1">
//             <div className="flex items-center gap-2 flex-wrap">
//               <span
//                 className="status-pill"
//                 style={{
//                   background: MODE_COLORS[session.mode],
//                   borderColor: "var(--border)",
//                   color: "#130b3b",
//                   fontSize: 10,
//                 }}
//               >
//                 {MODE_LABELS[session.mode]}
//               </span>
//               {session.techniqueUsed && (
//                 <span className="text-xs font-bold uppercase opacity-70">
//                   {session.techniqueUsed}
//                 </span>
//               )}
//             </div>
//             <p className="text-xs font-bold uppercase tracking-widest opacity-50 mt-1">
//               {formatDate(session.startedAt)}
//             </p>
//           </div>
//           <div className="flex flex-col items-end gap-1 shrink-0">
//             <span
//               className={`status-pill status-${session.status}`}
//               style={{ fontSize: 10 }}
//             >
//               {session.status}
//             </span>
//             <span className="mono text-xs font-bold opacity-60">
//               {formatDuration(session.startedAt, session.endedAt)}
//             </span>
//           </div>
//         </div>

//         {session.outcome && (
//           <p className="mt-2 text-sm font-bold" style={{ color: "var(--success)" }}>
//             ✓ {session.outcome}
//           </p>
//         )}

//         {!compact && uniqueRegions.length > 0 && (
//           <div className="flex items-center gap-1.5 mt-3 flex-wrap">
//             <span className="text-xs font-bold uppercase opacity-50 mr-1">Brain:</span>
//             {uniqueRegions.map((r) => (
//               <span
//                 key={r}
//                 title={r}
//                 style={{
//                   display: "inline-block",
//                   width: 10,
//                   height: 10,
//                   borderRadius: "50%",
//                   background: BRAIN_REGION_COLORS[r as keyof typeof BRAIN_REGION_COLORS] ?? "var(--border)",
//                   border: "2px solid var(--border)",
//                   boxShadow: `0 0 5px ${BRAIN_REGION_COLORS[r as keyof typeof BRAIN_REGION_COLORS] ?? "var(--border)"}`,
//                 }}
//               />
//             ))}
//           </div>
//         )}
//       </div>
//     </Link>
//   );
// }
