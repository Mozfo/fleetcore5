// lib/services/vehicles/vehicle.service.ts
import { flt_vehicles } from "@prisma/client";
import { BaseService } from "@/lib/core/base.service";
import { VehicleRepository } from "@/lib/repositories/vehicle.repository";
import { DocumentService } from "@/lib/services/documents/document.service";
import { EmailService } from "@/lib/services/email/email.service";
import { auditLog } from "@/lib/audit";
import { serializeForAudit } from "@/lib/utils/audit";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import type {
  PaginationOptions,
  PaginatedResult,
  PrismaTransaction,
} from "@/lib/core/types";
import type {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleWithRelations,
  Vehicle,
  VehicleFilters,
} from "./vehicle.types";

export class VehicleService extends BaseService {
  private vehicleRepo: VehicleRepository;
  private documentService: DocumentService;
  private emailService: EmailService;

  constructor() {
    super();
    this.vehicleRepo = new VehicleRepository(this.prisma);
    this.documentService = new DocumentService();
    this.emailService = new EmailService();
  }

  async createVehicle(
    data: CreateVehicleDto,
    userId: string,
    tenantId: string
  ): Promise<VehicleWithRelations> {
    return this.executeInTransaction(async (tx) => {
      // 1. Valider la conformité réglementaire
      await this.validateVehicleCompliance(data, tenantId);

      // 2. Créer le véhicule
      const vehicle = await this.vehicleRepo.create(
        {
          ...data,
          status: "pending",
        },
        userId,
        tenantId
      );

      // 3. Créer les documents requis
      const requiredDocs = await this.getRequiredDocuments(data.country_code);
      for (const docType of requiredDocs) {
        await this.documentService.createPlaceholder(
          "flt_vehicles",
          vehicle.id,
          docType,
          tenantId,
          userId,
          tx
        );
      }

      // 4. Planifier la première maintenance
      await this.scheduleInitialMaintenance(vehicle, tx);

      // 5. Envoyer les notifications
      // Get admin email - TODO: Get from tenant settings
      const adminEmail = process.env.ADMIN_EMAIL || "admin@fleetcore.app";
      await this.emailService.sendVehicleCreated(
        vehicle as flt_vehicles,
        tenantId,
        adminEmail
      );

      // 6. Log d'audit
      await auditLog({
        tenantId,
        action: "create",
        entityType: "vehicle",
        entityId: vehicle.id,
        snapshot: serializeForAudit(vehicle),
        performedBy: userId,
      });

      return vehicle as VehicleWithRelations;
    });
  }

  async updateVehicle(
    id: string,
    data: UpdateVehicleDto,
    userId: string,
    tenantId: string
  ): Promise<VehicleWithRelations> {
    const existing = await this.vehicleRepo.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError("Vehicle");
    }

