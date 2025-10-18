import { BaseRepository } from "@/lib/core/base.repository";
import {
  PrismaClient,
  rid_drivers,
  rid_driver_documents,
  rid_driver_cooperation_terms,
  rid_driver_requests,
  rid_driver_performances,
  rid_driver_training,
  flt_vehicle_assignments,
  doc_documents,
} from "@prisma/client";
import type { PrismaTransaction } from "@/lib/core/types";
import type { SortFieldWhitelist } from "@/lib/core/validation";

/**
 * Whitelist of sortable fields for rid_drivers table
 *
 * ✅ Included columns:
 * - System IDs: id, tenant_id (isolation)
 * - Business identifiers: first_name, last_name, email (non-sensitive)
 * - Status fields: driver_status, employment_status (operational filtering)
 * - Metrics: rating (performance), hire_date (HR)
 * - Timestamps: created_at, updated_at (chronological sorting)
 *
 * ❌ Excluded columns (security reasons):
 * - PII: license_number, professional_card_no, phone, date_of_birth
 * - Personal data: gender, nationality, emergency_contact_*
 * - Soft-delete: deleted_at (NEVER expose in sortBy)
 * - Confidential: notes, cooperation_type, license dates
 */
export const DRIVER_SORT_FIELDS = [
  "id",
  "tenant_id",
  "first_name",
  "last_name",
  "email",
  "driver_status",
  "employment_status",
  "rating",
  "hire_date",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Driver type alias from Prisma generated types
 */
export type Driver = rid_drivers;

/**
 * Driver document with nested doc_documents relation
 */
export interface DriverDocumentWithDocument extends rid_driver_documents {
  doc_documents: doc_documents | null;
}

/**
 * Driver with all relations included
 */
export interface DriverWithRelations extends rid_drivers {
  rid_driver_documents: DriverDocumentWithDocument[];
  rid_driver_cooperation_terms: rid_driver_cooperation_terms[];
  rid_driver_requests: rid_driver_requests[];
  rid_driver_performances: rid_driver_performances[];
  rid_driver_training: rid_driver_training[];
  flt_vehicle_assignments: flt_vehicle_assignments[];
}

/**
 * DriverRepository
 * Repository for managing driver data with multi-tenant support and soft-delete
 */
export class DriverRepository extends BaseRepository<Driver> {
  constructor(prisma: PrismaClient) {
    super(prisma.rid_drivers, prisma);
  }

  /**
   * Provide sortBy whitelist for driver queries
   * @returns DRIVER_SORT_FIELDS whitelist (11 safe columns)
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return DRIVER_SORT_FIELDS;
  }

  /**
   * Find a driver with all its relations
   * @param id - Driver ID
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @param tx - Optional Prisma transaction client
   * @returns Driver with relations or null if not found
   */
  async findWithRelations(
    id: string,
    tenantId: string,
    tx?: PrismaTransaction
  ): Promise<DriverWithRelations | null> {
    const model = tx ? tx.rid_drivers : this.model;

    return (await model.findFirst({
      where: {
        id,
        tenant_id: tenantId,
        deleted_at: null,
      },
      include: {
        rid_driver_documents: {
          where: { deleted_at: null },
          include: {
            doc_documents: true,
          },
          orderBy: { created_at: "desc" },
        },
        rid_driver_cooperation_terms: {
          where: { deleted_at: null },
          orderBy: { effective_date: "desc" },
        },
        rid_driver_training: {
          where: { deleted_at: null },
          orderBy: { completed_at: "desc" },
        },
        flt_vehicle_assignments: {
          where: { deleted_at: null },
          orderBy: { start_date: "desc" },
          take: 5,
        },
      },
    })) as DriverWithRelations | null;
  }

  /**
   * Find all active drivers (driver_status = 'active')
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @param tx - Optional Prisma transaction client
   * @returns List of active drivers
   */
  async findActiveDrivers(
    tenantId: string,
    tx?: PrismaTransaction
  ): Promise<Driver[]> {
    const model = tx ? tx.rid_drivers : this.model;

    return (await model.findMany({
      where: {
        tenant_id: tenantId,
        driver_status: "active",
        deleted_at: null,
      },
      orderBy: { last_name: "asc" },
    })) as Driver[];
  }

  /**
   * Find all available drivers (active without current vehicle assignment)
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @param tx - Optional Prisma transaction client
   * @returns List of available drivers
   */
  async findAvailableDrivers(
    tenantId: string,
    tx?: PrismaTransaction
  ): Promise<Driver[]> {
    const model = tx ? tx.rid_drivers : this.model;

    return (await model.findMany({
      where: {
        tenant_id: tenantId,
        driver_status: "active",
        deleted_at: null,
        flt_vehicle_assignments: {
          none: {
            end_date: null,
            deleted_at: null,
          },
        },
      },
      orderBy: { last_name: "asc" },
    })) as Driver[];
  }

  /**
   * Find drivers by status
   * @param status - Driver status ('active' | 'suspended' | 'terminated')
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @param tx - Optional Prisma transaction client
   * @returns List of drivers with specified status
   */
  async findDriversByStatus(
    status: "active" | "suspended" | "terminated",
    tenantId: string,
    tx?: PrismaTransaction
  ): Promise<Driver[]> {
    const model = tx ? tx.rid_drivers : this.model;

    return (await model.findMany({
      where: {
        tenant_id: tenantId,
        driver_status: status,
        deleted_at: null,
      },
      orderBy: { last_name: "asc" },
    })) as Driver[];
  }

  /**
   * Find drivers with expiring documents (license or professional card)
   * @param tenantId - Tenant ID for multi-tenant filtering
   * @param days - Number of days ahead to check (default: 30)
   * @param tx - Optional Prisma transaction client
   * @returns List of drivers with expiring documents
   */
  async findDriversWithExpiringDocuments(
    tenantId: string,
    days: number = 30,
    tx?: PrismaTransaction
  ): Promise<Driver[]> {
    const model = tx ? tx.rid_drivers : this.model;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return (await model.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        OR: [
          {
            license_expiry_date: {
              lte: futureDate,
              gte: new Date(),
            },
          },
          {
            professional_expiry: {
              lte: futureDate,
              gte: new Date(),
            },
          },
        ],
      },
      orderBy: [{ license_expiry_date: "asc" }, { professional_expiry: "asc" }],
    })) as Driver[];
  }
}
