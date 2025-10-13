import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient } from "@prisma/client";
import {
  Vehicle,
  VehicleWithRelations,
} from "@/lib/services/vehicles/vehicle.types";

export class VehicleRepository extends BaseRepository<Vehicle> {
  constructor(prisma: PrismaClient) {
    super(prisma.flt_vehicles, prisma);
  }

  /**
   * Find a vehicle with all its relations
   */
  async findWithRelations(
    id: string,
    tenantId: string
  ): Promise<VehicleWithRelations | null> {
    return await this.model.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        dir_car_makes: true,
        dir_car_models: true,
        flt_vehicle_assignments: {
          where: { deleted_at: null },
          orderBy: { start_date: "desc" },
          take: 1,
          include: {
            rid_drivers: true,
          },
        },
        flt_vehicle_maintenance: {
          where: {
            status: { in: ["scheduled", "in_progress"] },
          },
          orderBy: { scheduled_date: "asc" },
        },
        flt_vehicle_insurances: {
          where: {
            is_active: true,
            deleted_at: null,
          },
        },
      },
    });
  }

  /**
   * Find all available vehicles (not currently assigned)
   */
  async findAvailableVehicles(tenantId: string): Promise<Vehicle[]> {
    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        status: "active",
        deleted_at: null,
        flt_vehicle_assignments: {
          none: {
            end_date: null,
            deleted_at: null,
          },
        },
      },
    });
  }

  /**
   * Find vehicles requiring maintenance
   */
  async findVehiclesRequiringMaintenance(tenantId: string): Promise<Vehicle[]> {
    const today = new Date();

    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        OR: [
          {
            next_inspection: {
              lte: today,
            },
          },
          {
            flt_vehicle_maintenance: {
              some: {
                status: "overdue",
                deleted_at: null,
              },
            },
          },
        ],
      },
      include: {
        flt_vehicle_maintenance: {
          where: {
            status: { in: ["scheduled", "overdue"] },
          },
        },
      },
    });
  }

  /**
   * Find vehicles with expiring insurance
   */
  async findVehiclesWithExpiringInsurance(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<Vehicle[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return await this.model.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        OR: [
          {
            insurance_expiry: {
              lte: futureDate,
            },
          },
          {
            flt_vehicle_insurances: {
              some: {
                end_date: {
                  lte: futureDate,
                },
                is_active: true,
                deleted_at: null,
              },
            },
          },
        ],
      },
      include: {
        flt_vehicle_insurances: {
          where: {
            is_active: true,
            deleted_at: null,
          },
        },
      },
    });
  }

  // ============================================================================
  // MAINTENANCE METHODS (NO soft-delete - table has no deleted_at column)
  // ============================================================================

  /**
   * Find a specific maintenance record by ID for a vehicle
   * NOTE: flt_vehicle_maintenance has NO deleted_at column
   */
  async findMaintenanceById(id: string, vehicleId: string, tenantId: string) {
    return await this.prisma.flt_vehicle_maintenance.findFirst({
      where: {
        id,
        vehicle_id: vehicleId,
        tenant_id: tenantId,
      },
    });
  }

  /**
   * Find all maintenance records for a vehicle with pagination and filters
   * NOTE: flt_vehicle_maintenance has NO deleted_at column
   */
  async findMaintenanceByVehicle(
    vehicleId: string,
    tenantId: string,
    filters: {
      page?: number;
      limit?: number;
      status?: string;
      maintenance_type?: string;
      from_date?: Date;
      to_date?: Date;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      maintenance_type,
      from_date,
      to_date,
      sortBy = "scheduled_date",
      sortOrder = "desc",
    } = filters;

    // Build WHERE clause
    const where: Record<string, unknown> = {
      vehicle_id: vehicleId,
      tenant_id: tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (maintenance_type) {
      where.maintenance_type = maintenance_type;
    }

    if (from_date || to_date) {
      where.scheduled_date = {};
      if (from_date) {
        (where.scheduled_date as Record<string, Date>).gte = from_date;
      }
      if (to_date) {
        (where.scheduled_date as Record<string, Date>).lte = to_date;
      }
    }

    // Execute queries in parallel for efficiency
    const [data, total] = await Promise.all([
      this.prisma.flt_vehicle_maintenance.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.flt_vehicle_maintenance.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new maintenance record
   * NOTE: flt_vehicle_maintenance has NO deleted_at column
   */
  async createMaintenance(
    data: Record<string, unknown>,
    userId: string,
    tenantId: string
  ) {
    return await this.prisma.flt_vehicle_maintenance.create({
      data: {
        ...data,
        tenant_id: tenantId,
        status: "scheduled",
        metadata: data.metadata || {},
        created_by: userId,
        updated_by: userId,
      } as never,
    });
  }

  /**
   * Update an existing maintenance record
   * NOTE: flt_vehicle_maintenance has NO deleted_at column
   */
  async updateMaintenance(
    id: string,
    data: Record<string, unknown>,
    userId: string,
    _tenantId: string
  ) {
    return await this.prisma.flt_vehicle_maintenance.update({
      where: { id },
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  // ============================================================================
  // EXPENSE METHODS (WITH soft-delete - table has deleted_at column)
  // ============================================================================

  /**
   * Find all expenses for a vehicle with pagination and filters
   * IMPORTANT: flt_vehicle_expenses HAS deleted_at column - must filter null
   */
  async findExpensesByVehicle(
    vehicleId: string,
    tenantId: string,
    filters: {
      page?: number;
      limit?: number;
      expense_category?: string;
      reimbursed?: boolean;
      from_date?: Date;
      to_date?: Date;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      expense_category,
      reimbursed,
      from_date,
      to_date,
      sortBy = "expense_date",
      sortOrder = "desc",
    } = filters;

    // Build WHERE clause with soft-delete filter
    const where: Record<string, unknown> = {
      vehicle_id: vehicleId,
      tenant_id: tenantId,
      deleted_at: null, // CRITICAL: Filter soft-deleted records
    };

    if (expense_category) {
      where.expense_category = expense_category;
    }

    if (reimbursed !== undefined) {
      where.reimbursed = reimbursed;
    }

    if (from_date || to_date) {
      where.expense_date = {};
      if (from_date) {
        (where.expense_date as Record<string, Date>).gte = from_date;
      }
      if (to_date) {
        (where.expense_date as Record<string, Date>).lte = to_date;
      }
    }

    // Execute queries in parallel for efficiency
    const [data, total] = await Promise.all([
      this.prisma.flt_vehicle_expenses.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.flt_vehicle_expenses.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new expense record
   * IMPORTANT: flt_vehicle_expenses HAS deleted_at column
   */
  async createExpense(
    data: Record<string, unknown>,
    userId: string,
    tenantId: string
  ) {
    return await this.prisma.flt_vehicle_expenses.create({
      data: {
        ...data,
        tenant_id: tenantId,
        reimbursed: false,
        metadata: data.metadata || {},
        created_by: userId,
        updated_by: userId,
      } as never,
    });
  }
}
