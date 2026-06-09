import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

// Hardcoded limits based on generic Groq free tier parameters
const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: 30, // 30 RPM
  MAX_TOKENS_PER_DAY: 100000,  // 100K TPD
};

export const enforceRateLimit = internalMutation({
  args: { clerkUserId: v.string(), estimatedTokens: v.number() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkUserId))
      .first();
    
    if (!user) return false;

    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);
    const minuteWindow = Math.floor(now / 60000);

    // 1. Check and Reset Daily Tokens
    let dailyTokens = user.dailyTokensUsed || 0;
    if (user.lastResetDate !== today) {
        dailyTokens = 0;
    }

    // 2. Check and Reset RPM
    let currentRpm = user.requestsThisMinute || 0;
    if (user.minuteStart !== minuteWindow) {
        currentRpm = 0;
    }

    // --- ENFOFCE LIMITS ---
    if (currentRpm >= RATE_LIMITS.MAX_REQUESTS_PER_MINUTE) {
        throw new Error(`Rate limit exceeded: You can only make ${RATE_LIMITS.MAX_REQUESTS_PER_MINUTE} requests per minute.`);
    }

    if (dailyTokens + args.estimatedTokens > RATE_LIMITS.MAX_TOKENS_PER_DAY) {
        throw new Error(`Rate limit exceeded: You have reached your ${RATE_LIMITS.MAX_TOKENS_PER_DAY} token limit for today.`);
    }

    // Update tracking
    await ctx.db.patch(user._id, {
        requestsThisMinute: currentRpm + 1,
        minuteStart: minuteWindow,
        dailyTokensUsed: dailyTokens + args.estimatedTokens,
        lastResetDate: today,
        tokensUsed: (user.tokensUsed || 0) + args.estimatedTokens,
    });

    return true;
  },
});

// A public query to show usage in the UI
export const myUsage = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { tokensUsed: 0, limit: RATE_LIMITS.MAX_TOKENS_PER_DAY, rpm: 0 };

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    const now = Date.now();
    const today = new Date(now).setHours(0, 0, 0, 0);
    const dailyTokens = user?.lastResetDate === today ? (user?.dailyTokensUsed || 0) : 0;

    return {
      tokensUsed: dailyTokens,
      limit: RATE_LIMITS.MAX_TOKENS_PER_DAY,
      rpm: user?.requestsThisMinute || 0
    };
  }
});
