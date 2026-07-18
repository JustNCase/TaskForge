export interface AccentResult {
    region: string;
    confidence: number;
}
export declare class AccentDetector {
    detect(_audioFeatures: Float32Array): AccentResult;
    detectFromPhonemes(_phonemes: string[]): AccentResult;
}
//# sourceMappingURL=accent.d.ts.map