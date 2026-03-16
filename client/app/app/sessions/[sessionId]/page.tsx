"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import BrainPanel from "./_components/BrainPanel";
import ConversationPanel from "./_components/ConversationPanel";
import SessionControls from "./_components/SessionControls";
import ExerciseStepView from "./_components/ExerciseStepView";
import { useNovaSession } from "./_components/useNovaSession";
import Modal from "@/components/ui/Modal";
import { MOCK_EXERCISES } from "@/lib/types";

const GROUNDING_EXERCISE = MOCK_EXERCISES.find((e) => e.category === "grounding")!;

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [mode, setMode] = useState<"talk" | "exercise">("talk");
  const [showExercise, setShowExercise] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<typeof MOCK_EXERCISES[0] | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Convex hooks
  const session = useQuery(
    api.sessions.get,
    sessionId ? { sessionId: sessionId as Id<"sessions"> } : "skip"
  );
  const profile = useQuery(api.profile.get, {});
  const updateStatus = useMutation(api.sessions.updateStatus);
  const {
    status,
    transcript,
    regionHistory,
    activeRegion,
    partialAssistantText,
    error,
    toggleMic,
    endSession,
  } = useNovaSession({
    sessionId: sessionId as Id<"sessions">,
    initialStatus: session?.status,
    mode: session?.mode,
    techniqueUsed: session?.techniqueUsed,
    transcript: session?.transcript ?? [],
    brainRegions: session?.brainRegions ?? [],
    profile,
  });

  const handleSwitchMode = () => {
    if (mode === "talk") {
      setMode("exercise");
      setCurrentExercise(MOCK_EXERCISES[0]);
      setShowExercise(true);
    } else {
      setMode("talk");
      setShowExercise(false);
    }
  };

  const handleGround = () => {
    setCurrentExercise(GROUNDING_EXERCISE);
    setShowExercise(true);
  };

  const handleEnd = useCallback(() => {
    void endSession();
    if (sessionId) {
      void updateStatus({
        sessionId: sessionId as Id<"sessions">,
        status: "completed",
        outcome: "calmer",
      }).catch(() => {});
    }
    setShowSummary(true);
  }, [endSession, sessionId, updateStatus]);

  const handleExerciseComplete = () => {
    setShowExercise(false);
    setCurrentExercise(null);
  };

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Session top bar */}
      <div
        className="hybrid-surface border-x-0 border-t-0 px-4 py-2 flex items-center justify-between gap-4"
        style={{ background: "var(--retro-surface)", position: "sticky", top: 0, zIndex: 5 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/app/sessions")}
            className="nav-link text-xs"
          >
            ← Sessions
          </button>
          {session && (
            <span className="mono text-xs font-bold opacity-40 hidden sm:block">
              {session.mode?.toUpperCase()}
              {session.techniqueUsed ? ` · ${session.techniqueUsed}` : ""}
            </span>
          )}
        </div>
        <span className="font-black text-xs neon-text tracking-widest hidden sm:block">
          NEUROFEEDBACK SESSION
        </span>
        <span className={`state-badge state-${status}`} style={{ fontSize: 10 }}>
          {status}
        </span>
      </div>

      {/* Cockpit layout */}
      <div className="session-cockpit">
        {/* Brain Panel — left */}
        <BrainPanel
          activeRegion={activeRegion}
          regionHistory={regionHistory}
        />

        {/* Conversation Panel — right */}
        <div
          className="session-conversation-panel flex flex-col"
          style={{ background: "var(--retro-surface)" }}
        >
          <ConversationPanel
            transcript={transcript}
            partialAssistantText={partialAssistantText}
            error={error}
            isStreaming={status === "processing" || status === "responding"}
          />

          {/* Exercise overlay in conversation panel */}
          {showExercise && currentExercise && (
            <div
              className="p-4 border-t"
              style={{ borderColor: "var(--border)", borderWidth: "var(--border-width)" }}
            >
              <ExerciseStepView
                name={currentExercise.name}
                steps={currentExercise.steps}
                onComplete={handleExerciseComplete}
              />
            </div>
          )}
        </div>

        {/* Controls bar — bottom */}
        <SessionControls
          status={status}
          onToggleMic={toggleMic}
          onSwitchMode={handleSwitchMode}
          onPause={() => {}}
          onEnd={handleEnd}
          onGround={handleGround}
          mode={mode}
        />
      </div>

      {/* Session summary modal */}
      <Modal
        open={showSummary}
        onClose={() => { setShowSummary(false); router.push("/app/sessions"); }}
        title="SESSION COMPLETE"
      >
        <div className="flex flex-col gap-4">
          <div className="result-success flex flex-col gap-2">
            <p className="font-black text-lg">✓ Session ended</p>
            <p className="text-sm font-medium">
              Outcome: <strong>calmer</strong> · Duration: ~10 minutes
            </p>
          </div>
          <p className="text-sm font-medium opacity-70 leading-relaxed">
            Your prefrontal cortex was most active during this session, a great sign of
            effective emotional regulation. Brain regions: Prefrontal Cortex, Amygdala.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setShowSummary(false); router.push("/app/sessions/new"); }}
              className="hybrid-button px-4 py-2 text-sm flex-1"
            >
              New Session →
            </button>
            <button
              onClick={() => { setShowSummary(false); router.push("/app/insights"); }}
              className="neobrutalism-btn text-sm px-4 py-2"
            >
              View Insights
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
