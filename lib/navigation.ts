/**
 * Navigation helpers for i18n (internationalization)
 *
 * This module provides centralized helpers for locale-aware navigation
 * to avoid hardcoding locale prefixes throughout the application.
 *
 * Usage:
 *
 * Server Components:
 * ```typescript
 * import { localizedRedirect } from "@/lib/navigation";
 * const { locale } = await params;
 * if (!user) localizedRedirect("login", locale);
 * ```
 *
 * Client Components:
 * ```typescript
 * import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
 * const { localizedPath } = useLocalizedPath();
 * router.push(localizedPath("dashboard"));
 * ```
 *
 * Middleware:
 * ```typescript
 * import { getLocaleFromPathname, getLocalizedPath } from "@/lib/navigation";
 * const locale = getLocaleFromPathname(req.nextUrl.pathname);
 * const loginUrl = getLocalizedPath("login", locale);
 * ```
 */

import { redirect as nextRedirect } from "next/navigation";
import { type Locale, locales, defaultLocale } from "@/lib/i18n/locales";

/**
 * Constructs a localized path by prefixing with locale
 *
 * @param path - The path without locale (e.g., "dashboard", "login", "/settings")
 * @param locale - The locale to use (e.g., "en", "fr")
 * @returns Localized path (e.g., "/en/dashboard", "/fr/login")
 *
 * @example
 * getLocalizedPath("dashboard", "en") // "/en/dashboard"
 * getLocalizedPath("/settings", "fr") // "/fr/settings"
 */
export function getLocalizedPath(path: string, locale: Locale): string {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `/${locale}/${cleanPath}`;
}

/**
 * Performs a locale-aware redirect (Server Components only)
 *
 * @param path - The path to redirect to (e.g., "login", "dashboard")
 * @param locale - The locale to use
 * @throws Redirect exception (Next.js redirect behavior)
 *
 * @example
 * // In a Server Component
 * const { locale } = await params;
 * if (!user) localizedRedirect("login", locale);
 */
export function localizedRedirect(path: string, locale: Locale): never {
  return nextRedirect(getLocalizedPath(path, locale));
}

/**
 * Extracts locale from URL pathname
 *
 * @param pathname - The URL pathname (e.g., "/en/dashboard", "/fr/login")
 * @returns The detected locale, or defaultLocale if none found
 *
 * @example
 * getLocaleFromPathname("/en/dashboard") // "en"
 * getLocaleFromPathname("/fr/settings") // "fr"
 * getLocaleFromPathname("/api/data") // "en" (defaultLocale)
 */
export function getLocaleFromPathname(pathname: string): Locale {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

/**
 * Constructs absolute localized URL for Clerk components
 * Requires NEXT_PUBLIC_APP_URL environment variable in production
 *
 * @param path - Path without locale (e.g., "dashboard", "/")
 * @param locale - Locale to use
 * @returns Absolute URL (e.g., "http://localhost:3000/en/dashboard")
 *
 * @example
 * getAbsoluteLocalizedPath("/", "en")
 * // "http://localhost:3000/en"
 *
 * @example
 * getAbsoluteLocalizedPath("dashboard", "fr")
 * // "https://fleetcore.io/fr/dashboard"
 */
export function getAbsoluteLocalizedPath(path: string, locale: Locale): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!baseUrl) {
    if (process.env.NODE_ENV === "development") {
      const fallback = "http://localhost:3000";
      console.warn(
        `⚠️  NEXT_PUBLIC_APP_URL not set, using fallback: ${fallback}`
      );
      return `${fallback}${getLocalizedPath(path, locale)}`;
    }
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set in production environment"
    );
  }

  return `${baseUrl}${getLocalizedPath(path, locale)}`;
}

// Re-export i18n config for convenience
export { locales, defaultLocale, type Locale };
