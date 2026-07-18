import OpenAI from "openai";
export class WhisperSTT {
    client;
    model;
    constructor(model = "whisper-1", apiKey) {
        this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
        this.model = model;
    }
    async transcribe(audioBuffer, filename = "audio.webm") {
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
    async transcribeFile(filePath) {
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
//# sourceMappingURL=whisper.js.map