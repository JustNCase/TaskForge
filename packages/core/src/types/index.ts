export interface AppConfig {
  env: "development" | "production" | "test";
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  cors: { origin: string };
}

export interface Logger {
  name: string;
  debug: (message: string, meta?: Record<string, unknown>) => void;
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

export interface ServiceConfig {
  name: string;
  port: number;
  host?: string;
}
