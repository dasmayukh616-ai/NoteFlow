import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";
import type { NextRequest } from "next/server";

import type { PageDto, WorkspaceDto } from "./types";

type ParityAuthContext = {
  convex: ConvexHttpClient;
  userId: string;
};

function createConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL is not configured.");
  }
  return new ConvexHttpClient(url);
}

export async function getParityAuthContext(
  req: NextRequest,
): Promise<ParityAuthContext | null> {
  const { userId, getToken } = getAuth(req);
  if (!userId) {
    return null;
  }

  const token = await getToken({ template: "convex" });
  if (!token) {
    return null;
  }

  const convex = createConvexClient();
  convex.setAuth(token);

  return { convex, userId };
}

export async function loadPages(ctx: ParityAuthContext): Promise<PageDto[]> {
  const pages = (await ctx.convex.query(api.pages.list, {})) as any[];

  return pages.map((page: any) => ({
    id: page._id,
    workspaceId: page.workspaceId,
    title: page.title,
    icon: page.icon ?? null,
    cover: page.cover ?? null,
    content: page.content ?? null,
    calendarSyncEnabled: Boolean(page.calendarSyncEnabled),
    calendarEventId: page.calendarEventId ?? null,
    createdAt: page._creationTime ?? 0,
  }));
}

export async function loadWorkspaces(
  ctx: ParityAuthContext,
): Promise<WorkspaceDto[]> {
  const workspaces = (await ctx.convex.query(api.pages.listWorkspaces, {})) as any[];

  return workspaces.map((workspace: any) => ({
    id: workspace._id,
    name: workspace.name,
  }));
}

export type CalendarIntegrationDto = {
  provider: string;
  connected: boolean;
};

export type CalendarEventDto = {
  id: string;
  title: string;
  startIso: string;
  endIso: string | null;
};

export type UsageDto = {
  period: string;
  requests: number;
  tokensUsed: number;
  limit: number;
  rpm: number;
};

export type AiChatHistoryEntry = {
  role: string;
  content: string;
};

export type AiMessageDto = {
  role: "assistant";
  content: string;
};

export async function loadCalendarIntegration(
  ctx: ParityAuthContext,
): Promise<CalendarIntegrationDto> {
  const connected = (await ctx.convex.query(
    api.calendarHelpers.isCalendarConnected,
    {},
  )) as boolean;

  return {
    provider: "google",
    connected,
  };
}

export async function loadCalendarEvents(
  ctx: ParityAuthContext,
  maxResults = 15,
): Promise<CalendarEventDto[]> {
  const events = (await ctx.convex.action(api.calendar.fetchEvents, {
    maxResults,
  })) as any[];

  return events.map((event: any) => ({
    id: event.id,
    title: event.summary ?? "(No title)",
    startIso: event.start ?? "",
    endIso: event.end ?? null,
  }));
}

export async function loadUsage(ctx: ParityAuthContext): Promise<UsageDto> {
  const usage = (await ctx.convex.query(api.users.myUsage, {})) as any;

  return {
    period: "day",
    requests: Number(usage?.rpm ?? 0),
    tokensUsed: Number(usage?.tokensUsed ?? 0),
    limit: Number(usage?.limit ?? 0),
    rpm: Number(usage?.rpm ?? 0),
  };
}

export async function sendAiMessage(
  ctx: ParityAuthContext,
  prompt: string,
  history: AiChatHistoryEntry[] = [],
): Promise<AiMessageDto> {
  const content = (await ctx.convex.action(api.ai.chat, {
    message: prompt,
    history,
  })) as string;

  return {
    role: "assistant",
    content,
  };
}

export function classifyBackendError(error: unknown): {
  code:
    | "RateLimited"
    | "ValidationError"
    | "UpstreamUnavailable"
    | "Unknown";
  message: string;
  status: number;
} {
  const message = error instanceof Error ? error.message : "Unknown backend error";

  if (message.toLowerCase().includes("rate limit exceeded")) {
    return { code: "RateLimited", message, status: 429 };
  }

  if (
    message.toLowerCase().includes("not connected") ||
    message.toLowerCase().includes("validation")
  ) {
    return { code: "ValidationError", message, status: 422 };
  }

  if (
    message.toLowerCase().includes("network") ||
    message.toLowerCase().includes("upstream")
  ) {
    return { code: "UpstreamUnavailable", message, status: 503 };
  }

  return { code: "Unknown", message, status: 500 };
}
