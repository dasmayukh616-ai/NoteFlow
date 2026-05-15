import type { NextRequest } from "next/server";

import { getParityAuthContext, loadPages } from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

export async function GET(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  try {
    const pages = await loadPages(ctx);
    return ok(pages);
  } catch (error) {
    console.error("GET /api/v1/pages failed", error);
    return err("UpstreamUnavailable", "Failed to load pages.", 503);
  }
}
