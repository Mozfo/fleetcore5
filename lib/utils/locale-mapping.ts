/**
 * Locale Mapping Utilities
 *
 * Maps user-facing locales (i18n.language) to template locales for email notifications.
 * Configuration is stored in crm_settings.locale_template_mapping.
 *
 * @module lib/utils/locale-mapping
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  CrmSettingsRepository,
  CrmSettingKey,
} from "@/lib/repositories/crm/settings.repository";

/**
 * Locale template mapping configuration structure
 */
export interface LocaleTemplateMappingConfig {
  /**
   * Maps user locale codes to template locale codes
   * Example: { "en": "en", "en-US": "en", "fr": "fr", "es": "en", "default": "en" }
   */
  [locale: string]: string;
}

/**
 * Get locale template mapping configuration from database
 *
 * @returns Locale mapping config or fallback defaults
 *
 * @example
 * ```typescript
 * const config = await getLocaleMappingConfig();
 * // Returns: { "en": "en", "fr": "fr", "es": "en", "default": "en" }
 * ```
 */
export async function getLocaleMappingConfig(): Promise<LocaleTemplateMappingConfig> {
  try {
    const settingsRepo = new CrmSettingsRepository(prisma);

    const config =
      await settingsRepo.getSettingValue<LocaleTemplateMappingConfig>(
        CrmSettingKey.LOCALE_TEMPLATE_MAPPING
      );

    if (!config || typeof config !== "object") {
      logger.warn(
        "locale_template_mapping not found in crm_settings, using fallback defaults"
      );
      return {
        en: "en",
        fr: "fr",
        ar: "ar",
        default: "en",
      };
    }

    return config;
  } catch (error) {
    logger.error({ error }, "Error fetching locale_template_mapping");
    return {
      en: "en",
      fr: "fr",
      ar: "ar",
      default: "en",
    };
  }
}

/**
 * Map form locale to template locale using database configuration
 *
 * Handles locale variants (e.g., "en-US" → "en", "fr-FR" → "fr")
 * Falls back to default locale if mapping not found
 *
 * @param formLocale - User's form locale (e.g., "en", "fr", "es", "en-US")
 * @returns Template locale code (e.g., "en", "fr", "ar")
 *
 * @example
 * ```typescript
 * const templateLocale = await getTemplateLocale("fr");
 * // Returns: "fr"
 *
 * const templateLocale = await getTemplateLocale("es");
 * // Returns: "en" (fallback to English if Spanish templates don't exist)
 *
 * const templateLocale = await getTemplateLocale("en-US");
 * // Returns: "en" (strips region variant)
 * ```
 */
export async function getTemplateLocale(formLocale: string): Promise<string> {
  const config = await getLocaleMappingConfig();

  // Try exact match first (e.g., "en", "fr", "ar")
  if (config[formLocale]) {
    return config[formLocale];
  }

  // Try base locale without region (e.g., "en-US" → "en", "fr-FR" → "fr")
  const baseLocale = formLocale.split("-")[0];
  if (baseLocale && config[baseLocale]) {
    return config[baseLocale];
  }

  // Fallback to default
  return config.default || "en";
}
