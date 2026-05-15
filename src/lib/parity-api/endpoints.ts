import type { V1Endpoint } from "./types";

export const API_V1_BASE = "/api/v1" as const;

export const v1Endpoints = {
  me: "/api/v1/auth/me",
  workspaces: "/api/v1/workspaces",
  pages: "/api/v1/pages",
  calendarIntegration: "/api/v1/calendar/integration",
  calendarEvents: "/api/v1/calendar/events",
  aiMessages: "/api/v1/ai/messages",
  usage: "/api/v1/usage",
} as const satisfies Record<string, V1Endpoint>;
