/**
 * GeoIP Service
 *
 * V6.2.3 - Détection du pays via IP pour pré-remplir le formulaire
 * V6.4   - Fix: Added IPv6 localhost/private IP handling
 *
 * Uses ip-api.com for serverless compatibility (geoip-lite doesn't work on Vercel)
 * Free tier: 45 requests/minute (sufficient for demo booking)
 *
 * @module lib/services/geo/geoip.service
 */

// Fallback IP when no proxy header found (localhost)
const LOCALHOST_IP = "127.0.0.1";

/**
 * Check if an IP address is localhost or private (should not be queried)
 *
 * Covers:
 * - IPv4 localhost: 127.0.0.1
 * - IPv6 localhost: ::1
 * - IPv6-mapped IPv4 localhost: ::ffff:127.x.x.x
 * - IPv4 private ranges: 10.x.x.x, 172.16-31.x.x, 192.168.x.x
 * - IPv6 link-local: fe80::
 * - IPv6 unique local: fc00::/7 (fc, fd prefixes)
 */
function isPrivateOrLocalIP(ip: string): boolean {
  // IPv4 localhost
  if (ip === "127.0.0.1" || ip.startsWith("127.")) {
    return true;
  }

  // IPv6 localhost
  if (ip === "::1") {
    return true;
  }

  // IPv6-mapped IPv4 localhost (::ffff:127.x.x.x)
  if (ip.toLowerCase().startsWith("::ffff:127.")) {
    return true;
  }

  // IPv4 private ranges
  if (
    ip.startsWith("10.") || // 10.0.0.0/8
    ip.startsWith("192.168.") // 192.168.0.0/16
  ) {
    return true;
  }

  // IPv4 private range 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
  if (ip.startsWith("172.")) {
    const secondOctet = parseInt(ip.split(".")[1], 10);
    if (secondOctet >= 16 && secondOctet <= 31) {
      return true;
    }
  }

  // IPv6 link-local (fe80::/10)
  if (ip.toLowerCase().startsWith("fe80:")) {
    return true;
  }

  // IPv6 unique local (fc00::/7 = fc and fd prefixes)
  const ipLower = ip.toLowerCase();
  if (ipLower.startsWith("fc") || ipLower.startsWith("fd")) {
    return true;
  }

  return false;
}

export class GeoIPService {
  /**
   * Get country code from IP address using ip-api.com
   * @param ip - IP address (IPv4 or IPv6)
   * @returns ISO 3166-1 alpha-2 country code or null
   */
  async getCountryFromIP(ip: string): Promise<string | null> {
    // Don't query for localhost/private IPs
    if (isPrivateOrLocalIP(ip)) {
      return null;
    }

    try {
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=countryCode`,
        {
          // 5 second timeout
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as { countryCode?: string };
      return data.countryCode ?? null;
    } catch {
      // Network error, timeout, etc - fail silently
      return null;
    }
  }

  /**
   * Extract client IP from request headers
   * Handles various proxy configurations (Cloudflare, Nginx, standard)
   *
   * @param request - NextRequest or Request object
   * @returns Client IP address
   */
  getClientIP(request: Request): string {
    // Priority order for IP headers
    const headers = [
      "cf-connecting-ip", // Cloudflare
      "x-real-ip", // Nginx
      "x-forwarded-for", // Standard proxy
      "x-client-ip", // Some load balancers
      "true-client-ip", // Akamai
    ];

    for (const header of headers) {
      const value = request.headers.get(header);
      if (value) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return value.split(",")[0].trim();
      }
    }

    // Fallback - will return null country for localhost
    return LOCALHOST_IP;
  }

  /**
   * Full detection: get IP and country in one call
   */
  async detectCountry(request: Request): Promise<{
    ip: string;
    countryCode: string | null;
    detected: boolean;
  }> {
    const ip = this.getClientIP(request);
    const countryCode = await this.getCountryFromIP(ip);

    return {
      ip,
      countryCode,
      detected: countryCode !== null,
    };
  }
}

// Singleton export
export const geoIPService = new GeoIPService();
