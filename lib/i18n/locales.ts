/**
 * i18n locale configuration (server-safe)
 *
 * This file contains only types and constants, no React dependencies.
 * Safe to import in Server Components, middleware, and Client Components.
 */

export const locales = ["en", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
