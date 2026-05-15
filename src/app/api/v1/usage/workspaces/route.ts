import type { NextRequest } from "next/server";

import { getParityAuthContext, loadWorkspaces } from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

export async function GET(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  try {
    const workspaces = await loadWorkspaces(ctx);
    return ok(workspaces);
  } catch (error) {
    console.error("GET /api/v1/workspaces failed", error);
    return err("UpstreamUnavailable", "Failed to load workspaces.", 503);
  }
}
