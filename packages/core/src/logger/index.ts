import type { Logger } from "../types/index";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(name: string, level: LogLevel = "info"): Logger {
  const minLevel = LEVELS[level];

  function log(lvl: LogLevel, message: string, meta?: Record<string, unknown>) {
    if (LEVELS[lvl] < minLevel) return;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level: lvl, name, message, ...meta };
    if (lvl === "error") {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
  }

  return {
    name,
    debug: (msg, meta) => log("debug", msg, meta),
    info: (msg, meta) => log("info", msg, meta),
    warn: (msg, meta) => log("warn", msg, meta),
    error: (msg, meta) => log("error", msg, meta),
  };
}
