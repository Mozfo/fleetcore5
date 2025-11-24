import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

/**
 * Capture client IP address from request headers for GDPR consent tracking
 *
 * Extraction priority:
 * 1. x-forwarded-for (proxy/load balancer) - takes first IP in chain
 * 2. x-real-ip (Vercel, Nginx)
 * 3. "unknown" (fallback if no headers available)
 *
 * **GDPR Compliance:**
 * IP address capture is required for GDPR consent audit trail.
 * Stores proof of when and where consent was given.
 *
 * @param request - Next.js request object
 * @returns IP address string (IPv4 or IPv6 format, or "unknown")
 *
 * @example
 * ```typescript
 * // In API route handler
 * export async function POST(request: NextRequest) {
 *   const consent_ip = captureConsentIp(request);
 *
 *   await leadService.createLead({
 *     ...data,
 *     gdpr_consent: true,
 *     consent_ip, // Store IP for audit trail
 *   });
 * }
 * ```
 */
export function captureConsentIp(request: NextRequest): string {
  // Try x-forwarded-for first (common for proxies/load balancers)
  const forwarded = request.headers.get("x-forwarded-for");

  // Try x-real-ip as fallback (used by Vercel, Nginx)
  const realIp = request.headers.get("x-real-ip");

  // x-forwarded-for can contain multiple IPs in a chain: "client, proxy1, proxy2"
  // We want the first one (actual client IP)
  const ip = forwarded?.split(",")[0]?.trim() || realIp || "unknown";

  // Log warning if we couldn't capture IP (compliance concern)
  if (ip === "unknown") {
    logger.warn(
      "[GDPR Middleware] Unable to capture consent_ip from request headers. " +
        "This may affect GDPR audit trail compliance."
    );
  }

  return ip;
}

/**
 * Validate GDPR consent data completeness
 *
 * Checks if all required GDPR fields are present when consent is given.
 * Used for additional validation beyond LeadCreationService.
 *
 * @param gdprConsent - Whether user consented
 * @param consentIp - IP address where consent was given
 * @returns Validation result with valid flag and optional error message
 *
 * @example
 * ```typescript
 * const validation = validateGdprConsent(body.gdpr_consent, consent_ip);
 * if (!validation.valid) {
 *   return NextResponse.json({ error: validation.error }, { status: 400 });
 * }
 * ```
 */
export function validateGdprConsent(
  gdprConsent?: boolean,
  consentIp?: string
): { valid: boolean; error?: string } {
  // If consent given, IP must be captured
  if (gdprConsent && !consentIp) {
    return {
      valid: false,
      error: "consent_ip is required when gdpr_consent is true",
    };
  }

  // If consent given, IP should not be "unknown"
  if (gdprConsent && consentIp === "unknown") {
    logger.warn(
      "[GDPR Validation] Consent given but IP is 'unknown'. " +
        "Audit trail may be incomplete."
    );
    // Don't block, but warn (IP capture failure shouldn't prevent lead creation)
  }

  return { valid: true };
}
