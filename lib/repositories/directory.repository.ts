import {
  PrismaClient,
  dir_car_makes,
  dir_car_models,
  dir_country_regulations,
  dir_platforms,
  dir_vehicle_classes,
} from "@prisma/client";

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
      OR: [
        { tenant_id: null }, // Global makes
        { tenant_id: tenantId }, // Tenant-specific makes
      ],
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
        OR: [{ tenant_id: null }, { tenant_id: tenantId }],
      },
    });
  }

  /**
   * Check if a make with same name exists for tenant
   * @param name - Make name
   * @param tenantId - Tenant ID (can be null for global makes)
   * @returns True if duplicate exists
   */
  async makeNameExists(
    name: string,
    tenantId: string | null
  ): Promise<boolean> {
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
   * @param data - Make data
   * @param tenantId - Tenant ID (null for global makes, UUID for tenant-specific)
   * @returns Created car make
   */
  async createMake(
    data: { name: string },
    tenantId: string | null
  ): Promise<CarMake> {
    return await this.prisma.dir_car_makes.create({
      data: {
        name: data.name,
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
        OR: [
          { tenant_id: null }, // Global models
          { tenant_id: tenantId }, // Tenant-specific models
        ],
      },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Check if a model with same name exists for make + tenant
   * @param makeId - Make ID
   * @param name - Model name
   * @param tenantId - Tenant ID (can be null for global models)
   * @returns True if duplicate exists
   */
  async modelNameExists(
    makeId: string,
    name: string,
    tenantId: string | null
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
   * @param data - Model data
   * @param tenantId - Tenant ID (null for global models, UUID for tenant-specific)
   * @returns Created car model
   */
  async createModel(
    data: { make_id: string; name: string; vehicle_class_id?: string },
    tenantId: string | null
  ): Promise<CarModel> {
    return await this.prisma.dir_car_models.create({
      data: {
        make_id: data.make_id,
        name: data.name,
        vehicle_class_id: data.vehicle_class_id || null,
        tenant_id: tenantId,
      },
    });
  }

  // ========== PLATFORMS ==========

  /**
   * Find all platforms with optional search filter
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of platforms
   */
  async findPlatforms(
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<Platform[]> {
    const where: Record<string, unknown> = {};

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    return await this.prisma.dir_platforms.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * Check if a platform with same name exists
   * @param name - Platform name
   * @returns True if duplicate exists
   */
  async platformNameExists(name: string): Promise<boolean> {
    const existing = await this.prisma.dir_platforms.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
      },
    });
    return !!existing;
  }

  /**
   * Create a new platform
   * @param data - Platform data
   * @returns Created platform
   */
  async createPlatform(data: {
    name: string;
    api_config?: Record<string, unknown>;
  }): Promise<Platform> {
    return await this.prisma.dir_platforms.create({
      data: {
        name: data.name,
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
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of vehicle classes
   */
  async findVehicleClasses(
    countryCode?: string,
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<VehicleClass[]> {
    const where: Record<string, unknown> = {};

    if (countryCode) {
      where.country_code = countryCode;
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }

    return await this.prisma.dir_vehicle_classes.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });
  }

  /**
   * Check if a vehicle class with same country_code and name exists
   * @param countryCode - Country code
   * @param name - Vehicle class name
   * @returns True if duplicate exists
   */
  async vehicleClassExists(
    countryCode: string,
    name: string
  ): Promise<boolean> {
    const existing = await this.prisma.dir_vehicle_classes.findFirst({
      where: {
        country_code: countryCode,
        name: { equals: name, mode: "insensitive" },
      },
    });
    return !!existing;
  }

  /**
   * Create a new vehicle class
   * @param data - Vehicle class data
   * @returns Created vehicle class
   */
  async createVehicleClass(data: {
    country_code: string;
    name: string;
    description?: string;
    max_age?: number;
  }): Promise<VehicleClass> {
    return await this.prisma.dir_vehicle_classes.create({
      data: {
        country_code: data.country_code,
        name: data.name,
        description: data.description || null,
        max_age: data.max_age || null,
      },
    });
  }
}
