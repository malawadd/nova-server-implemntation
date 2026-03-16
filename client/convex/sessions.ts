import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject;
}

async function getOwnedSession(ctx: { db: { get: (id: Id<"sessions">) => Promise<Doc<"sessions"> | null> }; auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }, sessionId: Id<"sessions">) {
  const userId = await requireUser(ctx);
  const session = await ctx.db.get(sessionId);
  if (!session || session.userId !== userId) {
    throw new Error("Session not found");
  }
  return session;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, { sessionId }) => {
    return await getOwnedSession(ctx, sessionId);
  },
});

export const create = mutation({
  args: {
    mode: v.union(v.literal("freeTalk"), v.literal("guided"), v.literal("program")),
    techniqueUsed: v.optional(v.string()),
  },
  handler: async (ctx, { mode, techniqueUsed }) => {
    const userId = await requireUser(ctx);
    const sessionId = await ctx.db.insert("sessions", {
      userId,
      mode,
      status: "idle",
      techniqueUsed,
      transcript: [],
      brainRegions: [],
      startedAt: Date.now(),
    });
    return sessionId;
  },
});

export const updateStatus = mutation({
  args: {
    sessionId: v.id("sessions"),
    status: v.union(
      v.literal("idle"),
      v.literal("listening"),
      v.literal("processing"),
      v.literal("responding"),
      v.literal("exerciseStep"),
      v.literal("paused"),
      v.literal("completed")
    ),
    outcome: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, status, outcome }) => {
    await getOwnedSession(ctx, sessionId);
    const patch: Record<string, unknown> = { status };
    if (outcome) patch.outcome = outcome;
    if (status === "completed") patch.endedAt = Date.now();
    await ctx.db.patch(sessionId, patch);
  },
});

export const addMessage = mutation({
  args: {
    sessionId: v.id("sessions"),
    role: v.union(v.literal("user"), v.literal("ai")),
    text: v.string(),
    emotionCue: v.optional(v.string()),
  },
  handler: async (ctx, { sessionId, role, text, emotionCue }) => {
    const session = await getOwnedSession(ctx, sessionId);
    const msg = { role, text, timestamp: Date.now(), emotionCue };
    await ctx.db.patch(sessionId, {
      transcript: [...session.transcript, msg],
    });
  },
});

export const activateBrainRegion = mutation({
  args: {
    sessionId: v.id("sessions"),
    region: v.string(),
    intensity: v.number(),
  },
  handler: async (ctx, { sessionId, region, intensity }) => {
    const session = await getOwnedSession(ctx, sessionId);
    const entry = { region, timestamp: Date.now(), intensity };
    await ctx.db.patch(sessionId, {
      brainRegions: [...session.brainRegions, entry],
    });
  },
});


// export const get = query({
//   args: { sessionId: v.id("sessions") },
//   handler: async (ctx, { sessionId }) => {
//     return await ctx.db.get(sessionId);
//   },
// });

export const getActive = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const all = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    return all.find((s) => s.status !== "completed" && s.status !== "paused") ?? null;
  },
});

// export const create = mutation({
//   args: {
//     userId: v.string(),
//     mode: v.union(v.literal("freeTalk"), v.literal("guided"), v.literal("program")),
//     techniqueUsed: v.optional(v.string()),
//   },
//   handler: async (ctx, { userId, mode, techniqueUsed }) => {
//     const sessionId = await ctx.db.insert("sessions", {
//       userId,
//       mode,
//       status: "idle",
//       techniqueUsed,
//       transcript: [],
//       brainRegions: [],
//       startedAt: Date.now(),
//     });
//     return sessionId;
//   },
// });

// export const updateStatus = mutation({
//   args: {
//     sessionId: v.id("sessions"),
//     status: v.union(
//       v.literal("idle"),
//       v.literal("listening"),
//       v.literal("processing"),
//       v.literal("responding"),
//       v.literal("exerciseStep"),
//       v.literal("paused"),
//       v.literal("completed")
//     ),
//     outcome: v.optional(v.string()),
//   },
//   handler: async (ctx, { sessionId, status, outcome }) => {
//     const patch: Record<string, unknown> = { status };
//     if (outcome) patch.outcome = outcome;
//     if (status === "completed") patch.endedAt = Date.now();
//     await ctx.db.patch(sessionId, patch);
//   },
// });

// export const addMessage = mutation({
//   args: {
//     sessionId: v.id("sessions"),
//     role: v.union(v.literal("user"), v.literal("ai")),
//     text: v.string(),
//     emotionCue: v.optional(v.string()),
//   },
//   handler: async (ctx, { sessionId, role, text, emotionCue }) => {
//     const session = await ctx.db.get(sessionId);
//     if (!session) return;
//     const msg = { role, text, timestamp: Date.now(), emotionCue };
//     await ctx.db.patch(sessionId, {
//       transcript: [...session.transcript, msg],
//     });
//   },
// });

// export const activateBrainRegion = mutation({
//   args: {
//     sessionId: v.id("sessions"),
//     region: v.string(),
//     intensity: v.number(),
//   },
//   handler: async (ctx, { sessionId, region, intensity }) => {
//     const session = await ctx.db.get(sessionId);
//     if (!session) return;
//     const entry = { region, timestamp: Date.now(), intensity };
//     await ctx.db.patch(sessionId, {
//       brainRegions: [...session.brainRegions, entry],
//     });
//   },
// });
