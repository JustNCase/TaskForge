import OpenAI from "openai";

export interface SentimentResult {
  score: number;
  label: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  emotions: Record<string, number>;
  keyPhrases: string[];
}

export class SentimentAnalyzer {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async analyze(text: string): Promise<SentimentResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `Analyze the sentiment of the text. Return JSON:
{
  "score": -1.0 to 1.0,
  "label": "positive|negative|neutral|mixed",
  "confidence": 0.0-1.0,
  "emotions": {"joy": 0.0, "sadness": 0.0, "anger": 0.0, "fear": 0.0, "surprise": 0.0},
  "keyPhrases": ["phrase1", "phrase2"]
}`,
        },
        { role: "user", content: text },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        score: parsed.score ?? 0,
        label: parsed.label || "neutral",
        confidence: parsed.confidence ?? 0.5,
        emotions: parsed.emotions || {},
        keyPhrases: parsed.keyPhrases || [],
      };
    } catch {
      return {
        score: 0, label: "neutral", confidence: 0.3,
        emotions: {}, keyPhrases: [],
      };
    }
  }
}
