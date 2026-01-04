/**
 * Format a number as currency using Intl.NumberFormat
 * @param value - Numeric value to format
 * @param locale - Locale code (en, fr, etc.)
 * @param currency - Currency code (EUR, USD, etc.) - defaults to EUR
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  locale: string = "en",
  currency: string = "EUR"
): string {
  const localeMap: Record<string, string> = {
    en: "en-IE", // Irish English uses EUR format
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    ar: "ar-AE",
  };

  const fullLocale = localeMap[locale] || "en-IE";

  return new Intl.NumberFormat(fullLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format currency without decimals for cleaner display
 */
export function formatCurrencyCompact(
  value: number,
  locale: string = "en",
  currency: string = "EUR"
): string {
  const localeMap: Record<string, string> = {
    en: "en-IE",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    ar: "ar-AE",
  };

  const fullLocale = localeMap[locale] || "en-IE";

  return new Intl.NumberFormat(fullLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
