/**
 * Country Service - CRM Country Management
 *
 * This service provides country-related business logic including:
 * 1. GDPR compliance checks (EU/EEA countries requiring consent)
 * 2. Operational status checks (FleetCore availability in country)
 * 3. Country details retrieval (metadata for emails, forms, etc.)
 *
 * Key Concepts:
 * - country_gdpr: Whether country requires GDPR consent (27 EU + 3 EEA = 30 countries)
 * - is_operational: Whether FleetCore is active in country (determines email template)
 *
 * Email Routing Logic:
 * - is_operational=true → "Welcome to FleetCore" email
 * - is_operational=false → "We're coming soon to your country" email
 *
 * @module lib/services/crm/country.service
 */

import { CountryRepository } from "@/lib/repositories/crm/country.repository";
import { NotFoundError } from "@/lib/core/errors";
import { prisma } from "@/lib/prisma";
import type { crm_countries } from "@prisma/client";

// ===== TYPES & INTERFACES =====

/**
 * Country details type (complete record)
 */
export type CountryDetails = crm_countries;

/**
 * Simplified country info for public API responses
 */
export interface CountryInfo {
  country_code: string;
  country_name_en: string;
  country_name_fr: string;
  country_name_ar: string;
  flag_emoji: string;
  is_operational: boolean;
  country_gdpr: boolean;
  notification_locale: string;
  country_preposition_en?: string;
  country_preposition_fr?: string;
}

// ===== SERVICE CLASS =====

/**
 * Country Service
 *
 * Provides country-related business logic with database-driven configuration.
 * Zero hardcoding - all country rules stored in crm_countries table.
 *
 * @example
 * ```typescript
 * const countryService = new CountryService();
 *
 * // Check GDPR requirement
 * const needsGdpr = await countryService.isGdprCountry('FR'); // true
 *
 * // Check operational status
 * const isActive = await countryService.isOperational('AE'); // true
 *
 * // Get full details
 * const france = await countryService.getCountryDetails('FR');
 * ```
 */
export class CountryService {
  private countryRepository: CountryRepository;
  private gdprCache: Map<string, boolean> = new Map();
  private operationalCache: Map<string, boolean> = new Map();
  private cacheExpiry: number = 1000 * 60 * 60; // 1 hour

  constructor() {
    this.countryRepository = new CountryRepository(prisma);
  }

  /**
   * Check if country requires GDPR consent (EU/EEA countries)
   *
   * Returns false for unknown countries (safe default - no blocking).
   * Uses in-memory cache to reduce DB queries (1h TTL).
   *
   * @param countryCode - 2-letter country code (e.g., 'FR', 'AE')
   * @returns true if GDPR required, false otherwise
   *
   * @example
   * ```typescript
   * await countryService.isGdprCountry('FR'); // true (France = EU)
   * await countryService.isGdprCountry('NO'); // true (Norway = EEA)
   * await countryService.isGdprCountry('AE'); // false (UAE)
   * await countryService.isGdprCountry('XX'); // false (unknown = safe default)
   * ```
   */
  async isGdprCountry(countryCode: string): Promise<boolean> {
    const key = countryCode.toUpperCase();

    // Check cache first
    if (this.gdprCache.has(key)) {
      const cachedValue = this.gdprCache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }

    // Query database
    const isGdpr = await this.countryRepository.isGdprCountry(key);

    // Cache result
    this.gdprCache.set(key, isGdpr);

    // Clear cache after expiry
    setTimeout(() => {
      this.gdprCache.delete(key);
    }, this.cacheExpiry);

    return isGdpr;
  }

  /**
   * Check if FleetCore is operational in country
   *
   * Determines email template routing:
   * - true → "Welcome to FleetCore" email (lead_confirmation template)
   * - false → "We're coming soon" email (expansion_opportunity template)
   *
   * Returns false for unknown countries (expansion opportunity).
   * Uses in-memory cache to reduce DB queries (1h TTL).
   *
   * @param countryCode - 2-letter country code
   * @returns true if operational, false otherwise
   *
   * @example
   * ```typescript
   * await countryService.isOperational('AE'); // true (UAE active)
   * await countryService.isOperational('FR'); // true (France active)
   * await countryService.isOperational('BR'); // false (Brazil expansion)
   * ```
   */
  async isOperational(countryCode: string): Promise<boolean> {
    const key = countryCode.toUpperCase();

    // Check cache first
    if (this.operationalCache.has(key)) {
      const cachedValue = this.operationalCache.get(key);
      if (cachedValue !== undefined) {
        return cachedValue;
      }
    }

    // Query database
    const isOp = await this.countryRepository.isOperationalCountry(key);

    // Cache result
    this.operationalCache.set(key, isOp);

    // Clear cache after expiry
    setTimeout(() => {
      this.operationalCache.delete(key);
    }, this.cacheExpiry);

    return isOp;
  }

  /**
   * Get full country details
   *
   * Returns complete country record from database.
   * Throws NotFoundError if country not found.
   *
   * @param countryCode - 2-letter country code
   * @returns Complete country details
   * @throws {NotFoundError} If country not found in database
   *
   * @example
   * ```typescript
   * const france = await countryService.getCountryDetails('FR');
   * // {
   * //   country_code: 'FR',
   * //   country_name_en: 'France',
   * //   country_gdpr: true,
   * //   is_operational: true,
   * //   notification_locale: 'fr',
   * //   ...
   * // }
   * ```
   */
  async getCountryDetails(countryCode: string): Promise<CountryDetails> {
    const country = await this.countryRepository.findByCode(countryCode);

    if (!country) {
      throw new NotFoundError(
        `Country with code '${countryCode}' not found in database`
      );
    }

    return country;
  }

  /**
   * Get simplified country info (public API safe)
   *
   * Returns subset of country data suitable for public API responses.
   * Excludes internal fields (id, created_at, updated_at, etc.).
   *
   * @param countryCode - 2-letter country code
   * @returns Simplified country info
   * @throws {NotFoundError} If country not found
   *
   * @example
   * ```typescript
   * const info = await countryService.getCountryInfo('FR');
   * // { country_code: 'FR', country_name_en: 'France', flag_emoji: '🇫🇷', ... }
   * ```
   */
  async getCountryInfo(countryCode: string): Promise<CountryInfo> {
    const country = await this.getCountryDetails(countryCode);

    return {
      country_code: country.country_code,
      country_name_en: country.country_name_en,
      country_name_fr: country.country_name_fr,
      country_name_ar: country.country_name_ar,
      flag_emoji: country.flag_emoji,
      is_operational: country.is_operational,
      country_gdpr: country.country_gdpr,
      notification_locale: country.notification_locale,
      country_preposition_en: country.country_preposition_en || undefined,
      country_preposition_fr: country.country_preposition_fr || undefined,
    };
  }

  /**
   * Get all visible countries (for public forms)
   *
   * Returns countries marked as visible, sorted by display_order.
   * Used for dropdown lists in public forms.
   *
   * @returns Array of visible countries
   *
   * @example
   * ```typescript
   * const countries = await countryService.getAllVisibleCountries();
   * // [{ country_code: 'AE', ... }, { country_code: 'FR', ... }, ...]
   * ```
   */
  async getAllVisibleCountries(): Promise<CountryDetails[]> {
    return this.countryRepository.findAllVisible();
  }

  /**
   * Clear all caches
   *
   * Useful for testing or after bulk country updates.
   */
  clearCache(): void {
    this.gdprCache.clear();
    this.operationalCache.clear();
  }
}
