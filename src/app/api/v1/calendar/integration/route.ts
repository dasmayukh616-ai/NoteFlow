import type { NextRequest } from "next/server";

import {
  classifyBackendError,
  getParityAuthContext,
  loadCalendarIntegration,
} from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

export async function GET(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  try {
    const integration = await loadCalendarIntegration(ctx);
    return ok(integration);
  } catch (error) {
    console.error("GET /api/v1/calendar/integration failed", error);
    const mapped = classifyBackendError(error);
    return err(mapped.code, mapped.message, mapped.status);
  }
}
