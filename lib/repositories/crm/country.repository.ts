import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient, crm_countries } from "@prisma/client";

/**
 * Base Country type from Prisma
 */
export type Country = crm_countries;

/**
 * Repository for managing CRM countries
 *
 * NOTE: crm_countries is a SYSTEM table (no provider_id, no is_system).
 * All countries are globally visible to all users.
 * No multi-tenant filtering is applied.
 *
 * Provides database access layer for country data including:
 * - GDPR compliance checks (EU/EEA countries)
 * - Operational status (FleetCore availability)
 * - Country metadata (names, locales, prepositions)
 *
 * @example
 * ```typescript
 * const country = await countryRepository.findByCode('FR');
 * const isGdpr = await countryRepository.isGdprCountry('FR'); // true
 * const isOp = await countryRepository.isOperationalCountry('AE'); // true
 * ```
 */
export class CountryRepository extends BaseRepository<crm_countries> {
  constructor(prisma: PrismaClient = new PrismaClient()) {
    super(prisma.crm_countries, prisma);
  }

  protected getModelName(): "crm_countries" {
    return "crm_countries";
  }

  protected getSortWhitelist() {
    return ["country_code", "country_name_en", "display_order"] as const;
  }

  /**
   * Find country by country code (ISO 3166-1 alpha-2)
   *
   * @param countryCode - 2-letter country code (e.g., 'FR', 'AE', 'US')
   * @returns Country details or null if not found
   *
   * @example
   * ```typescript
   * const france = await countryRepository.findByCode('FR');
   * // { country_code: 'FR', country_name_en: 'France', country_gdpr: true, ... }
   * ```
   */
  async findByCode(countryCode: string): Promise<crm_countries | null> {
    return this.prisma.crm_countries.findFirst({
      where: {
        country_code: countryCode.toUpperCase(),
      },
    });
  }

  /**
   * Check if country requires GDPR consent (EU/EEA countries)
   *
   * Returns false for unknown countries (safe default - no blocking)
   *
   * @param countryCode - 2-letter country code
   * @returns true if GDPR required, false otherwise
   *
   * @example
   * ```typescript
   * await countryRepository.isGdprCountry('FR'); // true (France = EU)
   * await countryRepository.isGdprCountry('NO'); // true (Norway = EEA)
   * await countryRepository.isGdprCountry('AE'); // false (UAE)
   * await countryRepository.isGdprCountry('XX'); // false (unknown = safe default)
   * ```
   */
  async isGdprCountry(countryCode: string): Promise<boolean> {
    try {
      const country = await this.prisma.crm_countries.findFirst({
        where: {
          country_code: countryCode.toUpperCase(),
          is_visible: true,
        },
        select: {
          country_gdpr: true,
        },
      });

      return country?.country_gdpr ?? false;
    } catch (_error) {
      // Safe default: if error, assume no GDPR required (no blocking)
      return false;
    }
  }

  /**
   * Check if FleetCore is operational in country
   *
   * Determines email template routing:
   * - true → "Welcome to FleetCore" email
   * - false → "We're coming soon to your country" email
   *
   * Returns false for unknown countries (expansion opportunity)
   *
   * @param countryCode - 2-letter country code
   * @returns true if operational, false otherwise
   *
   * @example
   * ```typescript
   * await countryRepository.isOperationalCountry('AE'); // true (UAE active)
   * await countryRepository.isOperationalCountry('FR'); // true (France active)
   * await countryRepository.isOperationalCountry('BR'); // false (Brazil expansion)
   * await countryRepository.isOperationalCountry('XX'); // false (unknown)
   * ```
   */
  async isOperationalCountry(countryCode: string): Promise<boolean> {
    try {
      const country = await this.prisma.crm_countries.findFirst({
        where: {
          country_code: countryCode.toUpperCase(),
        },
        select: {
          is_operational: true,
        },
      });

      return country?.is_operational ?? false;
    } catch (_error) {
      // Safe default: if error, assume not operational (expansion)
      return false;
    }
  }

  /**
   * Find all visible countries (for public forms)
   *
   * Sorted by display_order for strategic market prioritization
   *
   * @returns Array of visible countries
   *
   * @example
   * ```typescript
   * const countries = await countryRepository.findAllVisible();
   * // [{ country_code: 'AE', ... }, { country_code: 'FR', ... }, ...]
   * ```
   */
  async findAllVisible(): Promise<crm_countries[]> {
    return this.prisma.crm_countries.findMany({
      where: {
        is_visible: true,
      },
      orderBy: {
        display_order: "asc",
      },
    });
  }

  /**
   * Count GDPR countries in database
   *
   * Useful for validation after SQL updates (should return 30)
   *
   * @returns Number of countries with country_gdpr = true
   *
   * @example
   * ```typescript
   * const count = await countryRepository.countGdprCountries();
   * // 30 (27 EU + 3 EEA)
   * ```
   */
  async countGdprCountries(): Promise<number> {
    return this.prisma.crm_countries.count({
      where: {
        country_gdpr: true,
      },
    });
  }

  /**
   * Get notification locale for a country (V6.2-8.5)
   *
   * Used for email template language selection.
   * Returns locale from crm_countries.notification_locale column.
   *
   * Mapping:
   * - FR → 'fr' (French)
   * - AE → 'en' (UAE = B2B anglophone)
   * - SA → 'ar' (Saudi Arabia = Arabic)
   * - Others → 'en' (fallback)
   *
   * @param countryCode - ISO 3166-1 alpha-2 (e.g., 'FR', 'AE')
   * @returns Locale code ('en', 'fr', 'ar') - defaults to 'en'
   *
   * @example
   * ```typescript
   * await countryRepository.getNotificationLocale('FR'); // 'fr'
   * await countryRepository.getNotificationLocale('AE'); // 'en'
   * await countryRepository.getNotificationLocale('SA'); // 'ar'
   * await countryRepository.getNotificationLocale('XX'); // 'en' (fallback)
   * ```
   */
  async getNotificationLocale(
    countryCode: string
  ): Promise<"en" | "fr" | "ar"> {
    try {
      const country = await this.prisma.crm_countries.findFirst({
        where: {
          country_code: countryCode.toUpperCase(),
        },
        select: {
          notification_locale: true,
        },
      });

      const locale = country?.notification_locale || "en";

      // Validate it's a supported EmailLocale
      if (locale === "fr" || locale === "ar") {
        return locale;
      }

      return "en";
    } catch (_error) {
      // Safe default: English
      return "en";
    }
  }
}
