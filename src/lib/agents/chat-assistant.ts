/**
 * Chat Assistant Agent
 * AI-powered conversational assistant for data platform queries.
 */

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  sources: string[];
}

export async function chat(
  messages: ChatMessage[],
  context?: string
): Promise<ChatResponse> {
  // TODO: Integrate with Anthropic SDK for conversational AI
  const lastMessage = messages[messages.length - 1];
  return {
    message: `I received your question: "${lastMessage?.content}". AI integration is pending.`,
    sources: [],
  };
}
