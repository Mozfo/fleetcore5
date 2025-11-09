/**
 * CountryLocaleRepository
 * Repository for managing country-locale reference data (dir_country_locales)
 *
 * Pattern: Extends BaseRepository (has deleted_at for soft-delete)
 * Domain: DIR (Global reference data, no tenant_id)
 */

import {
  PrismaClient,
  dir_country_locales,
  lifecycle_status,
  Prisma as _Prisma,
} from "@prisma/client";
import { BaseRepository } from "@/lib/core/base.repository";
import type { SortFieldWhitelist } from "@/lib/core/validation";

/**
 * Whitelist of sortable fields for dir_country_locales table
 *
 * ✅ All columns safe (reference table, no PII)
 * - Primary key: id
 * - Business data: country_code, country_name, primary_locale
 * - Timestamps: created_at, updated_at
 * - Soft-delete: deleted_at (filtered automatically by BaseRepository)
 */
export const COUNTRY_LOCALE_SORT_FIELDS = [
  "id",
  "country_code",
  "country_name",
  "primary_locale",
  "fallback_locale",
  "timezone",
  "currency",
  "status",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Type alias from Prisma
 */
export type CountryLocale = dir_country_locales;

/**
 * CountryLocaleRepository
 *
 * Manages country-locale reference data with i18n settings:
 * - ISO 3166-1 alpha-2 country codes (FR, GB, DE, etc.)
 * - Primary and fallback locales (ISO 639-1)
 * - Timezone (IANA format)
 * - Currency (ISO 4217)
 * - Formatting preferences (date, time, numbers, currency)
 * - RTL support for Arabic countries
 *
 * Key Features:
 * - Soft-delete support (BaseRepository)
 * - PostgreSQL array queries (supported_locales)
 * - Lifecycle status filtering (active/inactive)
 *
 * @example
 * ```typescript
 * const repo = new CountryLocaleRepository();
 * const france = await repo.findByCountryCode('FR');
 * // france.primary_locale === 'fr'
 * // france.supported_locales === ['fr', 'en']
 * ```
 */
export class CountryLocaleRepository extends BaseRepository<dir_country_locales> {
  /**
   * Constructor with optional Prisma Client injection
   *
   * @param prismaClient - Optional PrismaClient instance for dependency injection
   *                       (useful for testing with mock or SQLite clients)
   *                       Defaults to singleton instance if not provided
   *
   * @example
   * ```typescript
   * // Production: Use singleton (default)
   * const repo = new CountryLocaleRepository()
   * ```
   *
   * @example
   * ```typescript
   * // Testing: Inject test client
   * const testPrisma = new PrismaClient({ datasources: { db: { url: 'file:test.db' } } })
   * const repo = new CountryLocaleRepository(testPrisma)
   * ```
   */
  constructor(prismaClient?: PrismaClient) {
    const prisma = prismaClient || new PrismaClient();
    super(prisma.dir_country_locales, prisma);
  }

  /**
   * Get whitelist of sortable fields
   * Required by BaseRepository abstract method
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return COUNTRY_LOCALE_SORT_FIELDS;
  }

  /**
   * Enable soft-delete filtering
   * dir_country_locales has deleted_at column
   */
  protected shouldFilterDeleted(): boolean {
    return true;
  }

  /**
   * Find country locale by ISO 3166-1 alpha-2 country code
   *
   * @param code - 2-letter country code (e.g., 'FR', 'GB', 'AE')
   * @returns Country locale or null if not found
   *
   * @example
   * ```typescript
   * const france = await repo.findByCountryCode('FR');
   * // france.primary_locale === 'fr'
   * // france.timezone === 'Europe/Paris'
   * // france.currency === 'EUR'
   * ```
   */
  async findByCountryCode(code: string): Promise<dir_country_locales | null> {
    return await this.model.findFirst({
      where: {
        country_code: code.toUpperCase(),
        deleted_at: null,
      },
    });
  }

  /**
   * Find all countries using a specific locale as primary
   *
   * @param locale - ISO 639-1 locale code (e.g., 'fr', 'en', 'ar')
   * @returns List of countries with this primary locale
   *
   * @example
   * ```typescript
   * const frenchCountries = await repo.findByPrimaryLocale('fr');
   * // Returns: France (FR), Belgium (BE), etc.
   * // frenchCountries.map(c => c.country_code) => ['FR', 'BE', ...]
   * ```
   */
  async findByPrimaryLocale(locale: string): Promise<dir_country_locales[]> {
    return await this.model.findMany({
      where: {
        primary_locale: locale.toLowerCase(),
        deleted_at: null,
      },
      orderBy: {
        country_name: "asc",
      },
    });
  }

  /**
   * Find all countries supporting a specific locale
   * Uses PostgreSQL array operator ANY() for performance with GIN index
   *
   * @param locale - ISO 639-1 locale code (e.g., 'en', 'fr', 'ar')
   * @returns List of countries supporting this locale
   *
   * @example
   * ```typescript
   * // Find all countries supporting English
   * const englishCountries = await repo.findBySupportedLocale('en');
   * // Returns: GB, US, AE, SA, etc. (countries with 'en' in supported_locales array)
   * // englishCountries.length >= 15
   * ```
   *
   * @example
   * ```typescript
   * // Find all countries supporting Arabic
   * const arabicCountries = await repo.findBySupportedLocale('ar');
   * // Returns: AE, SA, QA, OM, KW, BH, MA, EG, TN, DZ, LB, JO
   * ```
   */
  async findBySupportedLocale(locale: string): Promise<dir_country_locales[]> {
    // PostgreSQL: WHERE 'en' = ANY(supported_locales)
    // Uses GIN index idx_dir_country_locales_supported_locales for performance
    return await this.model.findMany({
      where: {
        supported_locales: {
          has: locale.toLowerCase(),
        },
        deleted_at: null,
      },
      orderBy: {
        country_name: "asc",
      },
    });
  }

  /**
   * Find all active countries
   * Filters by lifecycle_status = 'active'
   *
   * @returns List of active country locales
   *
   * @example
   * ```typescript
   * const activeCountries = await repo.findActive();
   * // activeCountries.every(c => c.status === 'active') === true
   * ```
   */
  async findActive(): Promise<dir_country_locales[]> {
    return await this.model.findMany({
      where: {
        status: "active" as lifecycle_status,
        deleted_at: null,
      },
      orderBy: {
        country_name: "asc",
      },
    });
  }

  /**
   * Find countries by timezone
   * Useful for scheduling notifications or cron jobs
   *
   * @param timezone - IANA timezone (e.g., 'Europe/Paris', 'Asia/Dubai')
   * @returns List of countries in this timezone
   *
   * @example
   * ```typescript
   * const gulfCountries = await repo.findByTimezone('Asia/Dubai');
   * // Returns: AE, OM (same timezone as Dubai)
   * ```
   */
  async findByTimezone(timezone: string): Promise<dir_country_locales[]> {
    return await this.model.findMany({
      where: {
        timezone,
        deleted_at: null,
      },
      orderBy: {
        country_name: "asc",
      },
    });
  }

  /**
   * Find RTL (Right-to-Left) enabled countries
   * Useful for UI rendering and template selection
   *
   * @returns List of RTL countries (typically Arabic countries)
   *
   * @example
   * ```typescript
   * const rtlCountries = await repo.findRTL();
   * // rtlCountries.map(c => c.country_code) =>
   * // ['AE', 'SA', 'QA', 'OM', 'KW', 'BH', 'MA', 'EG', 'TN', 'DZ', 'LB', 'JO']
   * ```
   */
  async findRTL(): Promise<dir_country_locales[]> {
    return await this.model.findMany({
      where: {
        rtl_enabled: true,
        deleted_at: null,
      },
      orderBy: {
        country_name: "asc",
      },
    });
  }

  /**
   * Check if a country code exists
   * Useful for validation before creating related entities
   *
   * @param code - 2-letter country code
   * @returns True if country exists and is not deleted
   *
   * @example
   * ```typescript
   * const exists = await repo.countryExists('FR');
   * if (!exists) {
   *   throw new Error('Invalid country code');
   * }
   * ```
   */
  async countryExists(code: string): Promise<boolean> {
    const count = await this.model.count({
      where: {
        country_code: code.toUpperCase(),
        deleted_at: null,
      },
    });
    return count > 0;
  }

  /**
   * Get all unique locales across all countries
   * Useful for building locale selector in UI
   *
   * @returns List of unique locale codes sorted alphabetically
   *
   * @example
   * ```typescript
   * const allLocales = await repo.getAllLocales();
   * // Returns: ['ar', 'de', 'en', 'es', 'fr', 'it', 'ur']
   * ```
   */
  async getAllLocales(): Promise<string[]> {
    const countries = await this.model.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        supported_locales: true,
      },
    });

    // Flatten and deduplicate
    const localesSet = new Set<string>();
    for (const country of countries) {
      for (const locale of country.supported_locales) {
        localesSet.add(locale);
      }
    }

    return Array.from(localesSet).sort();
  }
}
