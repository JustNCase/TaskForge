import OpenAI from "openai";

export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
  tokenUsage: number;
}

export class EmbeddingService {
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model = "text-embedding-3-small") {
    this.client = new OpenAI({ apiKey: apiKey || process.env.OPENAI_API_KEY });
    this.model = model;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });

    return {
      embedding: response.data[0].embedding,
      dimensions: response.data[0].embedding.length,
      model: this.model,
      tokenUsage: response.usage?.total_tokens || 0,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((d, i) => ({
      embedding: d.embedding,
      dimensions: d.embedding.length,
      model: this.model,
      tokenUsage: 0,
    }));
  }

  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb);
    return denom === 0 ? 0 : dot / denom;
  }

  async semanticSearch(query: string, texts: string[], topK = 5): Promise<{ text: string; score: number }[]> {
    const [queryResult, textResults] = await Promise.all([
      this.embed(query),
      this.embedBatch(texts),
    ]);

    const scored = texts.map((text, i) => ({
      text,
      score: this.cosineSimilarity(queryResult.embedding, textResults[i].embedding),
    }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }
}
