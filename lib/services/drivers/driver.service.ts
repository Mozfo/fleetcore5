// Driver service with business logic for driver management
import { BaseService } from "@/lib/core/base.service";
import { DriverRepository } from "@/lib/repositories/driver.repository";
import { DocumentService } from "@/lib/services/documents/document.service";
import { EmailService } from "@/lib/services/email/email.service";
import { auditLog, serializeForAudit } from "@/lib/audit";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import type { PaginationOptions, PaginatedResult } from "@/lib/core/types";
import type {
  Driver,
  DriverWithRelations,
} from "@/lib/repositories/driver.repository";
import type { driver_document_type } from "@prisma/client";

/**
 * DTO for creating a new driver
 */
export interface CreateDriverDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  license_number: string;
  license_issue_date?: Date;
  license_expiry_date?: Date;
  professional_card_no?: string;
  professional_expiry?: Date;
  notes?: string;
  // ========== UAE COMPLIANCE FIELDS ==========
  date_of_birth: Date;
  gender: "male" | "female" | "unspecified";
  nationality: string; // ISO 3166-1 alpha-2, uppercase
  hire_date: Date;
  employment_status: "active" | "on_leave" | "suspended" | "terminated";
  cooperation_type:
    | "employee"
    | "contractor"
    | "owner_operator"
    | "partner_driver";
  emergency_contact_name: string;
  emergency_contact_phone: string;
  languages: string[]; // ISO 639-1 codes, uppercase
}

/**
 * DTO for updating an existing driver
 */
export interface UpdateDriverDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  license_number?: string;
  license_issue_date?: Date;
  license_expiry_date?: Date;
  professional_card_no?: string;
  professional_expiry?: Date;
  driver_status?: "active" | "suspended" | "terminated";
  /**
   * Driver rating (0-5 scale)
   * Note: Prisma converts number to Decimal automatically
   */
  rating?: number;
  notes?: string;
}

/**
 * Filters for listing drivers
 */
export interface DriverFilters {
  driver_status?: "active" | "suspended" | "terminated";
  cooperation_type?:
    | "employee"
    | "contractor"
    | "owner_operator"
    | "partner_driver";
  search?: string;
  has_active_assignment?: boolean;
  rating_min?: number;
  rating_max?: number;
  expiring_documents?: boolean;
}

/**
 * Filters for listing driver requests
 */
export interface DriverRequestsFilters {
  status?: "pending" | "approved" | "rejected" | "cancelled";
  request_type?: string;
  from_date?: Date;
  to_date?: Date;
}

/**
 * Filters for driver performance aggregation
 */
export interface DriverPerformanceFilters {
  from_date?: Date;
  to_date?: Date;
  platform?: string;
}

/**
 * Driver history with aggregated data
 */
export interface DriverHistory {
  driver: Driver;
  total_trips: number;
  total_revenue: number;
  average_rating: number;
  documents: {
    type: driver_document_type | null;
    verified: boolean;
    expiry_date?: Date;
  }[];
  recent_performances: { period: string; metrics: unknown }[];
  active_assignment?: { vehicle_id: string; start_date: Date };
}

/**
 * Result of document validation
 */
export interface DocumentValidationResult {
  is_valid: boolean;
  missing_documents: string[];
  expired_documents: { type: driver_document_type | null; expiry_date: Date }[];
  expiring_soon: {
    type: driver_document_type | null;
    expiry_date: Date;
    days_remaining: number;
  }[];
}

/**
 * DriverService
 * Business logic for driver management
 */
export class DriverService extends BaseService {
  private driverRepo: DriverRepository;
  private documentService: DocumentService;
  private emailService: EmailService;

  constructor() {
    super();
    this.driverRepo = new DriverRepository(this.prisma);
    this.documentService = new DocumentService();
    this.emailService = new EmailService();
  }

