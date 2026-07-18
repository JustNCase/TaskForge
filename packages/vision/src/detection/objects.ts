import OpenAI from "openai";

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export class ObjectDetector {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async detect(imageBase64: string): Promise<DetectedObject[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: "system",
          content: `You are a computer vision system. Analyze the image and return a JSON array of detected objects with their labels, confidence scores (0-1), and bounding boxes.
Format: [{"label": "person", "confidence": 0.95, "boundingBox": {"x": 100, "y": 50, "width": 200, "height": 300}}].
Return ONLY valid JSON, no other text. If nothing detected, return [].`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What objects do you see in this image?" },
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
    return Array.isArray(parsed) ? parsed : parsed.objects || parsed.detections || [];
  }
}
