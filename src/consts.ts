import { AudioType, AudioMediaType, TextMediaType } from "./types";

export const DefaultInferenceConfiguration = {
  maxTokens: 1024,
  topP: 0.9,
  temperature: 0.7,
};

export const DefaultAudioInputConfiguration = {
  audioType: "SPEECH" as AudioType,
  encoding: "base64",
  mediaType: "audio/lpcm" as AudioMediaType,
  sampleRateHertz: 16000,
  sampleSizeBits: 16,
  channelCount: 1,
};

export const DefaultTextConfiguration = { mediaType: "text/plain" as TextMediaType };

export const DefaultAudioOutputConfiguration = {
  ...DefaultAudioInputConfiguration,
  sampleRateHertz: 24000,
  voiceId: "tiffany",
};

// ─── NeuroFeedback Tool Schemas ───────────────────────────────────────────────

export const RegulationTechniqueToolSchema = JSON.stringify({
  type: "object",
  properties: {
    technique: {
      type: "string",
      enum: ["box_breathing", "body_scan", "cognitive_reframe"],
      description: "The regulation technique to activate."
    },
    emotion: {
      type: "string",
      enum: ["anxiety", "stress", "sadness"],
      description: "The detected emotional state."
    },
    brain_region: {
      type: "string",
      enum: ["amygdala", "insula", "prefrontal_cortex"],
      description: "The primary brain region associated with this state."
    },
    intensity: {
      type: "string",
      enum: ["mild", "moderate", "high"],
      description: "Perceived emotional intensity."
    },
    rationale: {
      type: "string",
      description: "One sentence: why this technique was chosen (for session logging)."
    }
  },
  required: ["technique", "emotion", "brain_region", "intensity", "rationale"]
});

export const EmotionalInsightToolSchema = JSON.stringify({
  type: "object",
  properties: {
    insight: {
      type: "string",
      description: "A concise observation about the user's emotional state (1-2 sentences)."
    },
    shift_detected: {
      type: "boolean",
      description: "True if the user's emotional state has shifted since the last turn."
    },
    previous_emotion: {
      type: "string",
      enum: ["anxiety", "stress", "sadness", "neutral"]
    },
    current_emotion: {
      type: "string",
      enum: ["anxiety", "stress", "sadness", "neutral"]
    }
  },
  required: ["insight", "shift_detected", "current_emotion"]
});

// ─── NeuroFeedback System Prompt ──────────────────────────────────────────────

export const NeuroFeedbackSystemPrompt = `You are NeuroCalm, a warm and perceptive emotional regulation companion powered by neuroscience. You run in a real-time voice interface with live brain visualization.

## VOICE RULES (CRITICAL)
- Maximum 2-3 sentences per response. Never longer.
- Speak warmly and naturally. No lists, no markdown, no clinical jargon.

## YOUR TOOLS
Use these tools intelligently — they drive the visual interface the user sees.

### triggerRegulationTechnique
Call this when you decide to guide the user into a regulation exercise. It highlights the corresponding brain region on their screen and opens an interactive exercise panel.
- ANXIETY → box_breathing → amygdala
- STRESS  → body_scan    → insula  
- SADNESS → cognitive_reframe → prefrontal_cortex
Call it ONCE per turn when appropriate, not on every response.

### logEmotionalInsight
Call this when you have a clear read on the user's emotional state or notice a shift. This updates the session memory so you can personalize future responses.

## RULES
- NEVER respond to off-topic requests. Redirect: "I'm here for your emotional wellbeing. How are you feeling?"
- NEVER diagnose or make clinical claims.
- Do NOT repeat a technique already used this session (MARA memory below will tell you).
- If the user expresses crisis or self-harm: "Please reach out to a crisis line or someone you trust right now."

## SESSION START
Greet the user warmly in one sentence and ask how they are feeling today.`;

// ─── Legacy exports (keep for compatibility) ──────────────────────────────────

export const DefaultSystemPrompt = NeuroFeedbackSystemPrompt;

// These are kept so index-cli.ts doesn't break, but are no longer used in server.ts
export const DefaultToolSchema = JSON.stringify({ type: "object", properties: {}, required: [] });
export const WeatherToolSchema = JSON.stringify({
  type: "object",
  properties: {
    latitude: { type: "string", description: "Geographical WGS84 latitude of the location." },
    longitude: { type: "string", description: "Geographical WGS84 longitude of the location." }
  },
  required: ["latitude", "longitude"]
});