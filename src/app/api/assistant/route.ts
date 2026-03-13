import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { message } = await request.json();
  // TODO: Integrate with Anthropic SDK for AI responses
  return NextResponse.json({
    reply: `Received: ${message}. AI assistant integration pending.`,
  });
}
