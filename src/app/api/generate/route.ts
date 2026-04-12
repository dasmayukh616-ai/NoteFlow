import { generateText, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// To use OpenAI instead, uncomment:
// import { openai } from "@ai-sdk/openai";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await getAuth(req);
    
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { prompt, option, command } = await req.json();

    let systemPrompt = "You are an AI writing assistant that continues existing text based on context from prior text. Give more weight/priority to the later characters than the beginning ones. Limit your response to no more than 200 characters, but make sure to construct complete sentences.";
    
    let messages = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    if (option === "continue") {
      messages[1].content = `Continue the following text: ${prompt}`;
    } else if (option === "improve") {
      messages[1].content = `Improve the writing of the following text: ${prompt}`;
    } else if (option === "shorter") {
      messages[1].content = `Make the following text shorter: ${prompt}`;
    } else if (option === "longer") {
      messages[1].content = `Make the following text longer: ${prompt}`;
    } else if (option === "fix") {
      messages[1].content = `Fix grammar and spelling in the following text: ${prompt}`;
    } else if (option === "zap") {
      messages[1].content = `You have been asked to: ${command}. Apply this to the following text: ${prompt}`;
    }

    const result = streamText({
      model: groq("mixtral-8x7b-32768"),
      messages: messages as any,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("AI Generation Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
