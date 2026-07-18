export interface ModelInfo {
  name: string;
  version: string;
  framework: "tensorflow" | "onnx" | "custom";
  inputShape: number[];
  outputShape: number[];
  loaded: boolean;
  tags: string[];
}

export class TFModelManager {
  private models: Map<string, ModelInfo> = new Map();
  private loadedModels: Map<string, unknown> = new Map();
  private tfInstance: any = null;

  private async getTF(): Promise<any> {
    if (!this.tfInstance) {
      try {
        this.tfInstance = await new Function('return import("@tensorflow/tfjs")')();
      } catch {
        throw new Error(
          "TensorFlow.js not available. Install @tensorflow/tfjs or @tensorflow/tfjs-node"
        );
      }
    }
    return this.tfInstance;
  }

  async listModels(): Promise<ModelInfo[]> {
    return Array.from(this.models.values());
  }

  async registerModel(name: string, info: Omit<ModelInfo, "loaded">): Promise<void> {
    this.models.set(name, { ...info, loaded: false });
  }

  async loadModel(name: string, pathOrUrl: string): Promise<boolean> {
    const tf = await this.getTF();
    try {
      const model = await tf.loadGraphModel(pathOrUrl);
      this.loadedModels.set(name, model);
      const info = this.models.get(name);
      if (info) info.loaded = true;
      return true;
    } catch (err: any) {
      console.error(`[TFModelManager] Failed to load model '${name}':`, err?.message);
      return false;
    }
  }

  async predict(name: string, input: number[] | number[][]): Promise<number[] | number[][]> {
    const tf = await this.getTF();
    const model = this.loadedModels.get(name);
    if (!model) throw new Error(`Model '${name}' not loaded`);

    const tensor = tf.tensor(input);
    const output = await (model as any).predict(tensor);
    const result = await output.array();
    tf.dispose(tensor);
    tf.dispose(output);
    return result;
  }

  isAvailable(): boolean {
    try {
      const resolved = require.resolve("@tensorflow/tfjs");
      return !!resolved;
    } catch {
      return false;
    }
  }

  getModelInfo(name: string): ModelInfo | undefined {
    return this.models.get(name);
  }
}
