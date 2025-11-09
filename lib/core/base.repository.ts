/**
 * Base Repository Abstract Class
 * Provides generic CRUD operations with soft-delete support
 */

import { PrismaClient } from "@prisma/client";
import { PaginationOptions, PaginatedResult } from "./types";
import { validateSortBy } from "./validation";
import type { SortFieldWhitelist } from "./validation";

export abstract class BaseRepository<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected model: any; // Prisma delegate - must be any due to complex Prisma internal types
  protected prisma: PrismaClient;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(model: any, prisma: PrismaClient) {
    this.model = model;
    this.prisma = prisma;
  }

  /**
   * Abstract method - child repositories MUST provide sortBy whitelist
   * @returns Non-empty array of allowed sortable fields
   */
  protected abstract getSortWhitelist(): SortFieldWhitelist;

  /**
   * Hook for repositories without soft-delete support
   * Override to return false for tables without deleted_at column
   * @returns true if table has soft-delete (default), false otherwise
   */
  protected shouldFilterDeleted(): boolean {
    return true; // Default: filter soft-deleted records
  }

  /**
   * Find a record by ID with soft-delete and optional tenant filtering
   */
  async findById(id: string, tenantId?: string): Promise<T | null> {
    return (await this.model.findFirst({
      where: {
        id,
        deleted_at: null,
        ...(tenantId && { tenant_id: tenantId }),
      },
    })) as T | null;
  }

  /**
   * Find multiple records with pagination, filtering, and soft-delete support
   */
  async findMany(
    where: Record<string, unknown> = {},
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<T>> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    // Validate sortBy if provided
    if (options.sortBy) {
      // Extract tenantId from where clause (simple cases only)
      // For complex where clauses (AND/OR), tenantId extraction may fail
      // In that case, audit log will be skipped but validation still works
      const tenantId =
        typeof where.tenant_id === "string" ? where.tenant_id : undefined;

      validateSortBy(options.sortBy, this.getSortWhitelist(), tenantId);
    }

    // Add soft-delete filter conditionally
    // Repositories without deleted_at column can override shouldFilterDeleted()
    const whereWithDeleted = this.shouldFilterDeleted()
      ? { ...where, deleted_at: null }
      : where;

    // Count total records
    const total = await this.model.count({
      where: whereWithDeleted,
    });

    // Fetch paginated data
    const data = (await this.model.findMany({
      where: whereWithDeleted,
      skip,
      take: limit,
      orderBy: options.sortBy
        ? { [options.sortBy]: options.sortOrder || "desc" }
        : { created_at: "desc" },
    })) as T[];

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      totalPages,
    };
  }

  /**
   * Create a new record with audit trail
   * @param userId - User ID for audit trail (use SYSTEM_USER_ID for automated operations)
   */
  async create(
    data: Record<string, unknown>,
    userId: string,
    tenantId?: string
  ): Promise<T> {
    const createData = {
      ...data,
      created_by: userId,
      updated_by: userId,
      ...(tenantId && { tenant_id: tenantId }),
    };

    return (await this.model.create({
      data: createData,
    })) as T;
  }

  /**
   * Update a record with audit trail
   */
  async update(
    id: string,
    data: Record<string, unknown>,
    userId: string,
    tenantId?: string
  ): Promise<T> {
    const where: Record<string, unknown> = {
      id,
      deleted_at: null,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    return (await this.model.update({
      where,
      data: {
        ...data,
        updated_by: userId,
        updated_at: new Date(),
      },
    })) as T;
  }

  /**
   * Soft delete a record with audit trail
   */
  async softDelete(
    id: string,
    userId: string,
    reason?: string,
    tenantId?: string
  ): Promise<void> {
    const where: Record<string, unknown> = {
      id,
      deleted_at: null,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    await this.model.update({
      where,
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        ...(reason && { deletion_reason: reason }),
      },
    });
  }

  /**
   * Restore a soft-deleted record
   * Clears deleted_at, deleted_by, and deletion_reason fields
   *
   * @param id - Entity ID to restore
   * @param userId - User performing the restoration (for updated_by)
   * @param tenantId - Optional tenant ID for multi-tenant filtering
   * @returns Restored entity
   * @throws {Error} If entity not found or not deleted
   */
  async restore(id: string, userId: string, tenantId?: string): Promise<T> {
    // Build where clause
    const where: Record<string, unknown> = {
      id,
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    // Check if entity exists and is deleted
    const existing = (await this.model.findFirst({
      where,
    })) as T | null;

    if (!existing) {
      throw new Error(`Entity with id ${id} not found`);
    }

    const existingWithDeletedAt = existing as unknown as {
      deleted_at: Date | null;
    };

    if (!existingWithDeletedAt.deleted_at) {
      throw new Error(`Entity with id ${id} is not deleted`);
    }

    // Restore the entity
    return (await this.model.update({
      where: { id },
      data: {
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        updated_by: userId,
        updated_at: new Date(),
      },
    })) as T;
  }
}
