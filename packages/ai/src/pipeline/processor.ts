export interface ProcessResult<T> {
  data: T;
  metadata: Record<string, unknown>;
}

export class Processor {
  async process<T>(input: T): Promise<ProcessResult<T>> {
    return {
      data: input,
      metadata: { processedAt: new Date().toISOString() },
    };
  }
}
