"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { google } from "googleapis";
import type { Doc, Id } from "./_generated/dataModel";

// --- Fetch upcoming calendar events ---
export const fetchEvents = action({
  args: {
    maxResults: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Get the user's stored calendar integration
    const integration: Doc<"calendarIntegrations"> | null = await ctx.runQuery(
      internal.calendarHelpers.getIntegration,
      { tokenIdentifier: identity.tokenIdentifier }
    );

    if (!integration) {
      throw new Error("Google Calendar not connected. Please connect it in Settings.");
    }

    // Check if token is expired and refresh if needed
    let accessToken = integration.accessToken;
    if (Date.now() >= integration.expiresAt) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/callback"
      );
      oauth2Client.setCredentials({ refresh_token: integration.refreshToken });
      const { credentials } = await oauth2Client.refreshAccessToken();
      accessToken = credentials.access_token!;

      // Persist the refreshed token
      await ctx.runMutation(internal.calendarHelpers.updateTokens, {
        integrationId: integration._id,
        accessToken,
        expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
      });
    }

    // Fetch events from Google Calendar
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: oneWeekLater.toISOString(),
      maxResults: args.maxResults ?? 10,
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = (response.data.items || []).map((event) => ({
      id: event.id || "",
      summary: event.summary || "(No title)",
      description: event.description || "",
      start: event.start?.dateTime || event.start?.date || "",
      end: event.end?.dateTime || event.end?.date || "",
      location: event.location || "",
      attendees: (event.attendees || []).map((a) => ({
        email: a.email || "",
        name: a.displayName || "",
        self: a.self || false,
      })),
      htmlLink: event.htmlLink || "",
    }));

    return events;
  },
});

// --- Create a meeting note page from a calendar event ---
export const createMeetingNote = action({
  args: {
    eventId: v.string(),
    summary: v.string(),
    start: v.string(),
    end: v.string(),
    description: v.optional(v.string()),
    attendees: v.optional(v.array(v.object({
      email: v.string(),
      name: v.string(),
      self: v.boolean(),
    }))),
    location: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const startDate = new Date(args.start);
    const formattedDate = startDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const formattedTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const attendeeList = args.attendees
      ?.filter((a) => !a.self)
      .map((a) => `- ${a.name || a.email}`)
      .join("\n") || "- (none listed)";

    // Build a structured meeting note template
    const content = JSON.stringify({
      type: "doc",
      content: [
        {
          type: "heading",
          attrs: { level: 1 },
          content: [{ type: "text", text: `📅 ${args.summary}` }],
        },
        {
          type: "paragraph",
          content: [
            { type: "text", marks: [{ type: "bold" }], text: "Date: " },
            { type: "text", text: `${formattedDate} at ${formattedTime}` },
          ],
        },
        ...(args.location
          ? [
              {
                type: "paragraph",
                content: [
                  { type: "text", marks: [{ type: "bold" }], text: "Location: " },
                  { type: "text", text: args.location },
                ],
              },
            ]
          : []),
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "👥 Attendees" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: attendeeList }],
        },
        ...(args.description
          ? [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "📝 Description" }],
              },
              {
                type: "paragraph",
                content: [{ type: "text", text: args.description }],
              },
            ]
          : []),
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "🎯 Agenda" }],
        },
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "📋 Action Items" }],
        },
        {
          type: "taskList",
          content: [
            {
              type: "taskItem",
              attrs: { checked: false },
              content: [{ type: "paragraph", content: [{ type: "text", text: " " }] }],
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "📝 Notes" }],
        },
        {
          type: "paragraph",
          content: [{ type: "text", text: " " }],
        },
      ],
    });

    // Create the page in Convex
    const pageId: Id<"pages"> = await ctx.runMutation(internal.calendarHelpers.createMeetingPage, {
      tokenIdentifier: identity.tokenIdentifier,
      title: `📅 ${args.summary}`,
      content,
      calendarEventId: args.eventId,
      icon: "📅",
    });

    // --- TWO-WAY SYNC: Push the NoteFlow link to Google Calendar ---
    try {
      const integration: Doc<"calendarIntegrations"> | null = await ctx.runQuery(
        internal.calendarHelpers.getIntegration,
        { tokenIdentifier: identity.tokenIdentifier }
      );

      if (integration && integration.syncEnabled) {
        let accessToken = integration.accessToken;
        if (Date.now() >= integration.expiresAt) {
          const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/callback"
          );
          oauth2Client.setCredentials({ refresh_token: integration.refreshToken });
          const { credentials } = await oauth2Client.refreshAccessToken();
          accessToken = credentials.access_token!;
          await ctx.runMutation(internal.calendarHelpers.updateTokens, {
            integrationId: integration._id,
            accessToken,
            expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
          });
        }

        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const calendar = google.calendar({ version: "v3", auth: oauth2Client });
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const noteLink = `${appUrl}/dashboard/${pageId}`;
        const noteHtml = `\n\n📝 NoteFlow Meeting Note: <a href="${noteLink}">${noteLink}</a>`;
        
        const eventRes = await calendar.events.get({
          calendarId: "primary",
          eventId: args.eventId,
        });

        const currentDesc = eventRes.data.description || "";
        if (!currentDesc.includes("NoteFlow Meeting Note")) {
          await calendar.events.patch({
            calendarId: "primary",
            eventId: args.eventId,
            requestBody: {
              description: currentDesc + noteHtml
            }
          });
        }
      }
    } catch (err) {
      console.error("Failed to push link to Google Calendar:", err);
    }

    return pageId;
  },
});

// --- Get Calendar Context for AI ---
export const getCalendarContext = internalAction({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    try {
      // Re-use fetchEvents logic but quietly fail if no integration
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) return "";

      const integration: Doc<"calendarIntegrations"> | null = await ctx.runQuery(
        internal.calendarHelpers.getIntegration,
        { tokenIdentifier: identity.tokenIdentifier }
      );
      if (!integration || !integration.syncEnabled) return "";

      let accessToken = integration.accessToken;
      if (Date.now() >= integration.expiresAt) {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.NEXT_PUBLIC_APP_URL + "/api/calendar/callback"
        );
        oauth2Client.setCredentials({ refresh_token: integration.refreshToken });
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token!;
        await ctx.runMutation(internal.calendarHelpers.updateTokens, {
          integrationId: integration._id,
          accessToken,
          expiresAt: credentials.expiry_date || Date.now() + 3600 * 1000,
        });
      }

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: now.toISOString(),
        timeMax: endOfDay.toISOString(), // Only fetch today's remaining events for context
        maxResults: 5,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events = response.data.items || [];
      if (events.length === 0) return "You have no more meetings scheduled for today.";

      const eventList = events.map(e => {
        const time = e.start?.dateTime ? new Date(e.start.dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit'}) : 'All day';
        return `- ${time}: ${e.summary}`;
      }).join("\n");

      return `Here is the user's schedule for the rest of today:\n${eventList}\n\nKeep this in mind if they ask about meetings, availability, or planning.`;
    } catch (e) {
      console.error("Failed to get calendar context for AI", e);
      return "";
    }
  }
});