  /**
   * Create a new driver
   */
  async createDriver(
    data: CreateDriverDto,
    userId: string,
    tenantId: string
  ): Promise<DriverWithRelations> {
    return this.executeInTransaction(async (tx) => {
      // 1. Validate email uniqueness
      const existingEmail = await tx.rid_drivers.findFirst({
        where: {
          tenant_id: tenantId,
          email: data.email,
          deleted_at: null,
        },
      });

      if (existingEmail) {
        throw new ValidationError("Email already exists");
      }

      // 2. Validate license_number uniqueness
      const existingLicense = await tx.rid_drivers.findFirst({
        where: {
          tenant_id: tenantId,
          license_number: data.license_number,
          deleted_at: null,
        },
      });

      if (existingLicense) {
        throw new ValidationError("License number already exists");
      }

      // 3. Create driver
      const driver = await this.driverRepo.create(
        {
          ...data,
          driver_status: "active",
        },
        userId,
        tenantId
      );

      // 3.5. Insert driver languages in rid_driver_languages
      for (const languageCode of data.languages) {
        await tx.rid_driver_languages.create({
          data: {
            tenant_id: tenantId,
            driver_id: driver.id,
            language_code: languageCode,
            proficiency: null, // Optional, not in input
            created_by: userId,
            updated_by: userId,
          },
        });
      }

      // 4. Create document placeholders
      const requiredDocs = [
        "driving_license",
        "professional_card",
        "national_id",
      ];
      for (const docType of requiredDocs) {
        await this.documentService.createPlaceholder(
          "rid_drivers",
          driver.id,
          docType,
          tenantId,
          userId,
          tx
        );
      }

      // 5. Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12);

      // 6. Send onboarding email
      await this.emailService.sendDriverOnboarding(
        driver,
        tenantId,
        tempPassword,
        "en"
      );

      // 7. Audit log
      await auditLog({
        tenantId,
        action: "create",
        entityType: "driver",
        entityId: driver.id,
        snapshot: serializeForAudit(driver),
        performedBy: userId,
      });

      // 8. Return with relations
      return (await this.driverRepo.findWithRelations(
        driver.id,
        tenantId,
        tx
      )) as DriverWithRelations;
    });
  }

  /**
   * Update an existing driver
   */
  async updateDriver(
    id: string,
    data: UpdateDriverDto,
    userId: string,
    tenantId: string
  ): Promise<DriverWithRelations> {
    // 1. Check existence
    const existing = await this.driverRepo.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError("Driver");
    }

    // 2. Validate email uniqueness if changed
    if (data.email && data.email !== existing.email) {
      const existingEmail = await this.prisma.rid_drivers.findFirst({
        where: {
          tenant_id: tenantId,
          email: data.email,
          id: { not: id },
          deleted_at: null,
        },
      });

      if (existingEmail) {
        throw new ValidationError("Email already exists");
      }
    }

    // 3. Validate license_number uniqueness if changed
    if (
      data.license_number &&
      data.license_number !== existing.license_number
    ) {
      const existingLicense = await this.prisma.rid_drivers.findFirst({
        where: {
          tenant_id: tenantId,
          license_number: data.license_number,
          id: { not: id },
          deleted_at: null,
        },
      });

      if (existingLicense) {
        throw new ValidationError("License number already exists");
      }
    }

    // 4. Update driver
    const driver = await this.driverRepo.update(
      id,
      data as Record<string, unknown>,
      userId,
      tenantId
    );

    // 5. Audit log with changes
    await auditLog({
      tenantId,
      action: "update",
      entityType: "driver",
      entityId: id,
      changes: serializeForAudit({ before: existing, after: driver }),
      performedBy: userId,
    });

