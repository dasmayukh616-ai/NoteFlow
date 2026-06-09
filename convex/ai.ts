import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { Groq } from "groq-sdk";
import type { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export const chat = action({
  args: {
    message: v.string(),
    history: v.array(v.object({ role: v.string(), content: v.string() })),
  },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    // Enforce Rate Limits before calling Groq
    const estimatedTokens = Math.ceil(args.message.length / 4) + 200;
    await ctx.runMutation(internal.users.enforceRateLimit, {
        clerkUserId: identity.subject,
        estimatedTokens
    });

    // Get Calendar Context
    const calendarContextString: string = (await ctx.runAction(internal.calendar.getCalendarContext, {})) as string;

    const baseSystemPrompt: string = "You are NoteFlow AI, a helpful assistant integrated into a Notion-style workspace. Help the user with their notes, scheduling, and brainstorming.";
    const systemContent: string = calendarContextString 
      ? `${baseSystemPrompt}\n\n${calendarContextString}` 
      : baseSystemPrompt;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemContent },
      ...args.history.map(
        (h): ChatCompletionMessageParam => ({
          role: h.role === "assistant" ? "assistant" : "user",
          content: h.content,
        }),
      ),
      { role: "user", content: args.message },
    ];

    const response = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages,
    });

    return response.choices[0]?.message?.content || "Sorry, I couldn't process that.";
  },
});
