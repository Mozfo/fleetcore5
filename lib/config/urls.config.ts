/**
 * URL Configuration for FleetCore SaaS
 *
 * FleetCore has two distinct URL contexts:
 * 1. APP - The authenticated SaaS application (app.fleetcore.io)
 * 2. PUBLIC - Public-facing pages: marketing, booking flow, email links (fleetcore.io)
 *
 * This separation ensures:
 * - Email links always point to public pages (no auth required)
 * - App links point to the authenticated dashboard
 * - Consistent HTTPS across all environments
 *
 * @module lib/config/urls.config
 */

/**
 * Normalize URL to ensure HTTPS and clean format
 */
function normalizeUrl(url: string): string {
  return url
    .replace(/^http:\/\//i, "https://") // Force HTTPS
    .replace(/\/$/, ""); // Remove trailing slash
}

/**
 * URL configuration for different contexts
 */
export const URLS = {
  /**
   * SaaS application URL (authenticated pages)
   * Used for: dashboard, CRM, settings, etc.
   */
  app: normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io"
  ),

  /**
   * Public site URL (unauthenticated pages)
   * Used for: marketing, booking flow, email links
   */
  public: normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL || "https://fleetcore.io"
  ),
} as const;

/**
 * Get the appropriate base URL for email links
 * Always uses public URL since email recipients may not be authenticated
 */
export function getEmailBaseUrl(): string {
  return URLS.public;
}

/**
 * Build a public URL with path
 */
export function buildPublicUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${URLS.public}${cleanPath}`;
}

/**
 * Build an app URL with path
 */
export function buildAppUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${URLS.app}${cleanPath}`;
}
