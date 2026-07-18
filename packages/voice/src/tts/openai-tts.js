import OpenAI from "openai";
export class OpenAITTS {
    client;
    defaultModel;
    constructor(apiKey) {
        this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        this.defaultModel = "tts-1";
    }
    async synthesize(text, options) {
        const response = await this.client.audio.speech.create({
            model: options?.model || this.defaultModel,
            voice: options?.voice || "nova",
            input: text,
            speed: options?.speed || 1.0,
        });
        const buffer = Buffer.from(await response.arrayBuffer());
        return buffer;
    }
    async synthesizeStream(text, options) {
        const response = await this.client.audio.speech.create({
            model: options?.model || this.defaultModel,
            voice: options?.voice || "nova",
            input: text,
            speed: options?.speed || 1.0,
            response_format: "pcm",
        });
        return response.body;
    }
}
//# sourceMappingURL=openai-tts.js.map