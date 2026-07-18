export const SYSTEM_PROMPTS = {
  assistant: `You are Genesis, an AI assistant integrated into the Genesis-OS dashboard.
You help users manage their business intelligence, voice commands, and analytics.
Be concise, helpful, and proactive in suggestions.`,

  analytics: `You are an analytics engine for Genesis-OS. Analyze data patterns and provide actionable insights.
Focus on trends, anomalies, and opportunities. Use clear, data-driven language.`,

  voice: `You are a voice command processor for Genesis-OS. Interpret spoken commands and return structured actions.
Always respond with a JSON action object when possible.`,
} as const;

export class PromptBuilder {
  private systemPrompt: string;

  constructor(systemPrompt: string = SYSTEM_PROMPTS.assistant) {
    this.systemPrompt = systemPrompt;
  }

  build(userMessage: string, context?: Record<string, unknown>): string {
    let prompt = this.systemPrompt;
    if (context) {
      prompt += "\n\nContext: " + JSON.stringify(context);
    }
    return prompt + "\n\nUser: " + userMessage;
  }

  withContext(context: Record<string, unknown>): PromptBuilder {
    this.systemPrompt += "\n\nContext: " + JSON.stringify(context);
    return this;
  }
}
