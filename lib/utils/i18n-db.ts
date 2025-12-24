/**
 * Database i18n Utilities
 *
 * Helper functions for extracting translations from JSONB columns.
 * Used with *_translations columns following the pattern:
 * {"en": "English text", "fr": "French text", "ar": "Arabic text"}
 *
 * @module lib/utils/i18n-db
 */

/**
 * Type for JSONB translation columns
 *
 * Represents the structure of *_translations fields in the database.
 * English is required, other locales are optional.
 */
export type TranslationsJson = {
  en: string;
  fr?: string;
  ar?: string;
  [key: string]: string | undefined;
};

/**
 * Supported locales for the application
 */
export type SupportedLocale = "en" | "fr" | "ar";

/**
 * Default fallback locale when requested translation is not available
 */
export const DEFAULT_LOCALE: SupportedLocale = "en";

/**
 * Extract a translation from a JSONB translations column
 *
 * Follows a fallback chain:
 * 1. Requested locale
 * 2. Fallback locale (default: 'en')
 * 3. First available value
 * 4. Empty string
 *
 * @param translations - JSONB object {"en": "...", "fr": "...", "ar": "..."}
 * @param locale - Requested locale code (en, fr, ar)
 * @param fallback - Fallback locale if requested is not available (default: 'en')
 * @returns Translated text or empty string
 *
 * @example
 * ```typescript
 * const plan = await prisma.bil_plans.findFirst({ where: { code: 'STARTER' } });
 * const name = getTranslation(plan.name_translations, 'fr');
 * // Returns: "FleetCore Starter" (or English fallback if FR missing)
 * ```
 */
export function getTranslation(
  translations: TranslationsJson | Record<string, string> | null | undefined,
  locale: string,
  fallback: string = DEFAULT_LOCALE
): string {
  // Handle null/undefined
  if (!translations || typeof translations !== "object") {
    return "";
  }

  // 1. Try requested locale
  const requested = translations[locale];
  if (requested && typeof requested === "string") {
    return requested;
  }

  // 2. Try fallback locale
  const fallbackValue = translations[fallback];
  if (fallbackValue && typeof fallbackValue === "string") {
    return fallbackValue;
  }

  // 3. Return first available value
  const values = Object.values(translations).filter(
    (v): v is string => typeof v === "string" && v.length > 0
  );

  return values.length > 0 ? values[0] : "";
}

/**
 * Check if a translations object has a specific locale
 *
 * @param translations - JSONB translations object
 * @param locale - Locale to check
 * @returns true if the locale exists and has a non-empty value
 */
export function hasTranslation(
  translations: TranslationsJson | Record<string, string> | null | undefined,
  locale: string
): boolean {
  if (!translations || typeof translations !== "object") {
    return false;
  }

  const value = translations[locale];
  return typeof value === "string" && value.length > 0;
}

/**
 * Get all available locales from a translations object
 *
 * @param translations - JSONB translations object
 * @returns Array of locale codes that have translations
 */
export function getAvailableLocales(
  translations: TranslationsJson | Record<string, string> | null | undefined
): string[] {
  if (!translations || typeof translations !== "object") {
    return [];
  }

  return Object.entries(translations)
    .filter(([, value]) => typeof value === "string" && value.length > 0)
    .map(([key]) => key);
}

/**
 * Create a translations object from a single value
 *
 * Useful when migrating data or creating new entries.
 * Sets the same value for all specified locales.
 *
 * @param value - The text value
 * @param locales - Locales to populate (default: ['en', 'fr', 'ar'])
 * @returns TranslationsJson object
 *
 * @example
 * ```typescript
 * const translations = createTranslations("New Plan");
 * // Returns: { en: "New Plan", fr: "New Plan", ar: "New Plan" }
 * ```
 */
export function createTranslations(
  value: string,
  locales: string[] = ["en", "fr", "ar"]
): TranslationsJson {
  const result: TranslationsJson = { en: value };

  for (const locale of locales) {
    result[locale] = value;
  }

  return result;
}

/**
 * Merge new translations into existing ones
 *
 * Only overwrites locales that are provided in the updates.
 * Preserves existing translations for locales not in updates.
 *
 * @param existing - Current translations object
 * @param updates - New translations to merge
 * @returns Merged translations object
 *
 * @example
 * ```typescript
 * const existing = { en: "Hello", fr: "Bonjour", ar: "مرحبا" };
 * const updated = mergeTranslations(existing, { fr: "Salut" });
 * // Returns: { en: "Hello", fr: "Salut", ar: "مرحبا" }
 * ```
 */
export function mergeTranslations(
  existing: TranslationsJson | Record<string, string> | null | undefined,
  updates: Partial<TranslationsJson>
): TranslationsJson {
  const base: TranslationsJson =
    existing && typeof existing === "object"
      ? { ...existing, en: existing.en || "" }
      : { en: "" };

  return { ...base, ...updates };
}
