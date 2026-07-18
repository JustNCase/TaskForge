export interface MetricEvent {
  type: string;
  value: number;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class Collector {
  private buffer: MetricEvent[] = [];

  collect(event: MetricEvent): void {
    this.buffer.push(event);
    if (this.buffer.length >= 100) {
      this.flush();
    }
  }

  flush(): MetricEvent[] {
    const events = [...this.buffer];
    this.buffer = [];
    return events;
  }

  size(): number {
    return this.buffer.length;
  }
}
