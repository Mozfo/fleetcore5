import {
  PrismaClient,
  dir_car_makes,
  dir_car_models,
  dir_country_regulations,
  dir_platforms,
  dir_vehicle_classes,
} from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";

/**
 * Whitelist of sortable fields for dir_car_makes table
 *
 * ✅ All columns safe (reference table, no PII/soft-delete)
 * - System IDs: id, tenant_id (multi-tenant support)
 * - Business data: name (make name like "Toyota", "BMW")
 * - Timestamps: created_at, updated_at
 */
export const CAR_MAKES_SORT_FIELDS = [
  "id",
  "tenant_id",
  "name",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Whitelist of sortable fields for dir_car_models table
 *
 * ✅ All columns safe (reference table, no PII/soft-delete)
 * - System IDs: id, tenant_id (multi-tenant support)
 * - Relations: make_id, vehicle_class_id (FK)
 * - Business data: name (model name like "Corolla", "X5")
 * - Timestamps: created_at, updated_at
 */
export const CAR_MODELS_SORT_FIELDS = [
  "id",
  "tenant_id",
  "make_id",
  "name",
  "vehicle_class_id",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Whitelist of sortable fields for dir_country_regulations table
 *
 * ✅ All columns safe (regulatory reference data)
 * - Primary key: country_code (ISO 3166-1 alpha-2)
 * - Regulatory constraints: vehicle_max_age, min_vehicle_class, requires_vtc_card
 * - Pricing: min_fare_per_trip, min_fare_per_km, min_fare_per_hour, vat_rate
 * - Localization: currency (ISO 4217), timezone (IANA)
 * - Timestamps: created_at, updated_at
 */
export const COUNTRY_REGULATIONS_SORT_FIELDS = [
  "country_code",
  "currency",
  "timezone",
  "vehicle_max_age",
  "min_vehicle_class",
  "min_fare_per_trip",
  "min_fare_per_km",
  "min_fare_per_hour",
  "vat_rate",
  "requires_vtc_card",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Whitelist of sortable fields for dir_platforms table
 *
 * ✅ Included columns:
 * - System ID: id
 * - Business data: code (platform code like "uber", "bolt", "careem")
 * - Timestamps: created_at, updated_at
 *
 * ❌ Excluded columns:
 * - api_config: JSONB containing API keys/secrets (SECURITY RISK)
 * - name_translations: JSONB (not directly sortable)
 */
export const PLATFORMS_SORT_FIELDS = [
  "id",
  "code",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Whitelist of sortable fields for dir_vehicle_classes table
 *
 * ✅ Included columns:
 * - System ID: id
 * - Localization: country_code (ISO 3166-1 alpha-2)
 * - Business data: code (class code like "economy", "premium", "luxury")
 * - Metadata: max_age (vehicle age limit for this class)
 * - Timestamps: created_at, updated_at
 *
 * ❌ Excluded columns:
 * - name_translations: JSONB (not directly sortable)
 * - description_translations: JSONB (not directly sortable)
 */
export const VEHICLE_CLASSES_SORT_FIELDS = [
  "id",
  "country_code",
  "code",
  "max_age",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Type aliases from Prisma
 */
export type CarMake = dir_car_makes;
export type CarModel = dir_car_models;
export type CountryRegulation = dir_country_regulations;
export type Platform = dir_platforms;
export type VehicleClass = dir_vehicle_classes;

/**
 * DirectoryRepository
 * Repository for managing directory data (countries, makes, models)
 *
 * NOTE: Directory tables do NOT have soft-delete (deleted_at) in current schema
 * Therefore, we do NOT extend BaseRepository
 */
export class DirectoryRepository {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // ========== COUNTRIES ==========

  /**
   * Find all countries with optional search filter
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of country regulations
   */
  async findCountries(
    sortBy: "country_code" | "currency" | "timezone" = "country_code",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<CountryRegulation[]> {
    return await this.prisma.dir_country_regulations.findMany({
      orderBy: { [sortBy]: sortOrder },
    });
  }

  // ========== CAR MAKES ==========

  /**
   * Find car makes accessible by tenant (global + tenant-specific)
   * @param tenantId - Tenant ID for filtering
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of car makes
   */
  async findMakes(
    tenantId: string,
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<CarMake[]> {
    const where: Record<string, unknown> = {
      tenant_id: tenantId, // V2: tenant_id is now NOT NULL
    };

    if (search) {
      where.AND = {
        name: { contains: search, mode: "insensitive" },
      };
    }

    return await this.prisma.dir_car_makes.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * Find a car make by ID accessible by tenant
   * @param id - Make ID
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @returns Car make or null
   */
  async findMakeById(id: string, tenantId: string): Promise<CarMake | null> {
    return await this.prisma.dir_car_makes.findFirst({
      where: {
        id,
        tenant_id: tenantId, // V2: tenant_id is now NOT NULL
      },
    });
  }

  /**
   * Check if a make with same name exists for tenant
   * @param name - Make name
   * @param tenantId - Tenant ID (V2: now required, tenant_id is NOT NULL)
   * @returns True if duplicate exists
   */
  async makeNameExists(name: string, tenantId: string): Promise<boolean> {
    const existing = await this.prisma.dir_car_makes.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        tenant_id: tenantId,
      },
    });
    return !!existing;
  }

  /**
   * Create a new car make
   * @param data - Make data (V2: code is now required)
   * @param tenantId - Tenant ID (V2: now required, tenant_id is NOT NULL)
   * @returns Created car make
   */
  async createMake(
    data: { name: string; code: string },
    tenantId: string
  ): Promise<CarMake> {
    return await this.prisma.dir_car_makes.create({
      data: {
        name: data.name,
        code: data.code,
        tenant_id: tenantId,
      },
    });
  }

  // ========== CAR MODELS ==========

  /**
   * Find models by make ID accessible by tenant
   * @param makeId - Make ID
   * @param tenantId - Tenant ID for filtering
   * @returns List of car models
   */
  async findModelsByMake(
    makeId: string,
    tenantId: string
  ): Promise<CarModel[]> {
    return await this.prisma.dir_car_models.findMany({
      where: {
        make_id: makeId,
        tenant_id: tenantId, // V2: tenant_id is now NOT NULL
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Check if a model with same name exists for make + tenant
   * @param makeId - Make ID
   * @param name - Model name
   * @param tenantId - Tenant ID (V2: now required, tenant_id is NOT NULL)
   * @returns True if duplicate exists
   */
  async modelNameExists(
    makeId: string,
    name: string,
    tenantId: string
  ): Promise<boolean> {
    const existing = await this.prisma.dir_car_models.findFirst({
      where: {
        make_id: makeId,
        name: { equals: name, mode: "insensitive" },
        tenant_id: tenantId,
      },
    });
    return !!existing;
  }

  /**
   * Create a new car model
   * @param data - Model data (V2: code is now required)
   * @param tenantId - Tenant ID (V2: now required, tenant_id is NOT NULL)
   * @returns Created car model
   */
  async createModel(
    data: {
      make_id: string;
      name: string;
      code: string;
      vehicle_class_id?: string;
    },
    tenantId: string
  ): Promise<CarModel> {
    return await this.prisma.dir_car_models.create({
      data: {
        make_id: data.make_id,
        name: data.name,
        code: data.code,
        vehicle_class_id: data.vehicle_class_id || null,
        tenant_id: tenantId,
      },
    });
  }

  // ========== PLATFORMS ==========

  /**
   * Find all platforms with optional search filter
   * @param search - Optional search term (searches in code)
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of platforms
   */
  async findPlatforms(
    search?: string,
    sortBy: "code" | "created_at" = "code",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<Platform[]> {
    const where: Record<string, unknown> = {};

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    return await this.prisma.dir_platforms.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * Check if a platform with same code exists
   * @param code - Platform code
   * @returns True if duplicate exists
   */
  async platformCodeExists(code: string): Promise<boolean> {
    const existing = await this.prisma.dir_platforms.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
      },
    });
    return !!existing;
  }

  /**
   * Create a new platform
   * @param data - Platform data with JSONB translations
   * @returns Created platform
   */
  async createPlatform(data: {
    code: string;
    name_translations: Record<string, string>;
    description_translations?: Record<string, string>;
    api_config?: Record<string, unknown>;
  }): Promise<Platform> {
    return await this.prisma.dir_platforms.create({
      data: {
        code: data.code,
        name_translations: data.name_translations,
        description_translations: data.description_translations,
        api_config: data.api_config ? (data.api_config as never) : undefined,
      },
    });
  }

  // ========== REGULATIONS ==========

  /**
   * Find country regulations with optional country filter
   * @param countryCode - Optional country code filter
   * @returns List of country regulations
   */
  async findRegulations(countryCode?: string): Promise<CountryRegulation[]> {
    const where: Record<string, unknown> = {};

    if (countryCode) {
      where.country_code = countryCode;
    }

    return await this.prisma.dir_country_regulations.findMany({
      where,
      orderBy: { country_code: "asc" },
    });
  }

  // ========== VEHICLE CLASSES ==========

  /**
   * Find vehicle classes with optional filters
   * @param countryCode - Optional country code filter
   * @param search - Optional search term (searches in code)
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of vehicle classes
   */
  async findVehicleClasses(
    countryCode?: string,
    search?: string,
    sortBy: "code" | "created_at" = "code",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<VehicleClass[]> {
    const where: Record<string, unknown> = {};

    if (countryCode) {
      where.country_code = countryCode;
    }

    if (search) {
      where.code = { contains: search, mode: "insensitive" };
    }

    return await this.prisma.dir_vehicle_classes.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * Check if a vehicle class with same country_code and code exists
   * @param countryCode - Country code
   * @param code - Vehicle class code
   * @returns True if duplicate exists
   */
  async vehicleClassExists(
    countryCode: string,
    code: string
  ): Promise<boolean> {
    const existing = await this.prisma.dir_vehicle_classes.findFirst({
      where: {
        country_code: countryCode,
        code: { equals: code, mode: "insensitive" },
      },
    });
    return !!existing;
  }

  /**
   * Create a new vehicle class
   * @param data - Vehicle class data with JSONB translations
   * @returns Created vehicle class
   */
  async createVehicleClass(data: {
    country_code: string;
    code: string;
    name_translations: Record<string, string>;
    description_translations?: Record<string, string>;
    max_age?: number;
  }): Promise<VehicleClass> {
    return await this.prisma.dir_vehicle_classes.create({
      data: {
        country_code: data.country_code,
        code: data.code,
        name_translations: data.name_translations,
        description_translations: data.description_translations ?? {},
        max_age: data.max_age || null,
      },
    });
  }
}
