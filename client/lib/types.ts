// ── Shared domain types for NeuroFeedback ──

export type SessionMode = "freeTalk" | "guided" | "program";

export type SessionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "responding"
  | "exerciseStep"
  | "paused"
  | "completed";

export type BrainRegion =
  | "prefrontal"
  | "amygdala"
  | "hippocampus"
  | "anterior_cingulate"
  | "insula";

export const BRAIN_REGION_LABELS: Record<BrainRegion, string> = {
  prefrontal: "Prefrontal Cortex",
  amygdala: "Amygdala",
  hippocampus: "Hippocampus",
  anterior_cingulate: "Anterior Cingulate",
  insula: "Insula",
};

export const BRAIN_REGION_COLORS: Record<BrainRegion, string> = {
  prefrontal: "var(--retro-neon-cyan)",
  amygdala: "var(--retro-neon-pink)",
  hippocampus: "var(--retro-neon-purple)",
  anterior_cingulate: "var(--retro-neon-orange)",
  insula: "var(--accent)",
};

export const BRAIN_REGION_DESC: Record<BrainRegion, string> = {
  prefrontal: "Planning, decision-making, focus",
  amygdala: "Emotional processing, fear response",
  hippocampus: "Memory formation, stress regulation",
  anterior_cingulate: "Attention, error detection, empathy",
  insula: "Body awareness, emotional integration",
};

export type ExerciseCategory = "breathing" | "cbt" | "grounding" | "pmr" | "values";

export interface TranscriptMessage {
  role: "user" | "ai";
  text: string;
  timestamp: number;
  emotionCue?: string;
}

export interface MockSession {
  id: string;
  mode: SessionMode;
  status: SessionStatus;
  techniqueUsed?: string;
  outcome?: string;
  startedAt: number;
  endedAt?: number;
  transcript: TranscriptMessage[];
  brainRegions: { region: string; timestamp: number; intensity: number }[];
}

export interface MockExercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  description: string;
  durationMinutes: number;
  steps: string[];
}

export const MOCK_EXERCISES: MockExercise[] = [
  {
    id: "1",
    name: "Box Breathing",
    category: "breathing",
    description: "Calm your nervous system with equal-count breath cycles.",
    durationMinutes: 5,
    steps: [
      "Inhale slowly for 4 counts",
      "Hold your breath for 4 counts",
      "Exhale slowly for 4 counts",
      "Hold empty for 4 counts",
    ],
  },
  {
    id: "2",
    name: "4-7-8 Breathing",
    category: "breathing",
    description: "A powerful technique to reduce anxiety and promote sleep.",
    durationMinutes: 4,
    steps: [
      "Exhale completely through your mouth",
      "Inhale through your nose for 4 counts",
      "Hold your breath for 7 counts",
      "Exhale through your mouth for 8 counts",
    ],
  },
  {
    id: "3",
    name: "CBT Thought Record",
    category: "cbt",
    description: "Identify and reframe unhelpful thought patterns.",
    durationMinutes: 10,
    steps: [
      "Describe the situation triggering distress",
      "Identify the automatic thought",
      "Rate the emotion intensity (0–10)",
      "Find evidence for and against the thought",
      "Generate a balanced alternative thought",
    ],
  },
  {
    id: "4",
    name: "5-4-3-2-1 Grounding",
    category: "grounding",
    description: "Use your senses to anchor yourself in the present moment.",
    durationMinutes: 3,
    steps: [
      "Name 5 things you can see",
      "Name 4 things you can touch",
      "Name 3 things you can hear",
      "Name 2 things you can smell",
      "Name 1 thing you can taste",
    ],
  },
  {
    id: "5",
    name: "Progressive Muscle Relaxation",
    category: "pmr",
    description: "Release physical tension by systematically tensing and relaxing muscle groups.",
    durationMinutes: 15,
    steps: [
      "Start with your feet — tense for 5 seconds, release",
      "Move to calves — tense for 5 seconds, release",
      "Tense thighs and glutes — hold, release",
      "Tense abdomen — hold, release",
      "Tense hands and arms — hold, release",
      "Tense shoulders and neck — hold, release",
      "Tense face — scrunch, release",
    ],
  },
  {
    id: "6",
    name: "Values Clarification",
    category: "values",
    description: "Reconnect with what matters most to navigate difficult decisions.",
    durationMinutes: 8,
    steps: [
      "List 5 things most important to you in life",
      "Pick the top 3 core values",
      "For each value, name one way you expressed it this week",
      "Identify one action aligned with your values you can take today",
    ],
  },
  {
    id: "7",
    name: "Diaphragmatic Breathing",
    category: "breathing",
    description: "Engage your diaphragm for deeper relaxation.",
    durationMinutes: 5,
    steps: [
      "Place one hand on chest, one on belly",
      "Breathe in through nose — belly should rise",
      "Exhale slowly — belly falls",
      "Repeat for 10 slow breath cycles",
    ],
  },
  {
    id: "8",
    name: "Cognitive Defusion",
    category: "cbt",
    description: "Create distance between yourself and unhelpful thoughts.",
    durationMinutes: 6,
    steps: [
      "Notice a recurring negative thought",
      'Prefix it with: "I notice I am having the thought that…"',
      "Repeat it in a funny voice or sung to a tune",
      "Observe the thought without believing it fully",
    ],
  },
];

export const MOCK_SESSIONS: MockSession[] = [
  {
    id: "s1",
    mode: "guided",
    status: "completed",
    techniqueUsed: "Box Breathing",
    outcome: "calmer",
    startedAt: Date.now() - 86400000 * 1,
    endedAt: Date.now() - 86400000 * 1 + 900000,
    transcript: [],
    brainRegions: [
      { region: "amygdala", timestamp: Date.now() - 86400000, intensity: 0.8 },
      { region: "prefrontal", timestamp: Date.now() - 86400000 + 300000, intensity: 0.6 },
    ],
  },
  {
    id: "s2",
    mode: "freeTalk",
    status: "completed",
    techniqueUsed: undefined,
    outcome: "more focused",
    startedAt: Date.now() - 86400000 * 3,
    endedAt: Date.now() - 86400000 * 3 + 1200000,
    transcript: [],
    brainRegions: [
      { region: "hippocampus", timestamp: Date.now() - 86400000 * 3, intensity: 0.5 },
    ],
  },
  {
    id: "s3",
    mode: "guided",
    status: "completed",
    techniqueUsed: "5-4-3-2-1 Grounding",
    outcome: "grounded",
    startedAt: Date.now() - 86400000 * 5,
    endedAt: Date.now() - 86400000 * 5 + 600000,
    transcript: [],
    brainRegions: [
      { region: "insula", timestamp: Date.now() - 86400000 * 5, intensity: 0.7 },
      { region: "anterior_cingulate", timestamp: Date.now() - 86400000 * 5 + 200000, intensity: 0.6 },
    ],
  },
];
