import OpenAI from "openai";

export interface TTSOptions {
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed?: number;
  model?: string;
}

export class OpenAITTS {
  private client: OpenAI;
  private defaultModel: string;

  constructor(apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.defaultModel = "tts-1";
  }

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    const response = await this.client.audio.speech.create({
      model: options?.model || this.defaultModel,
      voice: options?.voice || "nova",
      input: text,
      speed: options?.speed || 1.0,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    return buffer;
  }

  async synthesizeStream(text: string, options?: TTSOptions): Promise<NodeJS.ReadableStream> {
    const response = await this.client.audio.speech.create({
      model: options?.model || this.defaultModel,
      voice: options?.voice || "nova",
      input: text,
      speed: options?.speed || 1.0,
      response_format: "pcm",
    });

    return response.body as unknown as NodeJS.ReadableStream;
  }
}
