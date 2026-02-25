/**
 * Base Service Abstract Class
 * Provides transaction support, error handling, audit logging, and multi-tenant operations
 */

import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { PrismaTransaction } from "@/lib/core/types";
import {
  isPrismaError,
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  DatabaseError,
} from "@/lib/core/errors";
import {
  auditLog,
  serializeForAudit,
  type AuditAction,
  type AuditEntityType,
} from "@/lib/audit";
import type { BaseRepository } from "@/lib/core/base.repository";
import { logger } from "@/lib/logger";

export abstract class BaseService<T = Record<string, unknown>> {
  protected prisma: PrismaClient;

  /**
   * Constructor with optional Prisma Client injection
   *
   * @param prismaClient - Optional PrismaClient instance for dependency injection
   *                       (useful for testing with mock or SQLite clients)
   *                       Defaults to singleton instance if not provided
   *
   * @example
   * ```typescript
   * // Production: Use singleton (default)
   * class LeadService extends BaseService<Lead> {
   *   constructor() {
   *     super() // Uses singleton prisma from @/lib/prisma
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Testing: Inject test client
   * const testPrisma = new PrismaClient({ datasources: { db: { url: 'file:test.db' } } })
   * class LeadService extends BaseService<Lead> {
   *   constructor(prismaClient?: PrismaClient) {
   *     super(prismaClient)
   *   }
   * }
   * const service = new LeadService(testPrisma)
   * ```
   */
  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Type-safe pattern: Services using softDelete()/restore() must implement this
   *
   * @returns BaseRepository instance for this service's entity
   * @throws {Error} If service uses softDelete()/restore() without implementing
   *
   * @example
   * ```typescript
   * class LeadService extends BaseService<Lead> {
   *   protected getRepository() {
   *     return this.leadRepository
   *   }
   * }
   * ```
   */
  protected getRepository(): BaseRepository<T> {
    throw new Error(
      `${this.constructor.name}.getRepository() must be implemented to use softDelete() and restore(). ` +
        `This method is required for type-safe repository access and automatic audit logging.`
    );
  }

  /**
   * Type-safe pattern: Services using audit logging must implement this
   *
   * @returns Entity type for audit logs (e.g., 'driver', 'vehicle', 'lead')
   * @throws {Error} If service uses audit methods without implementing
   *
   * @example
   * ```typescript
   * class LeadService extends BaseService<Lead> {
   *   protected getEntityType() {
   *     return 'lead' as const
   *   }
   * }
   * ```
   */
  protected getEntityType(): AuditEntityType {
    throw new Error(
      `${this.constructor.name}.getEntityType() must be implemented to use audit logging. ` +
        `This method is required for automatic entity type injection in audit trails.`
    );
  }

  /**
   * Execute an operation within a database transaction
   */
  protected async executeInTransaction<R>(
    operation: (tx: PrismaTransaction) => Promise<R>
  ): Promise<R> {
    return this.prisma.$transaction(operation);
  }

  /**
   * Handle errors consistently across all services with typed error classes
   */
  protected handleError(error: unknown, context: string): never {
    logger.error({ error, context }, `Error in ${context}`);

    // Re-throw AppError instances first (before Prisma check)
    // AppError has .code property which would match isPrismaError
    if (error instanceof AppError) {
      throw error;
    }

    // Handle Prisma-specific errors with type guard
    if (isPrismaError(error)) {
      // Type narrowing works inside this block
      const prismaErr = error;

      if (prismaErr.code === "P2002") {
        throw new ConflictError(`Duplicate entry: ${context}`);
      }

      if (prismaErr.code === "P2025") {
        throw new NotFoundError(`${context}`);
      }

      if (prismaErr.code === "P2003") {
        throw new ValidationError(`Foreign key constraint: ${context}`);
      }

      // Generic database error for other Prisma errors
      throw new DatabaseError(`Database error in ${context}`, prismaErr);
    }

    // Wrap unexpected errors
    const message = error instanceof Error ? error.message : String(error);
    throw new AppError(
      `Unexpected error in ${context}: ${message}`,
      500,
      "INTERNAL_ERROR"
    );
  }

