import OpenAI from "openai";

export interface TranscriptResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
}

export class WhisperSTT {
  private client: OpenAI;
  private model: string;

  constructor(model: string = "whisper-1", apiKey?: string) {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async transcribe(audioBuffer: Buffer, filename: string = "audio.webm"): Promise<TranscriptResult> {
    const file = new File([audioBuffer], filename, { type: "audio/webm" });

    const response = await this.client.audio.transcriptions.create({
      model: this.model,
      file,
      response_format: "verbose_json",
    });

    return {
      text: response.text,
      language: response.language || "en",
      confidence: 0.9,
      duration: response.duration || 0,
    };
  }

  async transcribeFile(filePath: string): Promise<TranscriptResult> {
    const fs = require("fs");
    const file = fs.createReadStream(filePath);

    const response = await this.client.audio.transcriptions.create({
      model: this.model,
      file,
      response_format: "verbose_json",
    });

    return {
      text: response.text,
      language: response.language || "en",
      confidence: 0.9,
      duration: response.duration || 0,
    };
  }
}
