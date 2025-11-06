import { BaseService } from "@/lib/core/base.service";
import { DirectoryRepository } from "@/lib/repositories/directory.repository";
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from "@/lib/core/errors";
import type {
  CarMake,
  CarModel,
  CountryRegulation,
  Platform,
  VehicleClass,
} from "@/lib/repositories/directory.repository";

/**
 * DirectoryService
 * Business logic for directory management (countries, makes, models)
 */
export class DirectoryService extends BaseService {
  private directoryRepo: DirectoryRepository;

  constructor() {
    super();
    this.directoryRepo = new DirectoryRepository(this.prisma);
  }

  // ========== COUNTRIES ==========

  /**
   * List all countries
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of country regulations
   */
  async listCountries(
    sortBy: "country_code" | "currency" | "timezone" = "country_code",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<CountryRegulation[]> {
    try {
      return await this.directoryRepo.findCountries(sortBy, sortOrder);
    } catch (error) {
      this.handleError(error, "DirectoryService.listCountries");
    }
  }

  // ========== CAR MAKES ==========

  /**
   * List car makes accessible by tenant (global + tenant-specific)
   * @param tenantId - Tenant ID
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of car makes
   */
  async listMakes(
    tenantId: string,
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<CarMake[]> {
    try {
      return await this.directoryRepo.findMakes(
        tenantId,
        search,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this.handleError(error, "DirectoryService.listMakes");
    }
  }

  /**
   * Get a car make by ID
   * @param id - Make ID
   * @param tenantId - Tenant ID
   * @returns Car make
   * @throws NotFoundError if make not found
   */
  async getMakeById(id: string, tenantId: string): Promise<CarMake> {
    try {
      const make = await this.directoryRepo.findMakeById(id, tenantId);

      if (!make) {
        throw new NotFoundError("Car make not found");
      }

      return make;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.getMakeById");
    }
  }

  /**
   * Create a new car make
   * @param data - Make data
   * @param tenantId - Tenant ID (null for global makes, UUID for tenant-specific)
   * @returns Created car make
   * @throws ValidationError if duplicate name exists
   */
  async createMake(
    data: { name: string; code: string },
    tenantId: string
  ): Promise<CarMake> {
    try {
      // Check for duplicate name
      const exists = await this.directoryRepo.makeNameExists(
        data.name,
        tenantId
      );
      if (exists) {
        const scope = tenantId ? "your organization" : "globally";
        throw new ConflictError(
          `Car make "${data.name}" already exists ${scope}`
        );
      }

      // Create make
      return await this.directoryRepo.createMake(data, tenantId);
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.createMake");
    }
  }

  // ========== CAR MODELS ==========

  /**
   * List models for a specific car make
   * @param makeId - Make ID
   * @param tenantId - Tenant ID
   * @returns List of car models
   * @throws NotFoundError if make not found
   */
  async listModelsByMake(
    makeId: string,
    tenantId: string
  ): Promise<CarModel[]> {
    try {
      // Verify make exists
      const make = await this.directoryRepo.findMakeById(makeId, tenantId);
      if (!make) {
        throw new NotFoundError("Car make not found");
      }

      // Get models
      return await this.directoryRepo.findModelsByMake(makeId, tenantId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.listModelsByMake");
    }
  }

  /**
   * Create a new car model
   * @param data - Model data
   * @param tenantId - Tenant ID (null for global models, UUID for tenant-specific)
   * @returns Created car model
   * @throws NotFoundError if make not found
   * @throws ValidationError if duplicate name exists
   */
  async createModel(
    data: { make_id: string; name: string; code: string; vehicle_class_id?: string },
    tenantId: string,
    checkTenantId: string
  ): Promise<CarModel> {
    try {
      // Verify make exists (check with tenant access)
      const make = await this.directoryRepo.findMakeById(
        data.make_id,
        checkTenantId
      );
      if (!make) {
        throw new NotFoundError("Car make not found");
      }

      // Check for duplicate model name
      const exists = await this.directoryRepo.modelNameExists(
        data.make_id,
        data.name,
        tenantId
      );
      if (exists) {
        const scope = tenantId ? "your organization" : "globally";
        throw new ValidationError(
          `Car model "${data.name}" already exists for this make ${scope}`
        );
      }

      // Create model
      return await this.directoryRepo.createModel(data, tenantId);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.createModel");
    }
  }

  // ========== PLATFORMS ==========

  /**
   * List all platforms with optional search filter
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of platforms
   */
  async listPlatforms(
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<Platform[]> {
    try {
      return await this.directoryRepo.findPlatforms(search, sortBy, sortOrder);
    } catch (error) {
      this.handleError(error, "DirectoryService.listPlatforms");
    }
  }

  /**
   * Create a new platform
   * @param data - Platform data (V2: code is now required)
   * @returns Created platform
   * @throws ValidationError if duplicate name exists
   */
  async createPlatform(data: {
    name: string;
    code: string;
    api_config?: Record<string, unknown>;
  }): Promise<Platform> {
    try {
      // Check for duplicate name
      const exists = await this.directoryRepo.platformNameExists(data.name);
      if (exists) {
        throw new ValidationError(`Platform "${data.name}" already exists`);
      }

      // Create platform
      return await this.directoryRepo.createPlatform(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.createPlatform");
    }
  }

  // ========== REGULATIONS ==========

  /**
   * List country regulations with optional country filter
   * @param countryCode - Optional country code filter
   * @returns List of country regulations
   */
  async listRegulations(countryCode?: string): Promise<CountryRegulation[]> {
    try {
      return await this.directoryRepo.findRegulations(countryCode);
    } catch (error) {
      this.handleError(error, "DirectoryService.listRegulations");
    }
  }

  // ========== VEHICLE CLASSES ==========

  /**
   * List vehicle classes with optional filters
   * @param countryCode - Optional country code filter
   * @param search - Optional search term
   * @param sortBy - Field to sort by
   * @param sortOrder - Sort direction
   * @returns List of vehicle classes
   */
  async listVehicleClasses(
    countryCode?: string,
    search?: string,
    sortBy: "name" | "created_at" = "name",
    sortOrder: "asc" | "desc" = "asc"
  ): Promise<VehicleClass[]> {
    try {
      return await this.directoryRepo.findVehicleClasses(
        countryCode,
        search,
        sortBy,
        sortOrder
      );
    } catch (error) {
      this.handleError(error, "DirectoryService.listVehicleClasses");
    }
  }

  /**
   * Create a new vehicle class
   * @param data - Vehicle class data
   * @returns Created vehicle class
   * @throws ValidationError if duplicate country_code + name exists
   */
  async createVehicleClass(data: {
    country_code: string;
    name: string;
    code: string;
    description?: string;
    max_age?: number;
  }): Promise<VehicleClass> {
    try {
      // Check for duplicate (country_code, name)
      const exists = await this.directoryRepo.vehicleClassExists(
        data.country_code,
        data.name
      );
      if (exists) {
        throw new ValidationError(
          `Vehicle class "${data.name}" already exists for country ${data.country_code}`
        );
      }

      // Create vehicle class
      return await this.directoryRepo.createVehicleClass(data);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this.handleError(error, "DirectoryService.createVehicleClass");
    }
  }
}
