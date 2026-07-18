export interface EmotionResult {
  primary: string;
  confidence: number;
  secondary?: string;
}

export class EmotionDetector {
  detect(_audioFeatures: Float32Array): EmotionResult {
    return { primary: "neutral", confidence: 0.7 };
  }

  detectFromText(text: string): EmotionResult {
    const lower = text.toLowerCase();
    if (lower.includes("excited") || lower.includes("amazing")) return { primary: "excited", confidence: 0.8 };
    if (lower.includes("frustrated") || lower.includes("annoyed")) return { primary: "frustrated", confidence: 0.75 };
    if (lower.includes("confused") || lower.includes("unclear")) return { primary: "confused", confidence: 0.7 };
    return { primary: "neutral", confidence: 0.6 };
  }
}
