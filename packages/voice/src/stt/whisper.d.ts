export interface TranscriptResult {
    text: string;
    language: string;
    confidence: number;
    duration: number;
}
export declare class WhisperSTT {
    private client;
    private model;
    constructor(model?: string, apiKey?: string);
    transcribe(audioBuffer: Buffer, filename?: string): Promise<TranscriptResult>;
    transcribeFile(filePath: string): Promise<TranscriptResult>;
}
//# sourceMappingURL=whisper.d.ts.map