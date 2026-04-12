import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    dailyTokensUsed: v.optional(v.number()),
    requestsThisMinute: v.optional(v.number()),
    minuteStart: v.optional(v.number()),
    lastResetDate: v.optional(v.number()),
  }).index("by_clerk_id", ["clerkId"]),

  workspaces: defineTable({
    name: v.string(),
    userId: v.id("users"),
  }).index("by_user", ["userId"]),

  pages: defineTable({
    title: v.string(),
    cover: v.optional(v.string()),
    icon: v.optional(v.string()),
    content: v.optional(v.string()),
    workspaceId: v.id("workspaces"),
    calendarEventId: v.optional(v.string()),
    calendarSyncEnabled: v.boolean(),
  }).index("by_workspace", ["workspaceId"]),

  blocks: defineTable({
    type: v.string(),
    content: v.string(),
    pageId: v.id("pages"),
    dueDate: v.optional(v.number()), // JS timestamp
    googleEventId: v.optional(v.string()),
  }).index("by_page", ["pageId"]),

  calendarIntegrations: defineTable({
    userId: v.id("users"),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    syncEnabled: v.boolean(),
    lastSyncedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),
});
