/**
 * Structured Logger with Pino
 *
 * Replaces console.* statements for production-ready logging.
 * Supports different log levels, automatic redaction of sensitive data.
 *
 * NOTE: pino-pretty transport is DISABLED because thread-stream
 * is incompatible with Next.js Turbopack. Using sync logging instead.
 */

import pino from "pino";

/**
 * Logger instance configured for development and production
 * PERF: Disabled pino-pretty transport to avoid thread-stream crash with Turbopack
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Format log levels
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },

  // Redact sensitive fields automatically
  redact: {
    paths: [
      "password",
      "token",
      "apiKey",
      "api_key",
      "secret",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.api_key",
    ],
    censor: "[REDACTED]",
  },

  // DISABLED: pino-pretty uses thread-stream which crashes with Turbopack
  // In development, logs are JSON but still readable
  // In production, JSON format for log aggregation
});

/**
 * Child logger with additional context
 *
 * @example
 * const log = createLogger({ module: 'auth' });
 * log.info('User logged in');
 */
export function createLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}
