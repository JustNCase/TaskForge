import OpenAI from "openai";

export interface GestureResult {
  gesture: string;
  confidence: number;
  hand: "left" | "right" | "both";
  description: string;
  boundingBox: { x: number; y: number; width: number; height: number };
}

export class GestureRecognizer {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async recognize(imageBase64: string): Promise<GestureResult[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a gesture recognition system. Analyze the image and return a JSON array of detected gestures/hand poses.
For each gesture provide: gesture name, confidence (0-1), hand (left/right/both), description, boundingBox.
Supported gestures: thumbs_up, thumbs_down, wave, point, ok, peace, fist, open_palm, pinch, unknown.
Format: [{"gesture": "thumbs_up", "confidence": 0.95, "hand": "right", "description": "Thumbs up gesture", "boundingBox": {"x": 100, "y": 200, "width": 50, "height": 80}}].
Return ONLY valid JSON, no other text. If no gestures detected, return [].`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What gestures or hand poses do you see in this image?" },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "low" } },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.gestures || parsed.detections || [];
  }
}
