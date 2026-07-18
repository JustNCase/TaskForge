export interface TTSOptions {
    voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    speed?: number;
    model?: string;
}
export declare class OpenAITTS {
    private client;
    private defaultModel;
    constructor(apiKey?: string);
    synthesize(text: string, options?: TTSOptions): Promise<Buffer>;
    synthesizeStream(text: string, options?: TTSOptions): Promise<NodeJS.ReadableStream>;
}
//# sourceMappingURL=openai-tts.d.ts.map