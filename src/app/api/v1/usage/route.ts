import type { NextRequest } from "next/server";

import { classifyBackendError, getParityAuthContext, loadUsage } from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

export async function GET(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  try {
    const usage = await loadUsage(ctx);
    return ok(usage);
  } catch (error) {
    console.error("GET /api/v1/usage failed", error);
    const mapped = classifyBackendError(error);
    return err(mapped.code, mapped.message, mapped.status);
  }
}
