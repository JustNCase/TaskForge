type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
};

const RESET = "\x1b[0m";

function formatHuman(entry: LogEntry): string {
  const color = COLORS[entry.level];
  const label = entry.level.toUpperCase().padEnd(5);
  let out = `[${entry.timestamp}] ${color}${label}${RESET} [${entry.service}] ${entry.message}`;
  if (entry.error) {
    out += `\n  ${color}ERROR: ${entry.error}${RESET}`;
  }
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    out += ` ${JSON.stringify(entry.metadata)}`;
  }
  return out;
}

export class Logger {
  private service: string;
  private level: LogLevel;
  private isProduction: boolean;

  constructor(service: string, level?: LogLevel) {
    this.service = service;
    this.level = level || (process.env.LOG_LEVEL as LogLevel) || "info";
    this.isProduction = process.env.NODE_ENV === "production";
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVELS[level] < LEVELS[this.level]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.service,
      message,
      metadata: meta,
    };

    if (this.isProduction) {
      const output = JSON.stringify(entry);
      if (level === "error") {
        console.error(output);
      } else {
        console.log(output);
      }
    } else {
      const output = formatHuman(entry);
      if (level === "error") {
        console.error(output);
      } else {
        console.log(output);
      }
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log("error", message, meta);
  }
}