    return this.executeInTransaction(async (_tx) => {
      const vehicle = await this.vehicleRepo.update(
        id,
        data as Record<string, unknown>,
        userId,
        tenantId
      );

      // Check document expiry
      if (data.insurance_expiry) {
        await this.checkInsuranceExpiry(vehicle);
      }

      await auditLog({
        tenantId,
        action: "update",
        entityType: "vehicle",
        entityId: vehicle.id,
        changes: serializeForAudit({ before: existing, after: vehicle }),
        performedBy: userId,
      });

      return vehicle as VehicleWithRelations;
    });
  }

  async deleteVehicle(
    id: string,
    userId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    const vehicle = await this.vehicleRepo.findById(id, tenantId);
    if (!vehicle) {
      throw new NotFoundError("Vehicle");
    }

    // Vérifier qu'il n'y a pas d'assignments actifs
    const activeAssignments =
      await this.prisma.flt_vehicle_assignments.findFirst({
        where: {
          vehicle_id: id,
          tenant_id: tenantId,
          end_date: null,
          deleted_at: null,
        },
      });

    if (activeAssignments) {
      throw new ValidationError(
        "Cannot delete vehicle with active assignments"
      );
    }

    await this.vehicleRepo.softDelete(id, userId, reason, tenantId);

    await auditLog({
      tenantId,
      action: "delete",
      entityType: "vehicle",
      entityId: id,
      reason,
      performedBy: userId,
    });
  }

  async assignToDriver(
    vehicleId: string,
    driverId: string,
    startDate: Date,
    userId: string,
    tenantId: string
  ) {
    return this.executeInTransaction(async (tx) => {
      // 1. Vérifier disponibilité véhicule
      const vehicle = await this.vehicleRepo.findById(vehicleId, tenantId);
      if (!vehicle) {
        throw new NotFoundError("Vehicle");
      }

      const activeAssignment = await tx.flt_vehicle_assignments.findFirst({
        where: {
          vehicle_id: vehicleId,
          tenant_id: tenantId,
          end_date: null,
          deleted_at: null,
        },
      });

      if (activeAssignment) {
        throw new ValidationError("Vehicle already assigned");
      }

      // 2. Vérifier éligibilité conducteur
      const driver = await tx.rid_drivers.findFirst({
        where: {
          id: driverId,
          tenant_id: tenantId,
          deleted_at: null,
          driver_status: "active",
        },
      });

      if (!driver) {
        throw new NotFoundError("Driver");
      }

      // 3. Créer l'assignment
      const assignment = await tx.flt_vehicle_assignments.create({
        data: {
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          driver_id: driverId,
          start_date: startDate,
          assignment_type: "permanent",
          status: "pending_handover",
          created_by: userId,
          updated_by: userId,
        },
      });

      // 4. Mettre à jour le statut du véhicule
      await tx.flt_vehicles.update({
        where: { id: vehicleId },
        data: {
          status: "assigned",
          updated_by: userId,
        },
      });

      // 5. Audit log
      await auditLog({
        tenantId,
        action: "create",
        entityType: "vehicle",
        entityId: assignment.id,
        snapshot: assignment,
        performedBy: userId,
        metadata: { vehicleId, driverId },
      });

      return assignment;
    });
  }

  // Méthodes additionnelles pour récupération et listing
  async getVehicle(
    id: string,
    tenantId: string
  ): Promise<VehicleWithRelations | null> {
    return this.vehicleRepo.findWithRelations(id, tenantId);
  }

  async listAvailableVehicles(tenantId: string): Promise<Vehicle[]> {
    return this.vehicleRepo.findAvailableVehicles(tenantId);
  }

  async listVehiclesRequiringMaintenance(tenantId: string): Promise<Vehicle[]> {
    return this.vehicleRepo.findVehiclesRequiringMaintenance(tenantId);
  }

  async listVehiclesWithExpiringInsurance(
    tenantId: string,
    daysAhead?: number
  ): Promise<Vehicle[]> {
    return this.vehicleRepo.findVehiclesWithExpiringInsurance(
      tenantId,
      daysAhead
    );
  }

  /**
   * List vehicles with pagination and filters
   */
  async listVehicles(
    filters: VehicleFilters,
    options: PaginationOptions,
    tenantId: string
  ): Promise<PaginatedResult<Vehicle>> {
    // Construct where clause from filters
    const where: Record<string, unknown> = { tenant_id: tenantId };

    if (filters.status) where.status = filters.status;
    if (filters.make_id) where.make_id = filters.make_id;
    if (filters.model_id) where.model_id = filters.model_id;
    if (filters.vehicle_class) where.vehicle_class = filters.vehicle_class;
    if (filters.fuel_type) where.fuel_type = filters.fuel_type;
    if (filters.ownership_type) where.ownership_type = filters.ownership_type;

    // Handle year range filter
    if (filters.min_year || filters.max_year) {
      where.year = {};
      if (filters.min_year)
        (where.year as Record<string, number>).gte = filters.min_year;
      if (filters.max_year)
        (where.year as Record<string, number>).lte = filters.max_year;
    }

    // Handle seats range filter
    if (filters.min_seats || filters.max_seats) {
      where.seats = {};
      if (filters.min_seats)
        (where.seats as Record<string, number>).gte = filters.min_seats;
      if (filters.max_seats)
        (where.seats as Record<string, number>).lte = filters.max_seats;
    }

    return this.vehicleRepo.findMany(where, options);
  }

  /**
   * Unassign driver from vehicle (end active assignment)
   */
  async unassignDriver(
    vehicleId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    return this.executeInTransaction(async (tx) => {
      // 1. Find active assignment
      const assignment = await tx.flt_vehicle_assignments.findFirst({
        where: {
          vehicle_id: vehicleId,
          tenant_id: tenantId,
          end_date: null,
          deleted_at: null,
        },
      });

      if (!assignment) {
        throw new NotFoundError("No active assignment found for this vehicle");
      }

      // 2. End assignment
      await tx.flt_vehicle_assignments.update({
        where: { id: assignment.id },
        data: {
          end_date: new Date(),
          status: "completed",
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // 3. Update vehicle status
      await tx.flt_vehicles.update({
        where: { id: vehicleId },
        data: {
          status: "available",
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // 4. Audit log
      await auditLog({
        tenantId,
        action: "update",
        entityType: "vehicle_assignment",
        entityId: assignment.id,
        changes: {
          before: { end_date: null, status: assignment.status },
          after: { end_date: new Date(), status: "completed" },
        },
        performedBy: userId,
        metadata: { vehicleId, driverId: assignment.driver_id },
      });
    });
  }

  // TODO: Implement once dir_country_regulations is accessible
  private async validateVehicleCompliance(
    _data: CreateVehicleDto,
    _tenantId: string
  ): Promise<void> {
    // TODO: Implementation pending dir_country_regulations table
    // Check country regulations for:
    // - Vehicle max age requirements
    // - Professional license requirements
    // - Specific equipment requirements
    /*
    const regulations = await this.prisma.dir_country_regulations.findUnique({
      where: { country_code: data.country_code }
    });

    if (!regulations) return;

    const vehicleAge = new Date().getFullYear() - data.year;
    if (regulations.vehicle_max_age && vehicleAge > regulations.vehicle_max_age) {
      throw new ValidationError(
        `Vehicle too old. Maximum age: ${regulations.vehicle_max_age} years`
      );
    }

    if (regulations.requires_professional_license && !data.metadata?.professional_license) {
      throw new ValidationError('Professional license required for this country');
    }
    */
  }

  private async getRequiredDocuments(countryCode: string): Promise<string[]> {
    // Get required documents from DocumentService
    const requirements =
      await this.documentService.getRequiredDocumentsByCountry(
        countryCode,
        "vehicle"
      );

    return requirements.map((req) => req.type);
  }

  // TODO: Complete implementation with proper maintenance scheduling
  private async scheduleInitialMaintenance(
    _vehicle: Vehicle,
    _tx: PrismaTransaction
  ): Promise<void> {
    // TODO: Implementation pending - Create first maintenance schedule
    // Schedule based on:
    // - Vehicle type and class
    // - Manufacturer recommendations
    // - Local regulations
    /*
    const firstServiceKm = 5000;
    const firstServiceDate = new Date();
    firstServiceDate.setMonth(firstServiceDate.getMonth() + 3);

    await tx.flt_vehicle_maintenance.create({
      data: {
        tenant_id: vehicle.tenant_id,
        vehicle_id: vehicle.id,
        maintenance_type: 'oil_change',
        scheduled_date: firstServiceDate,
        next_service_km: firstServiceKm,
        status: 'scheduled',
        created_by: vehicle.created_by,
        updated_by: vehicle.created_by
      }
    });
    */
  }

  private async checkInsuranceExpiry(vehicle: Vehicle): Promise<void> {
    // Check insurance expiry and send alerts when:
    // - 30 days before expiry
    // - 15 days before expiry
    // - 7 days before expiry
    if (!vehicle.insurance_expiry) return;

    const expiryDate = new Date(vehicle.insurance_expiry);
    const today = new Date();
    const daysUntilExpiry = Math.floor(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Send alerts at specific intervals
    if ([30, 15, 7, 3, 1].includes(daysUntilExpiry)) {
      // Get admin email - TODO: Get from tenant settings
      const adminEmail = process.env.ADMIN_EMAIL || "admin@fleetcore.app";
      await this.emailService.sendInsuranceExpiryAlert(
        vehicle as flt_vehicles,
        daysUntilExpiry,
        adminEmail
      );
    }
  }

  // ============================================================================
  // MAINTENANCE METHODS (Fleet Maintenance Module)
  // ============================================================================

  /**
   * Create a new maintenance record for a vehicle
   *
   * @param vehicleId - The vehicle ID
   * @param data - Maintenance data
   * @param userId - User performing the action
   * @param tenantId - Tenant ID
   * @returns Created maintenance record
   */
  async createMaintenance(
    vehicleId: string,
    data: Record<string, unknown>,
    userId: string,
    tenantId: string
  ) {
    return this.executeInTransaction(async (_tx) => {
      // 1. Verify vehicle exists
      const vehicle = await this.vehicleRepo.findById(vehicleId, tenantId);
      if (!vehicle) {
        throw new NotFoundError("Vehicle not found");
      }

      // 2. Create maintenance record
      const maintenance = await this.vehicleRepo.createMaintenance(
        {
          vehicle_id: vehicleId,
          ...data,
        },
        userId,
        tenantId
      );

      // 3. Audit log
      await auditLog({
        tenantId,
        action: "create",
        entityType: "vehicle_maintenance",
        entityId: maintenance.id,
        snapshot: serializeForAudit(maintenance),
        performedBy: userId,
        metadata: { vehicleId },
      });

      return maintenance;
    });
  }

  /**
   * Get all maintenance records for a vehicle with pagination and filters
   *
   * @param vehicleId - The vehicle ID
   * @param tenantId - Tenant ID
   * @param filters - Query filters (status, type, dates, pagination)
   * @returns Paginated maintenance records
   */
  async getVehicleMaintenance(
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
    // Verify vehicle exists
    const vehicle = await this.vehicleRepo.findById(vehicleId, tenantId);
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found");
    }

    return this.vehicleRepo.findMaintenanceByVehicle(
      vehicleId,
      tenantId,
      filters
    );
  }

  /**
   * Update an existing maintenance record
   *
   * Validates status transitions:
   * - completed and cancelled are terminal states (no further transitions)
   * - scheduled can only go to in_progress or cancelled
   * - in_progress can only go to completed or cancelled
   * - completed_date is required when status = completed
   *
   * @param vehicleId - The vehicle ID
   * @param maintenanceId - The maintenance record ID
   * @param data - Update data
   * @param userId - User performing the action
   * @param tenantId - Tenant ID
   * @returns Updated maintenance record
   */
  async updateMaintenance(
    vehicleId: string,
    maintenanceId: string,
    data: Record<string, unknown>,
    userId: string,
    tenantId: string
  ) {
    return this.executeInTransaction(async (_tx) => {
      // 1. Get existing maintenance record
      const existing = await this.vehicleRepo.findMaintenanceById(
        maintenanceId,
        vehicleId,
        tenantId
      );

      if (!existing) {
        throw new NotFoundError(
          "Maintenance record not found for this vehicle"
        );
      }

      // 2. Validate status transitions if status is being changed
      if (data.status && data.status !== existing.status) {
        this.validateMaintenanceStatusTransition(
          existing.status,
          data.status as string
        );
      }

      // 3. Validate completed_date when status = completed
      if (
        data.status === "completed" &&
        !data.completed_date &&
        !existing.completed_date
      ) {
        throw new ValidationError(
          "Completed date is required when marking maintenance as completed"
        );
      }

      // 4. Update maintenance record
      const updated = await this.vehicleRepo.updateMaintenance(
        maintenanceId,
        data,
        userId,
        tenantId
      );

      // 5. Audit log
      await auditLog({
        tenantId,
        action: "update",
        entityType: "vehicle_maintenance",
        entityId: maintenanceId,
        changes: serializeForAudit({ before: existing, after: updated }),
        performedBy: userId,
        metadata: { vehicleId },
      });

      return updated;
    });
  }

  /**
   * Validate maintenance status transitions
   *
   * Terminal states (completed, cancelled) cannot transition to any other state.
   * Valid transitions:
   * - scheduled -> in_progress, cancelled
   * - in_progress -> completed, cancelled
   *
   * @param currentStatus - Current maintenance status
   * @param newStatus - New status to transition to
   * @throws ValidationError if transition is invalid
   */
  private validateMaintenanceStatusTransition(
    currentStatus: string,
    newStatus: string
  ): void {
    // Terminal states cannot transition
    if (currentStatus === "completed" || currentStatus === "cancelled") {
      throw new ValidationError(
        `Cannot change status from ${currentStatus}. This is a final state.`
      );
    }

    // Valid transitions matrix
    const validTransitions: Record<string, string[]> = {
      scheduled: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new ValidationError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  // ============================================================================
  // EXPENSE METHODS (Fleet Expenses Module)
  // ============================================================================

  /**
   * Create a new expense record for a vehicle
   *
   * Validates:
   * - Vehicle exists
   * - Driver exists, belongs to tenant, and is active (if driver_id provided)
   * - Ride exists, belongs to tenant, and matches vehicle (if ride_id provided)
   *
   * @param vehicleId - The vehicle ID
   * @param data - Expense data
   * @param userId - User performing the action
   * @param tenantId - Tenant ID
   * @returns Created expense record
   */
  async createExpense(
    vehicleId: string,
    data: Record<string, unknown>,
    userId: string,
    tenantId: string
  ) {
    return this.executeInTransaction(async (tx) => {
      // 1. Verify vehicle exists
      const vehicle = await this.vehicleRepo.findById(vehicleId, tenantId);
      if (!vehicle) {
        throw new NotFoundError("Vehicle not found");
      }

      // 2. If driver_id provided, verify driver exists and is active
      if (data.driver_id) {
        const driver = await tx.rid_drivers.findFirst({
          where: {
            id: data.driver_id as string,
            tenant_id: tenantId,
            deleted_at: null,
          },
        });

        if (!driver) {
          throw new NotFoundError(
            "Driver not found or does not belong to this tenant"
          );
        }

        if (driver.driver_status !== "active") {
          throw new ValidationError(
            "Driver must be active to associate expenses"
          );
        }
      }

      // 3. If ride_id provided, verify ride exists and belongs to this vehicle
      if (data.ride_id) {
        const ride = await tx.trp_trips.findFirst({
          where: {
            id: data.ride_id as string,
            vehicle_id: vehicleId, // CRITICAL: Must match the vehicle
            tenant_id: tenantId,
            deleted_at: null,
          },
        });

        if (!ride) {
          throw new NotFoundError(
            "Ride not found or does not belong to this vehicle and tenant"
          );
        }
      }

      // 4. Create expense record
      const expense = await this.vehicleRepo.createExpense(
        {
          vehicle_id: vehicleId,
          ...data,
        },
        userId,
        tenantId
      );

      // 5. Audit log
      await auditLog({
        tenantId,
        action: "create",
        entityType: "vehicle_expense",
        entityId: expense.id,
        snapshot: serializeForAudit(expense),
        performedBy: userId,
        metadata: {
          vehicleId,
          driverId: data.driver_id as string | undefined,
          rideId: data.ride_id as string | undefined,
        },
      });

      return expense;
    });
  }

  /**
   * Get all expenses for a vehicle with pagination and filters
   *
   * @param vehicleId - The vehicle ID
   * @param tenantId - Tenant ID
   * @param filters - Query filters (category, reimbursed, dates, pagination)
   * @returns Paginated expense records
   */
  async getVehicleExpenses(
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
    // Verify vehicle exists
    const vehicle = await this.vehicleRepo.findById(vehicleId, tenantId);
    if (!vehicle) {
      throw new NotFoundError("Vehicle not found");
    }

    return this.vehicleRepo.findExpensesByVehicle(vehicleId, tenantId, filters);
  }
}
