export interface GestureResult {
    gesture: string;
    confidence: number;
    hand: "left" | "right" | "both";
    description: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare class GestureRecognizer {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    recognize(imageBase64: string): Promise<GestureResult[]>;
}
//# sourceMappingURL=gestures.d.ts.map