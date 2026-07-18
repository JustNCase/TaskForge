export interface EmotionResult {
    primary: string;
    confidence: number;
    secondary?: string;
}
export declare class EmotionDetector {
    detect(_audioFeatures: Float32Array): EmotionResult;
    detectFromText(text: string): EmotionResult;
}
//# sourceMappingURL=emotion.d.ts.map