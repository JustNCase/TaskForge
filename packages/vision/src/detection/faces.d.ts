export interface FaceResult {
    faceIndex: number;
    confidence: number;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    emotion?: string;
    emotionConfidence?: number;
    age?: string;
    gender?: string;
}
export declare class FaceDetector {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    detect(imageBase64: string): Promise<FaceResult[]>;
}
//# sourceMappingURL=faces.d.ts.map