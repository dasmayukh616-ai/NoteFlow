import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all pages for the authenticated user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to api.pages.list");
    }

    // Since we're syncing users based on identity.subject (Clerk ID)
    // Find the user record
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      // Return empty array if user hasn't been fully stored yet
      return [];
    }

    // Find their primary workspace
    const workspace = await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!workspace) {
      return [];
    }

    // Get pages in this workspace
    const pages = await ctx.db
      .query("pages")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspace._id))
      .collect();

    return pages;
  },
});

// Get all workspaces for the authenticated user
export const listWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to api.pages.listWorkspaces");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) {
      return [];
    }

    return await ctx.db
      .query("workspaces")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(100);
  },
});

// Create a new page
export const create = mutation({
  args: {
    title: v.string(),
    icon: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    let user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    // Store user if they don't exist yet (pseudo webhook logic inline)
    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: identity.subject,
        email: identity.email || "",
        name: identity.name || "",
        imageUrl: identity.pictureUrl || "",
      });
      user = await ctx.db.get(userId);
    }

    if (!user) throw new Error("User creation failed");

    // Ensure they have a workspace
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
      icon: args.icon,
      workspaceId: workspace._id,
      calendarSyncEnabled: false,
    });

    return pageId;
  },
});

// Get a single page
export const getById = query({
  args: { pageId: v.id("pages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const page = await ctx.db.get(args.pageId);
    return page;
  },
});

// Update a page
export const update = mutation({
  args: {
    id: v.id("pages"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    icon: v.optional(v.string()),
    cover: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
    return id;
  },
});
