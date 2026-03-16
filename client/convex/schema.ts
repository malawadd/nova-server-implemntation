import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),

  userProfiles: defineTable({
    userId: v.string(),
    goals: v.array(v.string()),
    preferredStyle: v.union(v.literal("gentle"), v.literal("direct")),
    saveTranscripts: v.boolean(),
    saveVoice: v.boolean(),
    localOnly: v.boolean(),
    baselineMood: v.number(),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  sessions: defineTable({
    userId: v.string(),
    mode: v.union(v.literal("freeTalk"), v.literal("guided"), v.literal("program")),
    status: v.union(
      v.literal("idle"),
      v.literal("listening"),
      v.literal("processing"),
      v.literal("responding"),
      v.literal("exerciseStep"),
      v.literal("paused"),
      v.literal("completed")
    ),
    techniqueUsed: v.optional(v.string()),
    outcome: v.optional(v.string()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    transcript: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("ai")),
        text: v.string(),
        timestamp: v.number(),
        emotionCue: v.optional(v.string()),
      })
    ),
    brainRegions: v.array(
      v.object({
        region: v.string(),
        timestamp: v.number(),
        intensity: v.number(),
      })
    ),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  sessionSnapshots: defineTable({
    sessionId: v.id("sessions"),
    timestamp: v.number(),
    emotion: v.string(),
    brainRegion: v.string(),
    intensity: v.number(),
  }).index("by_session", ["sessionId"]),

  exercises: defineTable({
    name: v.string(),
    category: v.union(
      v.literal("breathing"),
      v.literal("cbt"),
      v.literal("grounding"),
      v.literal("pmr"),
      v.literal("values")
    ),
    description: v.string(),
    durationMinutes: v.number(),
    steps: v.array(v.string()),
  }),

  insights: defineTable({
    userId: v.string(),
    date: v.string(),
    avgMood: v.number(),
    topRegion: v.string(),
    topTechnique: v.string(),
    sessionCount: v.number(),
  }).index("by_user", ["userId"]),
});
