export type ChatRole = "user" | "assistant";

export type LlmProvider = "openai" | "gemini" | "ollama";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
};
