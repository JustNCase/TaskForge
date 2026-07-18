export interface SceneResult {
    sceneType: string;
    description: string;
    confidence: number;
    lighting: string;
    environment: string;
    activities: string[];
    objects: string[];
}
export declare class SceneAnalyzer {
    private client;
    private model;
    constructor(apiKey?: string, model?: string);
    analyze(imageBase64: string): Promise<SceneResult>;
}
//# sourceMappingURL=scenes.d.ts.map