/**
 * Structured Logger with Pino
 *
 * Replaces console.* statements for production-ready logging.
 * Supports different log levels, automatic redaction of sensitive data,
 * and pretty-printing in development.
 */

import pino from "pino";

/**
 * Logger instance configured for development and production
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

  // Pretty print in development, JSON in production
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
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
