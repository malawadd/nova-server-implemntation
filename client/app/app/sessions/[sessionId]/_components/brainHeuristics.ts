import type { BrainRegion } from "@/lib/types";

const REGION_KEYWORDS: Record<BrainRegion, string[]> = {
  amygdala: ["anxious", "anxiety", "panic", "overwhelmed", "stress", "stressed", "fear", "afraid"],
  prefrontal: ["plan", "focus", "clear", "decide", "steady", "grounded", "regulate", "control"],
  hippocampus: ["remember", "memory", "past", "before", "history", "pattern", "trigger"],
  anterior_cingulate: ["conflict", "mistake", "guilt", "attention", "stuck", "relationship", "empathy"],
  insula: ["body", "breath", "chest", "shoulders", "heartbeat", "stomach", "notice", "feel"],
};

const CALMING_TERMS = ["calm", "calmer", "steady", "safe", "grounded", "relief", "easier", "settled"];

const ESCALATION_TERMS = ["panic", "spiraling", "racing", "tight", "overwhelmed", "stuck", "tense"];

export function inferBrainActivation(text: string) {
  const normalized = text.toLowerCase();

  const scoredRegions = (Object.entries(REGION_KEYWORDS) as [BrainRegion, string[]][])
    .map(([region, keywords]) => ({
      region,
      score: keywords.reduce(
        (total, keyword) => total + (normalized.includes(keyword) ? 1 : 0),
        0,
      ),
    }))
    .sort((left, right) => right.score - left.score);

  const [topRegion] = scoredRegions;
  const region = topRegion && topRegion.score > 0 ? topRegion.region : "prefrontal";
  const score = topRegion?.score ?? 0;
  const intensity = Math.min(1, 0.45 + score * 0.15);

  const emotionCue = CALMING_TERMS.some((term) => normalized.includes(term))
    ? "calming trend"
    : ESCALATION_TERMS.some((term) => normalized.includes(term))
      ? "tension rising"
      : undefined;

  return {
    region,
    intensity,
    emotionCue,
  };
}
