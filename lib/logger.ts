import pino from "pino";

const isProd = process.env.NODE_ENV === "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  base: { service: "fiscal-guardian-demo" },
  redact: {
    paths: ["ANTHROPIC_API_KEY", "*.apiKey", "headers.authorization"],
    censor: "[redacted]",
  },
  transport: isProd
    ? undefined
    : {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss.l" },
      },
});
