import OpenAI from "openai";

export interface NLPParseResult {
  intent: string;
  entities: Record<string, string>;
  confidence: number;
  originalText: string;
}

export class NLPEngine {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async parse(text: string): Promise<NLPParseResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `Parse the user's input and extract intent and entities.
Return JSON: {"intent": "string", "entities": {"key": "value"}, "confidence": 0.0-1.0}
Intents: display, create, delete, update, search, navigate, help, analyze, summarize, chat
Extract entities like: dashboard, user, date, metric, action, target`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        intent: parsed.intent || "chat",
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.7,
        originalText: text,
      };
    } catch {
      return { intent: "chat", entities: {}, confidence: 0.3, originalText: text };
    }
  }

  private classifyIntent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.startsWith("show") || lower.startsWith("display")) return "display";
    if (lower.startsWith("create") || lower.startsWith("new")) return "create";
    if (lower.startsWith("delete") || lower.startsWith("remove")) return "delete";
    if (lower.startsWith("update") || lower.startsWith("change")) return "update";
    if (lower.startsWith("search") || lower.startsWith("find")) return "search";
    if (lower.startsWith("navigate") || lower.startsWith("go to")) return "navigate";
    if (lower.includes("analyze")) return "analyze";
    if (lower.includes("summarize")) return "summarize";
    if (lower.includes("help")) return "help";
    return "chat";
  }
}