  /**
   * Validate that a tenant exists and is active
   *
   * **Production-ready validation** (Phase 0.1 - NOT a stub)
   *
   * Performs comprehensive tenant validation:
   * 1. Format validation (non-empty string)
   * 2. Database existence check (adm_tenants.id)
   * 3. Soft-delete check (deleted_at IS NULL)
   * 4. Status validation (status = 'active')
   *
   * **Security**: Prevents operations on suspended or deleted tenants
   *
   * @param tenantId - UUID of tenant to validate
   *
   * @throws {ValidationError} If tenantId is empty or not a string
   * @throws {NotFoundError} If tenant doesn't exist or is soft-deleted
   * @throws {ForbiddenError} If tenant status is not 'active' (e.g., 'suspended', 'pending')
   *
   * @example
   * ```typescript
   * // In LeadService.createLead()
   * async createLead(data: CreateLeadDTO, tenantId: string, memberId: string) {
   *   // Validate tenant before any operations
   *   await this.validateTenant(tenantId)
   *
   *   // Safe to proceed - tenant is active
   *   const lead = await this.getRepository().create(data, memberId, tenantId)
   *   return lead
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * try {
   *   await this.validateTenant('invalid-tenant')
   * } catch (error) {
   *   if (error instanceof NotFoundError) {
   *     // Tenant doesn't exist or is deleted
   *   } else if (error instanceof ForbiddenError) {
   *     // Tenant is suspended
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Typical usage in service method
   * class DriverService extends BaseService<Driver> {
   *   async updateDriver(id: string, data: UpdateDriverDTO, tenantId: string) {
   *     await this.validateTenant(tenantId) // Throws if invalid
   *     return this.getRepository().update(id, data, userId, tenantId)
   *   }
   * }
   * ```
   */
  protected async validateTenant(tenantId: string): Promise<void> {
    if (!tenantId || typeof tenantId !== "string") {
      throw new ValidationError("Tenant ID is required and must be a string");
    }

    // Check tenant exists and is active
    const tenant = await this.prisma.adm_tenants.findUnique({
      where: { id: tenantId, deleted_at: null },
      select: { id: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundError(`Tenant ${tenantId}`);
    }

    if (tenant.status !== "active") {
      throw new ForbiddenError(
        `Tenant ${tenantId} is suspended (status: ${tenant.status})`
      );
    }
  }

  /**
   * Check if member has required permission
   * STUB for Phase 0.2 - Will be implemented with full RBAC
   *
   * @param memberId - Member ID to check
   * @param permission - Permission identifier (e.g., "leads:delete")
   * @throws {Error} Always throws NOT_IMPLEMENTED error
   */
  protected checkPermission(memberId: string, permission: string): void {
    throw new Error(
      `NOT_IMPLEMENTED: RBAC will be implemented in Phase 0.2. ` +
        `Required permission: "${permission}" for member: "${memberId}"`
    );
  }

  /**
   * Create audit log entry
   *
   * Thin wrapper around lib/audit.ts auditLog function.
   * Automatically injects entityType from getEntityType().
   * Serializes changes and snapshots for JSONB storage.
   *
   * @param options - Audit log parameters
   * @param options.tenantId - Tenant ID for multi-tenant isolation
   * @param options.action - Action performed (create, update, delete, restore, etc.)
   * @param options.entityId - ID of the entity affected
   * @param options.memberId - Member who performed the action (adm_members.id)
   * @param options.authUserId - Optional auth user ID for correlation
   * @param options.changes - Optional object with before/after values
   * @param options.snapshot - Optional full entity snapshot
   * @param options.reason - Optional human-readable reason
   *
   * @example
   * ```typescript
   * // Log driver update with changes
   * await this.audit({
   *   tenantId: 'tenant-123',
   *   action: 'update',
   *   entityId: driver.id,
   *   memberId: 'member-456',
   *   authUserId: 'user_abc',
   *   changes: {
   *     status: { old: 'inactive', new: 'active' },
   *     license_expiry: { old: '2024-01-01', new: '2025-01-01' }
   *   }
   * })
   * ```
   *
   * @example
   * ```typescript
   * // Log entity creation with snapshot
   * await this.audit({
   *   tenantId: tenant.id,
   *   action: 'create',
   *   entityId: newLead.id,
   *   memberId: currentMember.id,
   *   snapshot: { ...newLead }
   * })
   * ```
   */
  protected async audit(options: {
    tenantId: string;
    action: AuditAction;
    entityId: string;
    memberId: string;
    authUserId?: string;
    changes?: Record<string, unknown>;
    snapshot?: Record<string, unknown>;
    reason?: string;
  }): Promise<void> {
    await auditLog({
      tenantId: options.tenantId,
      action: options.action,
      entityType: this.getEntityType(),
      entityId: options.entityId,
      performedBy: options.memberId,
      performedByAuthId: options.authUserId,
      changes: options.changes ? serializeForAudit(options.changes) : null,
      snapshot: options.snapshot ? serializeForAudit(options.snapshot) : null,
      reason: options.reason,
    });
  }

  /**
   * Create entity with automatic audit logging (OPTIONAL HELPER)
   *
   * Optional orchestration helper for services that want automatic audit.
   * Services can continue calling repository.create() directly if preferred.
   *
   * Pattern: SAFE - does not break existing services (Driver, Vehicle, etc.)
   * Used by: NEW services (CRM, Admin) for automatic audit
   *
   * Flow:
   * 1. Calls repository.create()
   * 2. Automatically creates audit log with action='create'
   * 3. Returns created entity
   *
   * @param data - Entity data to create
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @param memberId - Member performing the creation (adm_members.id)
   * @param authUserId - Optional auth user ID for audit trail
   * @returns Created entity with typed fields
   *
   * @example
   * ```typescript
   * // In LeadService (NEW service using helper)
   * class LeadService extends BaseService<Lead> {
   *   async createLead(data: CreateLeadDTO, tenantId: string, memberId: string) {
   *     await this.validateTenant(tenantId);
   *     // Uses helper - audit automatic
   *     return this.create(data, tenantId, memberId);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // DriverService (existing service) does NOT use this helper
   * // It continues calling driverRepo.create() + auditLog() manually
   * // Zero breaking change - both patterns work
   * ```
   */
  protected async create<TData extends Record<string, unknown>>(
    data: TData,
    tenantId: string,
    memberId: string,
    authUserId?: string
  ): Promise<T> {
    // 1. Create via repository (data layer)
    const entity = await this.getRepository().create(
      data as Record<string, unknown>,
      memberId,
      tenantId
    );

    // 2. Audit log (orchestration layer) - automatic
    await this.audit({
      tenantId,
      action: "create",
      entityId: (entity as { id: string }).id,
      memberId,
      authUserId,
      snapshot: entity as Record<string, unknown>,
    });

    return entity;
  }

  /**
   * Update entity with automatic audit logging and diff calculation (OPTIONAL HELPER)
   *
   * Optional orchestration helper for services that want automatic audit with diff.
   * Services can continue calling repository.update() directly if preferred.
   *
   * Pattern: SAFE - does not break existing services (Driver, Vehicle, etc.)
   * Used by: NEW services (CRM, Admin) for automatic audit + diff
   *
   * Flow:
   * 1. Fetches old entity state
   * 2. Calls repository.update()
   * 3. Calculates diff between old and new
   * 4. Automatically creates audit log with action='update' + changes
   * 5. Returns updated entity
   *
   * @param id - Entity ID to update
   * @param data - Partial update data
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @param memberId - Member performing the update (adm_members.id)
   * @param authUserId - Optional auth user ID for audit trail
   * @returns Updated entity with typed fields
   *
   * @example
   * ```typescript
   * // In OpportunityService (NEW service using helper)
   * class OpportunityService extends BaseService<Opportunity> {
   *   async updateOpportunity(id: string, data: UpdateOpportunityDTO, tenantId: string, memberId: string) {
   *     // Uses helper - audit + diff automatic
   *     return this.update(id, data, tenantId, memberId);
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // VehicleService (existing service) does NOT use this helper
   * // It continues with manual pattern
   * // Zero breaking change - both patterns work
   * ```
   */
  protected async update<TData extends Record<string, unknown>>(
    id: string,
    data: TData,
    tenantId: string,
    memberId: string,
    authUserId?: string
  ): Promise<T> {
    // 1. Fetch old entity state for diff calculation
    const oldEntity = await this.getRepository().findById(id, tenantId);

    // 2. Update via repository (data layer)
    const newEntity = await this.getRepository().update(
      id,
      data as Record<string, unknown>,
      memberId,
      tenantId
    );

    // 3. Calculate diff using existing logic in lib/audit.ts
    const changes: Record<string, unknown> = {};
    const oldRecord = oldEntity as Record<string, unknown>;
    const newRecord = newEntity as Record<string, unknown>;

    for (const key in newRecord) {
      if (oldRecord[key] !== newRecord[key]) {
        changes[key] = {
          old: oldRecord[key],
          new: newRecord[key],
        };
      }
    }

    // 4. Audit log (orchestration layer) - automatic with diff
    await this.audit({
      tenantId,
      action: "update",
      entityId: id,
      memberId,
      authUserId,
      changes: Object.keys(changes).length > 0 ? changes : undefined,
    });

    return newEntity;
  }

  /**
   * Soft delete entity with automatic audit logging
   *
   * Type-safe pattern using abstract getRepository().
   * Orchestrates deletion across data layer (repository) and audit layer.
   *
   * Flow:
   * 1. Sets deleted_at, deleted_by, deletion_reason in database
   * 2. Creates audit log entry with action='delete'
   *
   * @param id - Entity ID to soft delete
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @param memberId - Member performing the deletion (adm_members.id)
   * @param authUserId - Optional auth user ID for audit trail
   * @param reason - Optional deletion reason (stored in deletion_reason column)
   *
   * @example
   * ```typescript
   * // In DriverService
   * class DriverService extends BaseService<Driver> {
   *   async deleteDriver(id: string, tenantId: string, memberId: string) {
   *     // Soft delete with audit
   *     await this.softDelete(id, tenantId, memberId, undefined, 'Driver resigned')
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // With auth user tracking
   * await this.softDelete(
   *   leadId,
   *   tenant.id,
   *   member.id,
   *   authUser.id,
   *   'Duplicate entry'
   * )
   * ```
   */
  protected async softDelete(
    id: string,
    tenantId: string,
    memberId: string,
    authUserId?: string,
    reason?: string
  ): Promise<void> {
    // 1. Soft delete via repository (data layer)
    // BaseRepository.softDelete signature: (id, userId, reason?, tenantId?)
    await this.getRepository().softDelete(id, memberId, reason, tenantId);

    // 2. Audit log (orchestration layer)
    await this.audit({
      tenantId,
      action: "delete",
      entityId: id,
      memberId,
      authUserId,
      reason,
    });
  }

  /**
   * Restore soft-deleted entity with automatic audit logging
   *
   * Type-safe pattern using abstract getRepository().
   * Orchestrates restoration across data layer (repository) and audit layer.
   *
   * Flow:
   * 1. Clears deleted_at, deleted_by, deletion_reason in database
   * 2. Updates updated_by and updated_at
   * 3. Creates audit log entry with action='restore'
   *
   * @param id - Entity ID to restore
   * @param tenantId - Tenant ID for multi-tenant isolation
   * @param memberId - Member performing the restoration (adm_members.id)
   * @param authUserId - Optional auth user ID for audit trail
   * @param reason - Optional restoration reason (for audit trail)
   * @returns Restored entity with typed fields
   *
   * @throws {Error} If entity not found
   * @throws {Error} If entity is not deleted
   *
   * @example
   * ```typescript
   * // In VehicleService
   * class VehicleService extends BaseService<Vehicle> {
   *   async restoreVehicle(id: string, tenantId: string, memberId: string) {
   *     const vehicle = await this.restore(
   *       id,
   *       tenantId,
   *       memberId,
   *       undefined,
   *       'Accidental deletion - vehicle still in service'
   *     )
   *     return vehicle
   *   }
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Restore with auth user
   * const restoredLead = await this.restore(
   *   'lead-123',
   *   tenant.id,
   *   member.id,
   *   authUser.id,
   *   'Customer re-engaged'
   * )
   * console.log(restoredLead.deleted_at) // null
   * ```
   */
  protected async restore(
    id: string,
    tenantId: string,
    memberId: string,
    authUserId?: string,
    reason?: string
  ): Promise<T> {
    // 1. Restore via repository (data layer)
    // BaseRepository.restore signature: (id, userId, tenantId?)
    const restored = await this.getRepository().restore(id, memberId, tenantId);

    // 2. Audit log (orchestration layer)
    await this.audit({
      tenantId,
      action: "restore",
      entityId: id,
      memberId,
      authUserId,
      reason,
    });

    return restored;
  }
}
