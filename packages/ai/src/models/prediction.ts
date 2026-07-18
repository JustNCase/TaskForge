import OpenAI from "openai";

export interface PredictionResult {
  value: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  forecast: number[];
  factors: string[];
}

export class PredictionEngine {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async predict(historicalData: number[], horizon: number = 7, metadata?: Record<string, unknown>): Promise<PredictionResult> {
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a time series prediction engine. Analyze historical data and return JSON:
{
  "value": predicted next value (number),
  "confidence": 0.0-1.0,
  "trend": "up|down|stable",
  "forecast": [array of predicted values for horizon periods],
  "factors": ["key influencing factors"]
}
Return ONLY valid JSON.`,
        },
        {
          role: "user",
          content: `Historical data: [${historicalData.join(", ")}]\nPredict the next ${horizon} periods.${metadata ? `\nContext: ${JSON.stringify(metadata)}` : ""}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    try {
      const parsed = JSON.parse(content);
      return {
        value: parsed.value ?? 0,
        confidence: parsed.confidence ?? 0.5,
        trend: parsed.trend || "stable",
        forecast: parsed.forecast || [],
        factors: parsed.factors || [],
      };
    } catch {
      const avg = historicalData.reduce((a, b) => a + b, 0) / Math.max(historicalData.length, 1);
      return {
        value: avg, confidence: 0.2, trend: "stable",
        forecast: Array(horizon).fill(avg), factors: ["fallback: average of historical data"],
      };
    }
  }
}
