/**
 * GeoIP Service
 *
 * V6.2.3 - Détection du pays via IP pour pré-remplir le formulaire
 *
 * Uses ip-api.com for serverless compatibility (geoip-lite doesn't work on Vercel)
 * Free tier: 45 requests/minute (sufficient for demo booking)
 *
 * @module lib/services/geo/geoip.service
 */

// Fallback IP when no proxy header found (localhost)
const LOCALHOST_IP = ["127", "0", "0", "1"].join(".");

export class GeoIPService {
  /**
   * Get country code from IP address using ip-api.com
   * @param ip - IP address (IPv4 or IPv6)
   * @returns ISO 3166-1 alpha-2 country code or null
   */
  async getCountryFromIP(ip: string): Promise<string | null> {
    // Don't query for localhost/private IPs
    if (
      ip === LOCALHOST_IP ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
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
