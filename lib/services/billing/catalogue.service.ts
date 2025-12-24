/**
 * Catalogue Service - Global Product Catalogue
 *
 * Provides access to billing catalogue (plans, addons, services)
 * with prices from bil_catalog_prices by country_code.
 *
 * ARCHITECTURE:
 * - Products (bil_plans, bil_addons, bil_services) are GLOBAL (no country_code)
 * - Prices are in bil_catalog_prices, keyed by (catalog_type, catalog_id, country_code)
 * - Names and descriptions are stored as JSONB translations
 * - This service joins products with prices and resolves translations by locale
 *
 * @module lib/services/billing/catalogue.service
 */

import { prisma } from "@/lib/prisma";
import { getTranslation, type SupportedLocale } from "@/lib/utils/i18n-db";
import type {
  CatalogueResult,
  CataloguePlan,
  CatalogueAddon,
  CatalogueService as CatalogueServiceType,
} from "@/lib/types/crm/lead.types";

/**
 * Options for catalogue queries
 */
interface CatalogueQueryOptions {
  /** ISO 2-letter country code for pricing (e.g., "FR", "AE") */
  countryCode: string;
  /** Locale for text translations (default: "en") */
  locale?: SupportedLocale;
}

/**
 * CatalogueService - Access to Global Product Catalogue
 *
 * Used by QuoteForm to populate item dropdowns.
 * Items are filtered by the Lead's country_code (inherited via Opportunity).
 * Text content is resolved based on the user's locale.
 */
export class CatalogueService {
  // ============================================
  // PLANS
  // ============================================

  /**
   * Get active plans with prices for a country
   *
   * Joins bil_plans with bil_catalog_prices.
   * Only returns plans that have a price defined for the country.
   * Resolves name and description to the requested locale.
   *
   * @param options - Query options (countryCode required, locale optional)
   * @returns Array of plans for the country with localized text
   */
  async getPlansByCountry(
    options: CatalogueQueryOptions
  ): Promise<CataloguePlan[]> {
    const { countryCode, locale = "en" } = options;
    const normalizedCountry = countryCode.toUpperCase();

    // Get prices for plans in this country
    const prices = await prisma.bil_catalog_prices.findMany({
      where: {
        catalog_type: "plan",
        country_code: normalizedCountry,
        is_active: true,
      },
    });

    if (prices.length === 0) return [];

    // Get plans that have prices
    const planIds = prices.map((p) => p.catalog_id);
    const plans = await prisma.bil_plans.findMany({
      where: {
        id: { in: planIds },
        is_active: true,
        deleted_at: null,
      },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        billing_interval: true,
        max_vehicles: true,
        max_drivers: true,
        features: true,
      },
    });

    // Create price lookup
    const priceMap = new Map(
      prices.map((p) => [
        p.catalog_id,
        { base_price: p.base_price, currency: p.currency },
      ])
    );

