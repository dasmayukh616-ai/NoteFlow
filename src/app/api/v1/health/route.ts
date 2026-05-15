import { ok } from "@/lib/parity-api/response";

export async function GET() {
  return ok({
    service: "noteflow-parity-api",
    status: "ok",
    version: "v1",
  });
}
