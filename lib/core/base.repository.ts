/**
 * Base Repository Abstract Class
 * Provides generic CRUD operations with soft-delete support
 */

import { PrismaClient } from "@prisma/client";
import { PaginationOptions, PaginatedResult } from "./types";

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

    // Add soft-delete filter
    const whereWithDeleted = {
      ...where,
      deleted_at: null,
    };

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
}