    return plans.map((plan) => {
      const price = priceMap.get(plan.id);
      return {
        id: plan.id,
        code: plan.code,
        name: getTranslation(
          plan.name_translations as Record<string, string>,
          locale
        ),
        description:
          getTranslation(
            plan.description_translations as Record<string, string>,
            locale
          ) || null,
        base_price: price ? Number(price.base_price) : 0,
        currency: price?.currency ?? "EUR",
        billing_interval: plan.billing_interval,
        max_vehicles: plan.max_vehicles,
        max_drivers: plan.max_drivers,
        features: plan.features,
      };
    });
  }

  // ============================================
  // ADDONS
  // ============================================

  /**
   * Get active addons with prices for a country
   *
   * @param options - Query options (countryCode required, locale optional)
   * @returns Array of addons for the country with localized text
   */
  async getAddonsByCountry(
    options: CatalogueQueryOptions
  ): Promise<CatalogueAddon[]> {
    const { countryCode, locale = "en" } = options;
    const normalizedCountry = countryCode.toUpperCase();

    // Get prices for addons in this country
    const prices = await prisma.bil_catalog_prices.findMany({
      where: {
        catalog_type: "addon",
        country_code: normalizedCountry,
        is_active: true,
      },
    });

    if (prices.length === 0) return [];

    // Get addons that have prices
    const addonIds = prices.map((p) => p.catalog_id);
    const addons = await prisma.bil_addons.findMany({
      where: {
        id: { in: addonIds },
        is_active: true,
        deleted_at: null,
      },
      orderBy: { category: "asc" },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        is_recurring: true,
        billing_interval: true,
        category: true,
      },
    });

    // Create price lookup
    const priceMap = new Map(
      prices.map((p) => [
        p.catalog_id,
        { price: p.base_price, currency: p.currency },
      ])
    );

    return addons.map((addon) => {
      const price = priceMap.get(addon.id);
      return {
        id: addon.id,
        code: addon.code,
        name: getTranslation(
          addon.name_translations as Record<string, string>,
          locale
        ),
        description:
          getTranslation(
            addon.description_translations as Record<string, string>,
            locale
          ) || null,
        price: price ? Number(price.price) : 0,
        currency: price?.currency ?? "EUR",
        is_recurring: addon.is_recurring,
        billing_interval: addon.billing_interval,
        category: addon.category,
      };
    });
  }

  // ============================================
  // SERVICES
  // ============================================

  /**
   * Get active services with prices for a country
   *
   * @param options - Query options (countryCode required, locale optional)
   * @returns Array of services for the country with localized text
   */
  async getServicesByCountry(
    options: CatalogueQueryOptions
  ): Promise<CatalogueServiceType[]> {
    const { countryCode, locale = "en" } = options;
    const normalizedCountry = countryCode.toUpperCase();

    // Get prices for services in this country
    const prices = await prisma.bil_catalog_prices.findMany({
      where: {
        catalog_type: "service",
        country_code: normalizedCountry,
        is_active: true,
      },
    });

    if (prices.length === 0) return [];

    // Get services that have prices
    const serviceIds = prices.map((p) => p.catalog_id);
    const services = await prisma.bil_services.findMany({
      where: {
        id: { in: serviceIds },
        is_active: true,
        deleted_at: null,
      },
      orderBy: { category: "asc" },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        service_type: true,
        hourly_rate: true,
        min_hours: true,
        category: true,
      },
    });

    // Create price lookup
    const priceMap = new Map(
      prices.map((p) => [
        p.catalog_id,
        { price: p.base_price, currency: p.currency },
      ])
    );

    return services.map((service) => {
      const price = priceMap.get(service.id);
      return {
        id: service.id,
        code: service.code,
        name: getTranslation(
          service.name_translations as Record<string, string>,
          locale
        ),
        description:
          getTranslation(
            service.description_translations as Record<string, string>,
            locale
          ) || null,
        price: price ? Number(price.price) : 0,
        currency: price?.currency ?? "EUR",
        service_type: service.service_type,
        hourly_rate: service.hourly_rate ? Number(service.hourly_rate) : null,
        min_hours: service.min_hours ? Number(service.min_hours) : null,
        category: service.category,
      };
    });
  }

  // ============================================
  // FULL CATALOGUE
  // ============================================

  /**
   * Get complete catalogue for a country
   *
   * Returns all plans, addons, and services in a single call.
   * Used by QuoteForm when an Opportunity is selected.
   *
   * @param options - Query options (countryCode required, locale optional)
   * @returns Complete catalogue (plans, addons, services) with localized text
   */
  async getFullCatalogue(
    options: CatalogueQueryOptions
  ): Promise<CatalogueResult> {
    const [plans, addons, services] = await Promise.all([
      this.getPlansByCountry(options),
      this.getAddonsByCountry(options),
      this.getServicesByCountry(options),
    ]);

    return { plans, addons, services };
  }

  // ============================================
  // LOOKUP METHODS (with country for price)
  // ============================================

  /**
   * Get a single plan by ID with price for a country
   *
   * @param planId - Plan UUID
   * @param options - Query options (countryCode optional for price, locale optional for text)
   * @returns Plan or null
   */
  async getPlanById(
    planId: string,
    options: Partial<CatalogueQueryOptions> = {}
  ): Promise<CataloguePlan | null> {
    const { countryCode, locale = "en" } = options;

    const plan = await prisma.bil_plans.findFirst({
      where: {
        id: planId,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        billing_interval: true,
        max_vehicles: true,
        max_drivers: true,
        features: true,
      },
    });

    if (!plan) return null;

    // Get price
    const priceWhere = countryCode
      ? {
          catalog_type: "plan",
          catalog_id: planId,
          country_code: countryCode.toUpperCase(),
          is_active: true,
        }
      : { catalog_type: "plan", catalog_id: planId, is_active: true };

    const price = await prisma.bil_catalog_prices.findFirst({
      where: priceWhere,
      orderBy: { country_code: "asc" }, // FR first if no country specified
    });

    return {
      id: plan.id,
      code: plan.code,
      name: getTranslation(
        plan.name_translations as Record<string, string>,
        locale
      ),
      description:
        getTranslation(
          plan.description_translations as Record<string, string>,
          locale
        ) || null,
      base_price: price ? Number(price.base_price) : 0,
      currency: price?.currency ?? "EUR",
      billing_interval: plan.billing_interval,
      max_vehicles: plan.max_vehicles,
      max_drivers: plan.max_drivers,
      features: plan.features,
    };
  }

  /**
   * Get a single addon by ID with price for a country
   *
   * @param addonId - Addon UUID
   * @param options - Query options (countryCode optional for price, locale optional for text)
   * @returns Addon or null
   */
  async getAddonById(
    addonId: string,
    options: Partial<CatalogueQueryOptions> = {}
  ): Promise<CatalogueAddon | null> {
    const { countryCode, locale = "en" } = options;

    const addon = await prisma.bil_addons.findFirst({
      where: {
        id: addonId,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        is_recurring: true,
        billing_interval: true,
        category: true,
      },
    });

    if (!addon) return null;

    // Get price
    const priceWhere = countryCode
      ? {
          catalog_type: "addon",
          catalog_id: addonId,
          country_code: countryCode.toUpperCase(),
          is_active: true,
        }
      : { catalog_type: "addon", catalog_id: addonId, is_active: true };

    const price = await prisma.bil_catalog_prices.findFirst({
      where: priceWhere,
      orderBy: { country_code: "asc" },
    });

    return {
      id: addon.id,
      code: addon.code,
      name: getTranslation(
        addon.name_translations as Record<string, string>,
        locale
      ),
      description:
        getTranslation(
          addon.description_translations as Record<string, string>,
          locale
        ) || null,
      price: price ? Number(price.base_price) : 0,
      currency: price?.currency ?? "EUR",
      is_recurring: addon.is_recurring,
      billing_interval: addon.billing_interval,
      category: addon.category,
    };
  }

  /**
   * Get a single service by ID with price for a country
   *
   * @param serviceId - Service UUID
   * @param options - Query options (countryCode optional for price, locale optional for text)
   * @returns Service or null
   */
  async getServiceById(
    serviceId: string,
    options: Partial<CatalogueQueryOptions> = {}
  ): Promise<CatalogueServiceType | null> {
    const { countryCode, locale = "en" } = options;

    const service = await prisma.bil_services.findFirst({
      where: {
        id: serviceId,
        is_active: true,
        deleted_at: null,
      },
      select: {
        id: true,
        code: true,
        name_translations: true,
        description_translations: true,
        service_type: true,
        hourly_rate: true,
        min_hours: true,
        category: true,
      },
    });

    if (!service) return null;

    // Get price
    const priceWhere = countryCode
      ? {
          catalog_type: "service",
          catalog_id: serviceId,
          country_code: countryCode.toUpperCase(),
          is_active: true,
        }
      : { catalog_type: "service", catalog_id: serviceId, is_active: true };

    const price = await prisma.bil_catalog_prices.findFirst({
      where: priceWhere,
      orderBy: { country_code: "asc" },
    });

    return {
      id: service.id,
      code: service.code,
      name: getTranslation(
        service.name_translations as Record<string, string>,
        locale
      ),
      description:
        getTranslation(
          service.description_translations as Record<string, string>,
          locale
        ) || null,
      price: price ? Number(price.base_price) : 0,
      currency: price?.currency ?? "EUR",
      service_type: service.service_type,
      hourly_rate: service.hourly_rate ? Number(service.hourly_rate) : null,
      min_hours: service.min_hours ? Number(service.min_hours) : null,
      category: service.category,
    };
  }

  // ============================================
  // PRICE LOOKUP (for negotiation validation)
  // ============================================

  /**
   * Get price constraints for a product
   *
   * Used to validate negotiated prices against min_price.
   *
   * @param catalogType - "plan" | "addon" | "service"
   * @param catalogId - Product UUID
   * @param countryCode - ISO 2-letter country code
   * @returns Price info or null
   */
  async getPriceConstraints(
    catalogType: "plan" | "addon" | "service",
    catalogId: string,
    countryCode: string
  ): Promise<{
    base_price: number;
    min_price: number | null;
    currency: string;
  } | null> {
    const price = await prisma.bil_catalog_prices.findFirst({
      where: {
        catalog_type: catalogType,
        catalog_id: catalogId,
        country_code: countryCode.toUpperCase(),
        is_active: true,
      },
    });

    if (!price) return null;

    return {
      base_price: Number(price.base_price),
      min_price: price.min_price ? Number(price.min_price) : null,
      currency: price.currency,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Default CatalogueService instance
 *
 * Usage:
 * ```typescript
 * import { catalogueService } from "@/lib/services/billing/catalogue.service";
 *
 * // Get catalogue with localized content
 * const catalogue = await catalogueService.getFullCatalogue({
 *   countryCode: "FR",
 *   locale: "fr"
 * });
 * // { plans: [...], addons: [...], services: [...] }
 *
 * // Get a single plan
 * const plan = await catalogueService.getPlanById("uuid", { locale: "fr" });
 * ```
 */
export const catalogueService = new CatalogueService();
