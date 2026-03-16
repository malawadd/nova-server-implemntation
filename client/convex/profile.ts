import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

async function requireUser(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity.subject;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    goals: v.array(v.string()),
    preferredStyle: v.union(v.literal("gentle"), v.literal("direct")),
    saveTranscripts: v.boolean(),
    saveVoice: v.boolean(),
    localOnly: v.boolean(),
    baselineMood: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("userProfiles", { userId, ...args, createdAt: Date.now() });
    }
  },
});

export const updateConsent = mutation({
  args: {
    saveTranscripts: v.boolean(),
    saveVoice: v.boolean(),
    localOnly: v.boolean(),
  },
  handler: async (ctx, { saveTranscripts, saveVoice, localOnly }) => {
    const userId = await requireUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    if (profile) {
      await ctx.db.patch(profile._id, { saveTranscripts, saveVoice, localOnly });
    }
  },
});
