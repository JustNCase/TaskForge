import OpenAI from "openai";

export interface MultimodalInput {
  text?: string;
  imageBase64?: string;
  imageUrl?: string;
}

export interface MultimodalResult {
  response: string;
  detectedObjects?: string[];
  textExtracted?: string;
  analysisType: "text_only" | "vision" | "combined";
  confidence: number;
}

export class MultimodalAgent {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "gpt-4o-mini") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async process(input: MultimodalInput, systemPrompt?: string): Promise<MultimodalResult> {
    const hasImage = !!(input.imageBase64 || input.imageUrl);
    const hasText = !!input.text;

    if (!hasText && !hasImage) {
      throw new Error("At least one of text or image is required");
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: systemPrompt || "You are an AI that processes text and images. Analyze the input and respond helpfully.",
      },
    ];

    const userContent: OpenAI.ChatCompletionContentPart[] = [];

    if (hasText) {
      userContent.push({ type: "text", text: input.text! });
    }

    if (input.imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: `data:image/jpeg;base64,${input.imageBase64}`, detail: "auto" },
      });
    } else if (input.imageUrl) {
      userContent.push({
        type: "image_url",
        image_url: { url: input.imageUrl, detail: "auto" },
      });
    }

    messages.push({ role: "user", content: userContent });

    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      temperature: 0.5,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || "";

    return {
      response,
      analysisType: hasImage && hasText ? "combined" : hasImage ? "vision" : "text_only",
      confidence: completion.choices[0]?.finish_reason === "stop" ? 0.9 : 0.6,
    };
  }

  async analyzeImage(imageBase64: string, question?: string): Promise<MultimodalResult> {
    return this.process(
      { imageBase64, text: question || "Describe this image in detail." },
      "You are a computer vision AI. Analyze images thoroughly and provide detailed descriptions, detect objects, text, and context."
    );
  }
}
