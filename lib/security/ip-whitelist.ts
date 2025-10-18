/**
 * IP Whitelist Security Helper
 *
 * Provides IP validation for admin routes with fail-closed behavior in production.
 */

import { getIpFromRequest } from "@/lib/audit";
import { logger } from "@/lib/logger";

export function parseIPWhitelist(envVar: string | undefined): string[] {
  if (!envVar || envVar.trim() === "") {
    return [];
  }

  const ips = envVar
    .split(",")
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);

  const validIPs = ips.filter(isValidIP);

  if (validIPs.length < ips.length) {
    const invalidIPs = ips.filter((ip) => !isValidIP(ip));
    logger.warn(
      { invalidIPs },
      "[SECURITY] Invalid IPs removed from whitelist"
    );
  }

  return validIPs;
}

function isValidIP(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex =
    /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:)|::([0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})$/i;

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return false;
  }

  if (ipv4Regex.test(ip)) {
    const octets = ip.split(".").map(Number);
    const maxOctetValue = 255;
    return octets.every((octet) => octet >= 0 && octet <= maxOctetValue);
  }

  return true;
}

function isLocalhost(ip: string | null): boolean {
  if (!ip) return false;
  const localhostIPv4 = "127.0.0.1";
  const localhostIPv6 = "::1";
  const localhostName = "localhost";
  return ip === localhostIPv4 || ip === localhostIPv6 || ip === localhostName;
}

export function validateIPWhitelist(
  headers: Headers,
  whitelist: string[],
  isDevelopment: boolean
): boolean {
  const clientIP = getIpFromRequest(headers);

  if (isDevelopment && isLocalhost(clientIP)) {
    return true;
  }

  if (whitelist.length === 0) {
    // Fail-open ONLY in pure development (not test, not production)
    // NODE_ENV=test must enforce fail-closed for E2E security tests
    if (isDevelopment && process.env.NODE_ENV !== 'test') {
      logger.warn(
        {},
        "[DEV] ADMIN_IP_WHITELIST empty - allowing all IPs in development"
      );
      return true;
    } else {
      // Fail-closed in: production, test, staging, or any non-development env
      const env = process.env.NODE_ENV || 'production';
      logger.error(
        {},
        `[SECURITY] ADMIN_IP_WHITELIST required in ${env} - blocking all admin access`
      );
      return false;
    }
  }

  if (!clientIP) {
    logger.warn({}, "[SECURITY] IP header missing - blocking access");
    return false;
  }

  const isAllowed = whitelist.includes(clientIP);

  if (!isAllowed) {
    logger.warn(
      { clientIP },
      "[SECURITY] IP not in whitelist - blocking access"
    );
  }

  return isAllowed;
}
