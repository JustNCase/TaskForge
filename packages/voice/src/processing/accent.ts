export interface AccentResult {
  region: string;
  confidence: number;
}

export class AccentDetector {
  detect(_audioFeatures: Float32Array): AccentResult {
    return { region: "unknown", confidence: 0 };
  }

  detectFromPhonemes(_phonemes: string[]): AccentResult {
    return { region: "unknown", confidence: 0 };
  }
}
