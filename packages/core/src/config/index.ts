import type { AppConfig } from "../types/index";

const defaults: AppConfig = {
  env: "development",
  port: 3001,
  logLevel: "info",
  cors: { origin: "*" },
};

let config: AppConfig = { ...defaults };

export function createConfig(overrides: Partial<AppConfig>): AppConfig {
  config = { ...defaults, ...overrides };
  return config;
}

export function getConfig(): AppConfig {
  return config;
}
