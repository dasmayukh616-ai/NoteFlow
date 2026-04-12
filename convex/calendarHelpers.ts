import { v } from "convex/values";
import { internalQuery, internalMutation, mutation, query } from "./_generated/server";

// --- Get integration by tokenIdentifier ---
export const getIntegration = internalQuery({
  args: { tokenIdentifier: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.tokenIdentifier))
      .first();
    if (!user) return null;

    return await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();
  },
});

// --- Update tokens after refresh ---
export const updateTokens = internalMutation({
  args: {
    integrationId: v.id("calendarIntegrations"),
    accessToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.integrationId, {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
    });
  },
});

// --- Store a new calendar integration ---
export const storeIntegration = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Find or create the user
    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.tokenIdentifier))
      .first();

    if (!user) {
      throw new Error("User not found. Please sign in first.");
    }

    // Check if integration already exists
    const existing = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (existing) {
      // Update existing integration
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        syncEnabled: true,
      });
      return existing._id;
    }

    // Create new integration
    return await ctx.db.insert("calendarIntegrations", {
      userId: user._id,
      provider: args.provider,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresAt: args.expiresAt,
      syncEnabled: true,
    });
  },
});

// --- Create a meeting page from calendar data ---
export const createMeetingPage = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    title: v.string(),
    content: v.string(),
    calendarEventId: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.tokenIdentifier))
      .first();
    if (!user) throw new Error("User not found");

    let workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!workspace) {
      const workspaceId = await ctx.db.insert("workspaces", {
        name: `${user.name || "User"}'s Workspace`,
        userId: user._id,
      });
      workspace = await ctx.db.get(workspaceId);
    }
    if (!workspace) throw new Error("Workspace creation failed");

    const pageId = await ctx.db.insert("pages", {
      title: args.title,
      content: args.content,
      icon: args.icon,
      workspaceId: workspace._id,
      calendarEventId: args.calendarEventId,
      calendarSyncEnabled: true,
    });

    return pageId;
  },
});

// --- Check if calendar is connected (public query for UI) ---
export const isCalendarConnected = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) return false;

    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return !!integration?.syncEnabled;
  },
});

// --- Disconnect calendar (public mutation for UI) ---
export const disconnectCalendar = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();
    if (!user) throw new Error("User not found");

    const integration = await ctx.db
      .query("calendarIntegrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (integration) {
      await ctx.db.patch(integration._id, { syncEnabled: false });
    }
  },
});
