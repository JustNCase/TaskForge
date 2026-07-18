import type { MetricEvent } from "./collector";

export interface AggregatedMetric {
  type: string;
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
}

export class Processor {
  aggregate(events: MetricEvent[]): AggregatedMetric[] {
    const grouped = new Map<string, MetricEvent[]>();
    for (const event of events) {
      const existing = grouped.get(event.type) || [];
      existing.push(event);
      grouped.set(event.type, existing);
    }

    return Array.from(grouped.entries()).map(([type, events]) => {
      const values = events.map((e) => e.value);
      return {
        type,
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });
  }
}
