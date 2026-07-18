import OpenAI from "openai";
import { SYSTEM_PROMPTS } from "../prompts/system";
import { ContextAgent } from "../agents/context";
import { MultimodalAgent, type MultimodalInput } from "../agents/multimodal";

export interface PipelineResult {
  intent: string;
  response: string;
  actions: string[];
  confidence: number;
}

export class AIOrchestrator {
  private client: OpenAI;
  private model: string;
  private contextAgent: ContextAgent;
  private multimodalAgent: MultimodalAgent;

  constructor(apiKey?: string, model: string = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
    this.contextAgent = new ContextAgent(apiKey, model);
    this.multimodalAgent = new MultimodalAgent(apiKey, model);
  }

  async process(input: string, context?: Record<string, unknown>): Promise<PipelineResult> {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPTS.assistant },
    ];

    if (context) {
      messages.push({
        role: "system",
        content: `Current context: ${JSON.stringify(context)}`,
      });
    }

    messages.push({ role: "user", content: input });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content || "";

    return {
      intent: this.extractIntent(input),
      response: content,
      actions: this.extractActions(content, input),
      confidence: completion.choices[0]?.finish_reason === "stop" ? 0.9 : 0.6,
    };
  }

  async chat(
    messages: OpenAI.ChatCompletionMessageParam[],
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.assistant },
        ...messages,
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    });

    return completion.choices[0]?.message?.content || "";
  }

  async chatWithContext(sessionId: string, message: string, systemPrompt?: string) {
    return this.contextAgent.chat(sessionId, message, systemPrompt);
  }

  async processMultimodal(input: MultimodalInput, systemPrompt?: string) {
    return this.multimodalAgent.process(input, systemPrompt);
  }

  async summarizeConversation(sessionId: string) {
    return this.contextAgent.summarize(sessionId);
  }

  clearSession(sessionId: string) {
    this.contextAgent.clearSession(sessionId);
  }

  async analyze(text: string): Promise<{
    sentiment: string;
    insights: string[];
    confidence: number;
  }> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.analytics },
        { role: "user", content: `Analyze this text and return JSON with sentiment, insights array, and confidence:\n\n${text}` },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        sentiment: parsed.sentiment || "neutral",
        insights: parsed.insights || [],
        confidence: parsed.confidence || 0.5,
      };
    } catch {
      return { sentiment: "neutral", insights: [content], confidence: 0.5 };
    }
  }

  private extractIntent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.startsWith("show") || lower.startsWith("display")) return "display";
    if (lower.startsWith("create") || lower.startsWith("new")) return "create";
    if (lower.startsWith("delete") || lower.startsWith("remove")) return "delete";
    if (lower.startsWith("update") || lower.startsWith("change")) return "update";
    if (lower.startsWith("search") || lower.startsWith("find")) return "search";
    if (lower.includes("help")) return "help";
    return "chat";
  }

  private extractActions(response: string, input: string): string[] {
    const actions: string[] = [];
    const combined = response + " " + input;
    if (combined.includes("navigate") || combined.includes("go to")) actions.push("navigate");
    if (combined.includes("display") || combined.includes("show")) actions.push("display");
    if (combined.includes("create") || combined.includes("generate")) actions.push("create");
    if (combined.includes("search") || combined.includes("find")) actions.push("search");
    if (actions.length === 0) actions.push("respond");
    return actions;
  }
}
