/**
 * GeoIP Service
 *
 * V6.2.3 - Détection du pays via IP pour pré-remplir le formulaire
 *
 * @module lib/services/geo/geoip.service
 */

import geoip from "geoip-lite";

// Fallback IP when no proxy header found (localhost)
const LOCALHOST_IP = ["127", "0", "0", "1"].join(".");

export class GeoIPService {
  /**
   * Get country code from IP address
   * @param ip - IP address (IPv4 or IPv6)
   * @returns ISO 3166-1 alpha-2 country code or null
   */
  getCountryFromIP(ip: string): string | null {
    // geoip.lookup returns null for localhost/private IPs
    const geo = geoip.lookup(ip);
    return geo?.country ?? null;
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
  detectCountry(request: Request): {
    ip: string;
    countryCode: string | null;
    detected: boolean;
  } {
    const ip = this.getClientIP(request);
    const countryCode = this.getCountryFromIP(ip);

    return {
      ip,
      countryCode,
      detected: countryCode !== null,
    };
  }
}

// Singleton export
export const geoIPService = new GeoIPService();