    // 6. Return with relations
    return (await this.driverRepo.findWithRelations(
      id,
      tenantId
    )) as DriverWithRelations;
  }

  /**
   * Delete a driver (soft delete)
   */
  async deleteDriver(
    id: string,
    userId: string,
    tenantId: string,
    reason?: string
  ): Promise<void> {
    // 1. Check existence
    const driver = await this.driverRepo.findById(id, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver");
    }

    // 2. Check for active assignments
    const activeAssignment =
      await this.prisma.flt_vehicle_assignments.findFirst({
        where: {
          driver_id: id,
          tenant_id: tenantId,
          end_date: null,
          deleted_at: null,
        },
      });

    if (activeAssignment) {
      throw new ValidationError(
        "Cannot delete driver with active vehicle assignment"
      );
    }

    // 3. Soft delete
    await this.driverRepo.softDelete(id, userId, reason, tenantId);

    // 4. Audit log
    await auditLog({
      tenantId,
      action: "delete",
      entityType: "driver",
      entityId: id,
      reason,
      performedBy: userId,
    });
  }

  /**
   * Get a driver with all relations
   */
  async getDriver(
    id: string,
    tenantId: string
  ): Promise<DriverWithRelations | null> {
    return this.driverRepo.findWithRelations(id, tenantId);
  }

  /**
   * List drivers with filters and pagination
   */
  async listDrivers(
    filters: DriverFilters,
    options: PaginationOptions,
    tenantId: string
  ): Promise<PaginatedResult<Driver>> {
    // 1. Build where clause
    const where: Record<string, unknown> = { tenant_id: tenantId };

    // 2. Apply filters
    if (filters.driver_status) {
      where.driver_status = filters.driver_status;
    }

    if (filters.cooperation_type) {
      where.cooperation_type = filters.cooperation_type;
    }

    if (filters.rating_min || filters.rating_max) {
      where.rating = {};
      if (filters.rating_min) {
        (where.rating as Record<string, unknown>).gte = filters.rating_min;
      }
      if (filters.rating_max) {
        (where.rating as Record<string, unknown>).lte = filters.rating_max;
      }
    }

    if (filters.search) {
      where.OR = [
        { first_name: { contains: filters.search, mode: "insensitive" } },
        { last_name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    if (filters.has_active_assignment === true) {
      where.flt_vehicle_assignments = {
        some: { end_date: null, deleted_at: null },
      };
    } else if (filters.has_active_assignment === false) {
      where.flt_vehicle_assignments = {
        none: { end_date: null, deleted_at: null },
      };
    }

    if (filters.expiring_documents) {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const expiringOR = [
        {
          license_expiry_date: {
            lte: futureDate,
            gte: today,
          },
        },
        {
          professional_expiry: {
            lte: futureDate,
            gte: today,
          },
        },
      ];

      // Combine with existing OR clause if present (e.g., from search filter)
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: expiringOR }];
        delete where.OR;
      } else {
        where.OR = expiringOR;
      }
    }

    // 3. Call repository
    return this.driverRepo.findMany(where, options);
  }

  /**
   * List requests for a specific driver with filters and pagination
   * @param driverId - Driver ID
   * @param filters - Request filters (status, type, date range)
   * @param options - Pagination and sorting options
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @returns Paginated list of driver requests
   */
  async listDriverRequests(
    driverId: string,
    filters: DriverRequestsFilters,
    options: PaginationOptions,
    tenantId: string
  ): Promise<PaginatedResult<unknown>> {
    // 1. Verify driver exists and belongs to tenant
    const driver = await this.driverRepo.findById(driverId, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver not found");
    }

    // 2. Build where clause
    const where: Record<string, unknown> = {
      driver_id: driverId,
      tenant_id: tenantId,
    };

    // 3. Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.request_type) {
      where.request_type = filters.request_type;
    }

    if (filters.from_date || filters.to_date) {
      where.request_date = {};
      if (filters.from_date) {
        (where.request_date as Record<string, unknown>).gte = filters.from_date;
      }
      if (filters.to_date) {
        (where.request_date as Record<string, unknown>).lte = filters.to_date;
      }
    }

    // 4. Query via Prisma (direct access - no repository for requests yet)
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Add soft-delete filter
    const whereWithDeleted = {
      ...where,
      deleted_at: null,
    };

    // Count total
    const total = await this.prisma.rid_driver_requests.count({
      where: whereWithDeleted,
    });

    // Fetch data
    const data = await this.prisma.rid_driver_requests.findMany({
      where: whereWithDeleted,
      skip,
      take: limit,
      orderBy: options.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { created_at: "desc" },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Get driver performance metrics with optional aggregation by platform
   * Returns aggregated performance data for a specific driver
   *
   * @param driverId - Driver ID
   * @param filters - Performance filters (date range, platform)
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @returns Aggregated performance metrics
   */
  async getDriverPerformance(
    driverId: string,
    filters: DriverPerformanceFilters,
    tenantId: string
  ): Promise<{
    driver_id: string;
    period: { from: Date | null; to: Date | null };
    metrics: {
      total_trips: number;
      total_cancelled: number;
      total_revenue: number;
      total_hours: number;
      average_rating: number | null;
      total_incidents: number;
      completion_rate: number | null;
      average_on_time_rate: number | null;
    };
    by_platform?: Array<{ platform: string; trips: number; revenue: number }>;
  }> {
    // 1. Verify driver exists and belongs to tenant
    const driver = await this.driverRepo.findById(driverId, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver not found");
    }

    // 2. Build where clause
    const where: Record<string, unknown> = {
      driver_id: driverId,
      tenant_id: tenantId,
      deleted_at: null,
    };

    // 3. Apply date filters on period_start and period_end
    if (filters.from_date || filters.to_date) {
      const periodFilter: Record<string, unknown> = {};

      if (filters.from_date) {
        periodFilter.gte = filters.from_date;
      }
      if (filters.to_date) {
        periodFilter.lte = filters.to_date;
      }

      // Filter by period_start for "from" and period_end for "to"
      if (filters.from_date && filters.to_date) {
        where.AND = [
          { period_start: { gte: filters.from_date } },
          { period_end: { lte: filters.to_date } },
        ];
      } else if (filters.from_date) {
        where.period_start = { gte: filters.from_date };
      } else if (filters.to_date) {
        where.period_end = { lte: filters.to_date };
      }
    }

    // 4. Apply platform filter on metadata JSONB field
    if (filters.platform) {
      where.metadata = {
        path: ["platform"],
        equals: filters.platform,
      };
    }

    // 5. Query rid_driver_performances with specific fields
    const performances = await this.prisma.rid_driver_performances.findMany({
      where,
      select: {
        id: true,
        trips_completed: true,
        trips_cancelled: true,
        earnings_total: true,
        hours_online: true,
        avg_rating: true,
        incidents_count: true,
        on_time_rate: true,
        metadata: true,
      },
    });

    // 6. Manual aggregation using reduce()
    const aggregation = performances.reduce(
      (acc, perf) => {
        acc.total_trips += perf.trips_completed || 0;
        acc.total_cancelled += perf.trips_cancelled || 0;
        acc.total_revenue += Number(perf.earnings_total || 0);
        acc.total_hours += Number(perf.hours_online || 0);
        acc.total_incidents += perf.incidents_count || 0;

        // Collect non-null ratings for averaging
        if (perf.avg_rating !== null && perf.avg_rating !== undefined) {
          acc.ratings.push(Number(perf.avg_rating));
        }

        // Collect non-null on_time_rates for averaging
        if (perf.on_time_rate !== null && perf.on_time_rate !== undefined) {
          acc.on_time_rates.push(Number(perf.on_time_rate));
        }

        // Group by platform if metadata contains platform info
        if (
          perf.metadata &&
          typeof perf.metadata === "object" &&
          "platform" in perf.metadata
        ) {
          const platform = (perf.metadata as Record<string, unknown>)
            .platform as string;
          if (!acc.by_platform[platform]) {
            acc.by_platform[platform] = { trips: 0, revenue: 0 };
          }
          acc.by_platform[platform].trips += perf.trips_completed || 0;
          acc.by_platform[platform].revenue += Number(perf.earnings_total || 0);
        }

        return acc;
      },
      {
        total_trips: 0,
        total_cancelled: 0,
        total_revenue: 0,
        total_hours: 0,
        total_incidents: 0,
        ratings: [] as number[],
        on_time_rates: [] as number[],
        by_platform: {} as Record<string, { trips: number; revenue: number }>,
      }
    );

    // 7. Calculate derived metrics
    const average_rating =
      aggregation.ratings.length > 0
        ? aggregation.ratings.reduce((sum, r) => sum + r, 0) /
          aggregation.ratings.length
        : null;

    const average_on_time_rate =
      aggregation.on_time_rates.length > 0
        ? aggregation.on_time_rates.reduce((sum, r) => sum + r, 0) /
          aggregation.on_time_rates.length
        : null;

    const completion_rate =
      aggregation.total_trips > 0
        ? ((aggregation.total_trips - aggregation.total_cancelled) /
            aggregation.total_trips) *
          100
        : null;

    // 8. Build by_platform array (only if platforms exist)
    const by_platform =
      Object.keys(aggregation.by_platform).length > 0
        ? Object.entries(aggregation.by_platform).map(([platform, data]) => ({
            platform,
            trips: data.trips,
            revenue: data.revenue,
          }))
        : undefined;

    // 9. Return formatted response
    return {
      driver_id: driverId,
      period: {
        from: filters.from_date || null,
        to: filters.to_date || null,
      },
      metrics: {
        total_trips: aggregation.total_trips,
        total_cancelled: aggregation.total_cancelled,
        total_revenue: aggregation.total_revenue,
        total_hours: aggregation.total_hours,
        average_rating:
          average_rating !== null ? Number(average_rating.toFixed(2)) : null,
        total_incidents: aggregation.total_incidents,
        completion_rate:
          completion_rate !== null ? Number(completion_rate.toFixed(2)) : null,
        average_on_time_rate:
          average_on_time_rate !== null
            ? Number(average_on_time_rate.toFixed(2))
            : null,
      },
      ...(by_platform && { by_platform }),
    };
  }

  /**
   * Get driver history with aggregated data
   */
  async getDriverHistory(
    driverId: string,
    tenantId: string
  ): Promise<DriverHistory> {
    // 1. Fetch driver with relations
    const driverWithRelations = await this.driverRepo.findWithRelations(
      driverId,
      tenantId
    );
    if (!driverWithRelations) {
      throw new NotFoundError("Driver");
    }

    // 2. Aggregate trips count
    const tripAggregate = await this.prisma.trp_trips.aggregate({
      where: {
        driver_id: driverId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      _count: { id: true },
    });
    const total_trips = tripAggregate._count.id || 0;

    // 3. Aggregate revenue sum
    const revenueAggregate = await this.prisma.rev_driver_revenues.aggregate({
      where: {
        driver_id: driverId,
        tenant_id: tenantId,
        deleted_at: null,
      },
      _sum: { net_revenue: true },
    });
    const total_revenue = Number(revenueAggregate._sum.net_revenue || 0);

    // 4. Calculate average rating from performances
    const performances = driverWithRelations.rid_driver_performances;
    const average_rating =
      performances.length > 0
        ? performances.reduce((sum, p) => sum + Number(p.avg_rating || 0), 0) /
          performances.length
        : 0;

    // 5. Extract documents
    const documents = driverWithRelations.rid_driver_documents.map((dd) => ({
      type: dd.document_type,
      verified: dd.verified,
      expiry_date: dd.expiry_date ?? undefined,
    }));

    // 6. Extract recent performances (last 5)
    const recent_performances = performances.slice(0, 5).map((p) => ({
      period: `${p.period_start} - ${p.period_end}`,
      metrics: {
        trips_completed: p.trips_completed,
        avg_rating: Number(p.avg_rating || 0),
        earnings: Number(p.earnings_total || 0),
      },
    }));

    // 7. Extract active assignment
    const activeAssignment = driverWithRelations.flt_vehicle_assignments.find(
      (a) => a.end_date === null
    );
    const active_assignment = activeAssignment
      ? {
          vehicle_id: activeAssignment.vehicle_id,
          start_date: activeAssignment.start_date,
        }
      : undefined;

    // 8. Return aggregated data
    return {
      driver: driverWithRelations,
      total_trips,
      total_revenue,
      average_rating,
      documents,
      recent_performances,
      active_assignment,
    };
  }

  /**
   * Validate driver documents
   */
  async validateDriverDocuments(
    driverId: string,
    tenantId: string
  ): Promise<DocumentValidationResult> {
    // 1. Fetch driver with relations
    const driver = await this.driverRepo.findWithRelations(driverId, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver");
    }

    // 2. Required document types
    const requiredTypes = [
      "driving_license",
      "professional_card",
      "national_id",
    ];

    // 3. Check missing documents
    const missing_documents: string[] = [];
    for (const type of requiredTypes) {
      const doc = driver.rid_driver_documents.find(
        (dd) => dd.document_type === type && dd.doc_documents?.file_url !== ""
      );
      if (!doc) {
        missing_documents.push(type);
      }
    }

    // 4. Check expired documents
    const today = new Date();
    const expired_documents = driver.rid_driver_documents
      .filter((dd) => dd.expiry_date && new Date(dd.expiry_date) < today)
      .map((dd) => ({
        type: dd.document_type,
        expiry_date: dd.expiry_date as Date,
      }));

    // 5. Check expiring soon (30 days)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const expiring_soon = driver.rid_driver_documents
      .filter((dd) => {
        if (!dd.expiry_date) return false;
        const expiryDate = new Date(dd.expiry_date);
        return expiryDate < futureDate && expiryDate >= today;
      })
      .map((dd) => {
        // expiry_date is guaranteed to exist due to filter above
        const expiryDate = new Date(dd.expiry_date as Date);
        const days_remaining = Math.floor(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          type: dd.document_type,
          expiry_date: dd.expiry_date as Date,
          days_remaining,
        };
      });

    // 6. Return validation result
    return {
      is_valid:
        missing_documents.length === 0 && expired_documents.length === 0,
      missing_documents,
      expired_documents,
      expiring_soon,
    };
  }

  /**
   * Calculate driver rating from performances
   */
  async calculateDriverRating(
    driverId: string,
    tenantId: string
  ): Promise<number> {
    // 1. Fetch last 10 performances
    const performances = await this.prisma.rid_driver_performances.findMany({
      where: {
        driver_id: driverId,
        tenant_id: tenantId,
      },
      orderBy: { period_end: "desc" },
      take: 10,
    });

    // 2. Calculate average rating
    if (performances.length === 0) {
      return 0;
    }

    const sum = performances.reduce(
      (acc, p) => acc + Number(p.avg_rating || 0),
      0
    );
    const calculatedRating = sum / performances.length;

    // 3. Update driver rating
    await this.driverRepo.update(
      driverId,
      { rating: calculatedRating },
      "system",
      tenantId
    );

    // 4. Return calculated rating
    return calculatedRating;
  }

  /**
   * Suspend a driver
   */
  async suspendDriver(
    driverId: string,
    reason: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    // 1. Fetch driver
    const driver = await this.driverRepo.findById(driverId, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver");
    }

    // 2. Check not already suspended
    if (driver.driver_status === "suspended") {
      throw new ValidationError("Driver already suspended");
    }

    // 3. Update status
    await this.driverRepo.update(
      driverId,
      { driver_status: "suspended" },
      userId,
      tenantId
    );

    // 4. Audit log
    await auditLog({
      tenantId,
      action: "update",
      entityType: "driver",
      entityId: driverId,
      changes: {
        driver_status: { old: driver.driver_status, new: "suspended" },
      },
      reason,
      performedBy: userId,
    });

    // 5. Send email notification
    await this.emailService.sendDriverStatusChanged(
      driver,
      "suspended",
      reason,
      tenantId,
      "en"
    );
  }

  /**
   * Reactivate a driver
   */
  async reactivateDriver(
    driverId: string,
    userId: string,
    tenantId: string
  ): Promise<void> {
    // 1. Fetch driver
    const driver = await this.driverRepo.findById(driverId, tenantId);
    if (!driver) {
      throw new NotFoundError("Driver");
    }

    // 2. Check is suspended
    if (driver.driver_status !== "suspended") {
      throw new ValidationError("Driver is not suspended");
    }

    // 3. Validate documents
    const validation = await this.validateDriverDocuments(driverId, tenantId);
    if (!validation.is_valid) {
      throw new ValidationError(
        "Cannot reactivate driver with invalid documents"
      );
    }

    // 4. Update status
    await this.driverRepo.update(
      driverId,
      { driver_status: "active" },
      userId,
      tenantId
    );

    // 5. Audit log
    await auditLog({
      tenantId,
      action: "update",
      entityType: "driver",
      entityId: driverId,
      changes: {
        driver_status: { old: driver.driver_status, new: "active" },
      },
      performedBy: userId,
    });

    // 6. Send email notification
    await this.emailService.sendDriverStatusChanged(
      driver,
      "active",
      "Reactivated",
      tenantId,
      "en"
    );
  }
}
