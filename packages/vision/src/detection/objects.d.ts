export interface DetectedObject {
    label: string;
    confidence: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
export declare class ObjectDetector {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    detect(imageBase64: string): Promise<DetectedObject[]>;
}
//# sourceMappingURL=objects.d.ts.map