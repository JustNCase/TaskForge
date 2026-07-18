import OpenAI from "openai";

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ContextResult {
  response: string;
  context: ConversationContext;
}

export interface ConversationContext {
  sessionId: string;
  messages: Message[];
  summary?: string;
  metadata: Record<string, unknown>;
}

export class ContextAgent {
  private client: OpenAI;
  private model: string;
  private sessions: Map<string, ConversationContext> = new Map();
  private maxContextMessages = 20;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  getOrCreateSession(sessionId: string, systemPrompt?: string): ConversationContext {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        messages: systemPrompt
          ? [{ role: "system", content: systemPrompt, timestamp: Date.now() }]
          : [],
        metadata: { created: Date.now() },
      };
      this.sessions.set(sessionId, session);
    }
    return session;
  }

  async chat(sessionId: string, userMessage: string, systemPrompt?: string): Promise<ContextResult> {
    const session = this.getOrCreateSession(sessionId, systemPrompt);

    session.messages.push({ role: "user", content: userMessage, timestamp: Date.now() });

    if (session.messages.length > this.maxContextMessages) {
      const systemMessages = session.messages.filter((m) => m.role === "system");
      const conversationMessages = session.messages
        .filter((m) => m.role !== "system")
        .slice(-this.maxContextMessages + systemMessages.length);
      session.messages = [...systemMessages, ...conversationMessages];
    }

    const apiMessages: OpenAI.ChatCompletionMessageParam[] = session.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: apiMessages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || "";

    session.messages.push({ role: "assistant", content: response, timestamp: Date.now() });

    return { response, context: session };
  }

  async summarize(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session || session.messages.length < 3) return "";

    const conversationText = session.messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: "Summarize the following conversation concisely, capturing key points and decisions.",
        },
        { role: "user", content: conversationText },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const summary = completion.choices[0]?.message?.content || "";
    session.summary = summary;
    session.metadata.lastSummarized = Date.now();
    return summary;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }
}
