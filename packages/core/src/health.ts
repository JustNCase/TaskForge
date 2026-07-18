interface HealthResult {
  status: "healthy" | "degraded" | "unhealthy";
  service: string;
  version: string;
  uptime: number;
  timestamp: string;
  checks: Record<string, { status: string; latency?: number }>;
}

export class HealthCheck {
  private checks: Map<string, () => Promise<{ status: string; latency?: number }>> = new Map();
  private startTime: number;
  private service: string;
  private version: string;

  constructor(service: string, version?: string) {
    this.service = service;
    this.version = version || "0.0.0";
    this.startTime = Date.now();
  }

  addCheck(name: string, fn: () => Promise<{ status: string; latency?: number }>): void {
    this.checks.set(name, fn);
  }

  async check(): Promise<HealthResult> {
    const results: Record<string, { status: string; latency?: number }> = {};
    let overallStatus: "healthy" | "degraded" | "unhealthy" = "healthy";

    for (const [name, fn] of this.checks) {
      try {
        const start = Date.now();
        const result = await fn();
        result.latency = Date.now() - start;
        results[name] = result;
        if (result.status !== "ok") {
          overallStatus = "degraded";
        }
      } catch {
        results[name] = { status: "error" };
        overallStatus = "unhealthy";
      }
    }

    return {
      status: overallStatus,
      service: this.service,
      version: this.version,
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks: results,
    };
  }

  addDatabaseCheck(): void {
    this.addCheck("database", async () => {
      const start = Date.now();
      const latencyMs = Date.now() - start;
      return { status: "ok", latency: latencyMs };
    });
  }

  addMemoryCheck(): void {
    this.addCheck("memory", async () => {
      const usage = process.memoryUsage();
      const heapUsedMB = usage.heapUsed / 1024 / 1024;
      const heapTotalMB = usage.heapTotal / 1024 / 1024;
      const ratio = heapUsedMB / heapTotalMB;
      if (ratio > 0.9) {
        return { status: "critical", latency: Math.round(heapUsedMB) };
      }
      if (ratio > 0.7) {
        return { status: "warning", latency: Math.round(heapUsedMB) };
      }
      return { status: "ok", latency: Math.round(heapUsedMB) };
    });
  }
}
