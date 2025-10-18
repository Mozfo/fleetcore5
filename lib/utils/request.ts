/**
 * Request Utility Functions
 *
 * Edge Runtime compatible utilities for extracting request metadata.
 * These functions do NOT import Prisma or any Node.js-specific APIs.
 *
 * Usage: middleware.ts (Edge Runtime)
 */

/**
 * Extract IP address from request headers
 *
 * Checks multiple headers commonly used by proxies/load balancers:
 * 1. x-forwarded-for (comma-separated list, first is client)
 * 2. x-real-ip (single IP)
 *
 * @param headers - Request headers object
 * @returns IP address string or null if not found
 *
 * @example
 * ```typescript
 * const ip = getIpFromRequest(request.headers);
 * // => "203.0.113.42" or null
 * ```
 */
export function getIpFromRequest(headers: Headers): string | null {
  return (
    headers.get("x-forwarded-for")?.split(",")[0] ||
    headers.get("x-real-ip") ||
    null
  );
}

/**
 * Extract User Agent from request headers
 *
 * @param headers - Request headers object
 * @returns User agent string or null if not found
 *
 * @example
 * ```typescript
 * const userAgent = getUserAgentFromRequest(request.headers);
 * // => "Mozilla/5.0 (Windows NT 10.0; Win64; x64)..." or null
 * ```
 */
export function getUserAgentFromRequest(headers: Headers): string | null {
  return headers.get("user-agent") || null;
}
