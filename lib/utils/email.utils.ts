/**
 * Email Utility Functions
 *
 * Helper functions for email templates:
 * - Country flag emoji generation
 * - Country name translation
 * - Lead detail URL construction
 */

/**
 * Country code to flag emoji mapping
 *
 * Converts ISO 3166-1 alpha-2 country code to emoji flag.
 * Uses Unicode regional indicator symbols.
 *
 * @example
 * ```typescript
 * getCountryFlag('AE') // Returns: 🇦🇪
 * getCountryFlag('FR') // Returns: 🇫🇷
 * getCountryFlag('SA') // Returns: 🇸🇦
 * ```
 */
export function getCountryFlag(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return "🌍"; // Default world emoji
  }

  // Convert country code to regional indicator symbols
  // A = U+1F1E6, B = U+1F1E7, ..., Z = U+1F1FF
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 0x1f1e6 + char.charCodeAt(0) - 65);

  return String.fromCodePoint(...codePoints);
}

/**
 * @deprecated This function duplicates data from crm_countries table.
 * Use crm_countries.country_name_en/fr/ar directly from database instead.
 *
 * Country names are now managed in crm_countries table with columns:
 * - country_name_en
 * - country_name_fr
 * - country_name_ar
 *
 * The notification service automatically selects the correct locale based on:
 * 1. crm_countries.notification_locale
 * 2. Lead country_code cascade
 *
 * This function will be removed in a future version.
 */

/**
 * Construct lead detail URL
 *
 * Builds full URL to lead detail page in CRM.
 *
 * @example
 * ```typescript
 * getLeadDetailUrl('abc123-def456')
 * // Returns: 'https://app.fleetcore.com/crm/leads/abc123-def456'
 * ```
 */
export function getLeadDetailUrl(leadId: string): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.com";
  return `${baseUrl}/crm/leads/${leadId}`;
}

/**
 * Format fleet size for display
 *
 * Converts fleet size code to human-readable format.
 *
 * @example
 * ```typescript
 * formatFleetSize('500+') // Returns: '500+ vehicles'
 * formatFleetSize('51-100') // Returns: '51-100 vehicles'
 * ```
 */
export function formatFleetSize(fleetSize: string | null): string {
  if (!fleetSize) {
    return "Unknown fleet size";
  }

  return `${fleetSize} vehicles`;
}

/**
 * Format priority with emoji
 *
 * Adds emoji indicator to priority level.
 *
 * @example
 * ```typescript
 * formatPriority('urgent') // Returns: '🔴 Urgent'
 * formatPriority('high') // Returns: '🟠 High'
 * formatPriority('medium') // Returns: '🟡 Medium'
 * formatPriority('low') // Returns: '🟢 Low'
 * ```
 */
export function formatPriority(priority: string): string {
  const priorityEmojis: Record<string, string> = {
    urgent: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  };

  const emoji = priorityEmojis[priority.toLowerCase()] || "⚪";
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);

  return `${emoji} ${label}`;
}
