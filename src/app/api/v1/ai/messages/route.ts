import type { NextRequest } from "next/server";

import {
  classifyBackendError,
  getParityAuthContext,
  sendAiMessage,
  type AiChatHistoryEntry,
} from "@/lib/parity-api/convex";
import { err, ok } from "@/lib/parity-api/response";

type AiRequestBody = {
  prompt?: unknown;
  message?: unknown;
  history?: unknown;
};

function parseHistory(input: unknown): AiChatHistoryEntry[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (entry): entry is { role: string; content: string } =>
        typeof entry === "object" &&
        entry !== null &&
        typeof (entry as { role?: unknown }).role === "string" &&
        typeof (entry as { content?: unknown }).content === "string",
    )
    .map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
}

export async function POST(req: NextRequest) {
  const ctx = await getParityAuthContext(req);
  if (!ctx) {
    return err("Unauthenticated", "You must be signed in.", 401);
  }

  let body: AiRequestBody;
  try {
    body = (await req.json()) as AiRequestBody;
  } catch {
    return err("ValidationError", "Invalid JSON request body.", 400);
  }

  const rawPrompt =
    typeof body.prompt === "string"
      ? body.prompt
      : typeof body.message === "string"
        ? body.message
        : "";
  const prompt = rawPrompt.trim();

  if (!prompt) {
    return err("ValidationError", "Prompt is required.", 422);
  }

  const history = parseHistory(body.history);

  try {
    const message = await sendAiMessage(ctx, prompt, history);
    return ok(message);
  } catch (error) {
    console.error("POST /api/v1/ai/messages failed", error);
    const mapped = classifyBackendError(error);
    return err(mapped.code, mapped.message, mapped.status);
  }
}
