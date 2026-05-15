import type { NextRequest } from "next/server";

import {
  classifyBackendError,
  getParityAuthContext,
  loadCalendarEvents,
} from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

export async function GET(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  const url = new URL(req.url);
  const maxResultsParam = url.searchParams.get("maxResults");
  const parsed = maxResultsParam ? Number.parseInt(maxResultsParam, 10) : NaN;
  const maxResults = Number.isFinite(parsed) && parsed > 0 ? parsed : 15;

  try {
    const events = await loadCalendarEvents(ctx, maxResults);
    return ok(events);
  } catch (error) {
    console.error("GET /api/v1/calendar/events failed", error);
    const mapped = classifyBackendError(error);
    return err(mapped.code, mapped.message, mapped.status);
  }
}
