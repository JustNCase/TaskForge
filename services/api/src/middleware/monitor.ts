import { createLogger } from "@taskforge/core";
import { GenesisError, ErrorCode } from "@taskforge/core";

export interface LogEntry {
  timestamp: string;
  level: "debug" | "info" | "warn" | "error";
  service: string;
  message: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface Metrics {
  requests: number;
  responses: { success: number; error: number };
  latency: { min: number; max: number; avg: number };
  startTime: string;
}

export interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  services: Record<string, string>;
  timestamp: string;
  uptime: number;
}

export class ServiceMonitor {
  private metrics: Metrics;
  private logs: LogEntry[];
  private logger: ReturnType<typeof createLogger>;

  constructor(serviceName: string) {
    this.metrics = {
      requests: 0,
      responses: { success: 0, error: 0 },
    } as Metrics;
    this.logs = [];
    this.logger = createLogger(serviceName, "info");
  }

  log(level: LogEntry["level"], message: string, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.logger.name,
      message,
      metadata,
    };

    this.logs.push(entry);
    
    switch (level) {
      case "debug":
        this.logger.debug(message, metadata);
        break;
      case "info":
        this.logger.info(message, metadata);
        break;
      case "warn":
        this.logger.warn(message, metadata);
        break;
      case "error":
        this.logger.error(message, metadata);
        break;
    }

    this.metrics.requests++;
    if (level === "error") {
      this.metrics.responses.error++;
    } else {
      this.metrics.responses.success++;
    }
  }

  recordLatency(timeMs: number): void {
    if (!this.metrics.latency) {
      this.metrics.latency = { min: timeMs, max: timeMs, avg: timeMs };
    } else {
      this.metrics.latency.min = Math.min(this.metrics.latency.min, timeMs);
      this.metrics.latency.max = Math.max(this.metrics.latency.max, timeMs);
      this.metrics.latency.avg = (this.metrics.latency.avg * (this.metrics.responses.success + this.metrics.responses.error) + timeMs) / (this.metrics.responses.success + this.metrics.responses.error);
    }
  }

  getMetrics(): Metrics {
    return { ...this.metrics, startTime: new Date(this.metrics.startTime || Date.now()).toISOString() };
  }

  getLogs(level?: LogEntry["level"]): LogEntry[] {
    if (!level) return this.logs;
    return this.logs.filter((log) => log.level === level);
  }

  getHealth(): HealthCheck {
    const services: Record<string, string> = {
      [this.logger.name]: this.logs.length > 0 ? "healthy" : "unhealthy",
    };

    return {
      status: this.metrics.responses.error > 10 ? "unhealthy" : this.metrics.responses.error > 5 ? "degraded" : "healthy",
      services,
      timestamp: new Date().toISOString(),
      uptime: this.metrics.startTime ? (new Date().getTime() - new Date(this.metrics.startTime).getTime()) / 1000 : 0,
    };
  }

  createError(message: string, code: ErrorCode, statusCode?: number, details?: Record<string, unknown>): GenesisError {
    return new GenesisError(message, code, statusCode, details);
  }

  error(error: GenesisError | Error, message?: string): void {
    this.log("error", message || (error instanceof GenesisError ? error.message : error.message), {
      errorCode: error instanceof GenesisError ? error.code : ErrorCode.INTERNAL,
      statusCode: error instanceof GenesisError ? error.statusCode : 500,
    });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log("warn", message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log("info", message, metadata);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log("debug", message, metadata);
  }
}
