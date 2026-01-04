/**
 * Clerk Sync Service
 *
 * Synchronizes Clerk webhooks (users/organizations) with FleetCore database.
 * Handles idempotence, invitation lookup, role assignment, and lifecycle events.
 *
 * @module lib/services/admin/clerk-sync.service
 */

import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuditService } from "./audit.service";
import {
  NotFoundError,
  ConflictError as _ConflictError,
} from "@/lib/core/errors";
import {
  SYSTEM_USER_ID,
  SYSTEM_PROVIDER_EMPLOYEE_ID,
} from "@/lib/constants/system";

/**
 * Clerk user data from webhook
 */
export interface ClerkUserData {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string; // Clerk org ID
}

/**
 * Clerk organization data from webhook
 */
export interface ClerkOrganizationData {
  clerkOrgId: string;
  name: string;
  subdomain?: string;
}

/**
 * Sync verification result
 */
export interface SyncVerificationResult {
  missingInFleetCore: string[]; // Clerk user IDs not in clt_members
  missingInClerk: string[]; // clt_members.clerk_user_id not in Clerk
  total: number;
}

/**
 * Clerk Sync Service
 *
 * Synchronizes Clerk users and organizations with FleetCore database.
 * Ensures idempotence to handle duplicate webhook deliveries.
 *
 * @example
 * ```typescript
 * const clerkSync = new ClerkSyncService();
 *
 * // Handle user.created webhook
 * await clerkSync.handleUserCreated({
 *   clerkUserId: 'user_abc123',
 *   email: 'john@acme.com',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 * ```
 */
export class ClerkSyncService {
  private prisma: PrismaClient;
  private auditService: AuditService;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
    this.auditService = new AuditService(this.prisma);
  }

  /**
   * Handle Clerk user.created webhook
   *
   * Creates member from invitation with automatic role assignment.
   * Idempotent: returns early if clerk_user_id already exists.
   *
   * Flow:
   * 1. Check idempotence (clerk_user_id exists?)
   * 2. Find invitation by email
   * 3. Find role by invitation.role (slug)
   * 4. Create member in clt_members
   * 5. Assign role in adm_member_roles
   * 6. Mark invitation accepted
   * 7. Create audit log
   *
   * @param data - Clerk user data
   *
   * @throws {NotFoundError} If no invitation found for email
   * @throws {NotFoundError} If role not found
   *
   * @example
   * ```typescript
   * await clerkSync.handleUserCreated({
   *   clerkUserId: 'user_abc123',
   *   email: 'john@acme.com',
   *   firstName: 'John',
   *   lastName: 'Doe'
   * });
   * ```
   */
  async handleUserCreated(data: ClerkUserData): Promise<void> {
    const { clerkUserId, email, firstName, lastName } = data;

    // 1. Idempotence check
    const existingMember = await this.prisma.clt_members.findFirst({
      where: { clerk_user_id: clerkUserId, deleted_at: null },
    });

    if (existingMember) {
      return; // Already synced, nothing to do
    }

    // 2. Find invitation by email
    const invitation = await this.prisma.adm_invitations.findFirst({
      where: {
        email: email.toLowerCase(),
        status: "pending",
        expires_at: { gte: new Date() }, // Not expired
      },
      orderBy: { sent_at: "desc" }, // Most recent
    });

    if (!invitation) {
      throw new NotFoundError(
        `No pending invitation found for email ${email}. User must be invited before signup.`
      );
    }

    // 3. Find role by slug (invitation.role is the role slug)
    const role = await this.prisma.adm_roles.findFirst({
      where: {
        tenant_id: invitation.tenant_id,
        slug: invitation.role,
        deleted_at: null,
      },
    });

    if (!role) {
      throw new NotFoundError(
        `Role with slug "${invitation.role}" not found for tenant ${invitation.tenant_id}`
      );
    }

    // 4. Create member in transaction and get the created member ID
    const createdMember = await this.prisma.$transaction(async (tx) => {
      // Create member
      const member = await tx.clt_members.create({
        data: {
          tenant_id: invitation.tenant_id,
          clerk_user_id: clerkUserId,
          email: email.toLowerCase(),
          first_name: firstName || null,
          last_name: lastName || null,
          phone: "", // Required field - Clerk doesn't provide phone by default
          status: "active",
        },
      });

      // 5. Assign role
      await tx.adm_member_roles.create({
        data: {
          tenant_id: invitation.tenant_id,
          member_id: member.id,
          role_id: role.id,
          assigned_by: SYSTEM_USER_ID, // System-assigned during signup
          assignment_reason: "Automatic role assignment from invitation",
          valid_from: new Date(),
          is_primary: true,
          scope_type: "global",
        },
      });

      // 6. Mark invitation accepted
      await tx.adm_invitations.update({
        where: { id: invitation.id },
        data: {
          status: "accepted",
          accepted_at: new Date(),
          accepted_by_member_id: member.id,
        },
      });

      return member;
    });

    // 7. Audit log
    await this.auditService.logAction({
      tenantId: invitation.tenant_id,
      memberId: SYSTEM_USER_ID, // System action
      entity: "member",
      action: "create",
      entityId: createdMember.id, // Use member.id (UUID), not clerkUserId (string)
      newValues: { clerk_user_id: clerkUserId, email, firstName, lastName },
      reason: "User created from Clerk webhook",
    });
  }

  /**
   * Handle Clerk user.updated webhook
   *
   * Updates member fields (email, first_name, last_name) if changed.
   *
   * @param data - Clerk user data
   * @throws {NotFoundError} If member not found
   */
  async handleUserUpdated(data: ClerkUserData): Promise<void> {
    const { clerkUserId, email, firstName, lastName } = data;

    // Find member by clerk_user_id
    const member = await this.prisma.clt_members.findFirst({
      where: { clerk_user_id: clerkUserId, deleted_at: null },
    });

    if (!member) {
      throw new NotFoundError(
        `Member with clerk_user_id ${clerkUserId} not found`
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (email && email.toLowerCase() !== member.email) {
      updateData.email = email.toLowerCase();
      oldValues.email = member.email;
      newValues.email = email.toLowerCase();
    }

    if (firstName && firstName !== member.first_name) {
      updateData.first_name = firstName;
      oldValues.first_name = member.first_name;
      newValues.first_name = firstName;
    }

    if (lastName && lastName !== member.last_name) {
      updateData.last_name = lastName;
      oldValues.last_name = member.last_name;
      newValues.last_name = lastName;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();
      updateData.updated_by = SYSTEM_USER_ID; // System action

      await this.prisma.clt_members.update({
        where: { id: member.id },
        data: updateData,
      });

      // Audit log with changes
      await this.auditService.logAction({
        tenantId: member.tenant_id,
        memberId: SYSTEM_USER_ID, // System action
        entity: "member",
        action: "update",
        entityId: member.id,
        oldValues,
        newValues,
        reason: "User updated from Clerk webhook",
      });
    }
  }

  /**
   * Handle Clerk user.deleted webhook
   *
   * Soft deletes member and revokes all active role assignments.
   *
   * @param data - Clerk user data
   * @throws {NotFoundError} If member not found
   */
  async handleUserDeleted(
    data: Pick<ClerkUserData, "clerkUserId">
  ): Promise<void> {
    const { clerkUserId } = data;

    // Find member
    const member = await this.prisma.clt_members.findFirst({
      where: { clerk_user_id: clerkUserId, deleted_at: null },
    });

    if (!member) {
      throw new NotFoundError(
        `Member with clerk_user_id ${clerkUserId} not found`
      );
    }

    // Soft delete in transaction
    await this.prisma.$transaction(async (tx) => {
      // Soft delete member
      await tx.clt_members.update({
        where: { id: member.id },
        data: {
          deleted_at: new Date(),
          deleted_by: SYSTEM_USER_ID, // System action
          deletion_reason: "User deleted from Clerk",
          status: "inactive",
        },
      });

      // Revoke all active role assignments
      await tx.adm_member_roles.updateMany({
        where: {
          member_id: member.id,
          deleted_at: null,
          OR: [{ valid_until: null }, { valid_until: { gte: new Date() } }],
        },
        data: {
          valid_until: new Date(), // Expire immediately
          updated_at: new Date(),
          updated_by: SYSTEM_USER_ID, // System action
        },
      });
    });

    // Audit log
    await this.auditService.logAction({
      tenantId: member.tenant_id,
      memberId: SYSTEM_USER_ID, // System action
      entity: "member",
      action: "delete",
      entityId: member.id,
      reason: "User deleted from Clerk webhook",
    });
  }

  /**
   * Handle Clerk organization.created webhook
   *
   * Creates tenant with default settings and lifecycle event.
   * Idempotent: returns early if clerk_organization_id already exists.
   *
   * @param data - Clerk organization data
   */
  async handleOrganizationCreated(data: ClerkOrganizationData): Promise<void> {
    const { clerkOrgId, name, subdomain } = data;

    // 1. Idempotence check
    const existingTenant = await this.prisma.adm_tenants.findFirst({
      where: { clerk_organization_id: clerkOrgId, deleted_at: null },
    });

    if (existingTenant) {
      return; // Already synced
    }

    // 2. Generate unique subdomain from name if not provided
    const generatedSubdomain =
      subdomain ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Check subdomain uniqueness and append number if needed
    let finalSubdomain = generatedSubdomain;
    let counter = 1;
    while (
      await this.prisma.adm_tenants.findFirst({
        where: { subdomain: finalSubdomain, deleted_at: null },
      })
    ) {
      finalSubdomain = `${generatedSubdomain}-${counter}`;
      counter++;
    }

    // 3. Create tenant with default settings in transaction
    const tenant = await this.prisma.$transaction(async (tx) => {
      const newTenant = await tx.adm_tenants.create({
        data: {
          clerk_organization_id: clerkOrgId,
          name,
          subdomain: finalSubdomain,
          status: "active",
          country_code: "FR", // Default
          default_currency: "EUR", // Default
          timezone: "Europe/Paris", // Default
        },
      });

      // Create lifecycle event
      await tx.adm_tenant_lifecycle_events.create({
        data: {
          tenant_id: newTenant.id,
          event_type: "created",
          performed_by: SYSTEM_PROVIDER_EMPLOYEE_ID, // System action (points to adm_provider_employees)
          description: "Tenant created from Clerk organization webhook",
        },
      });

      return newTenant;
    });

    // 4. Audit log
    await this.auditService.logAction({
      tenantId: tenant.id,
      memberId: SYSTEM_USER_ID, // System action
      entity: "tenant",
      action: "create",
      entityId: tenant.id,
      newValues: {
        clerk_organization_id: clerkOrgId,
        name,
        subdomain: finalSubdomain,
      },
      reason: "Organization created from Clerk webhook",
    });
  }

  /**
   * Handle Clerk organization.updated webhook
   *
   * Updates tenant name/slug and creates lifecycle event.
   *
   * @param data - Clerk organization data
   * @throws {NotFoundError} If tenant not found
   */
  async handleOrganizationUpdated(data: ClerkOrganizationData): Promise<void> {
    const { clerkOrgId, name, subdomain } = data;

    const tenant = await this.prisma.adm_tenants.findFirst({
      where: { clerk_organization_id: clerkOrgId, deleted_at: null },
    });

    if (!tenant) {
      throw new NotFoundError(
        `Tenant with clerk_organization_id ${clerkOrgId} not found`
      );
    }

    const updateData: Record<string, unknown> = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (name && name !== tenant.name) {
      updateData.name = name;
      oldValues.name = tenant.name;
      newValues.name = name;
    }

    if (subdomain && subdomain !== tenant.subdomain) {
      updateData.subdomain = subdomain;
      oldValues.subdomain = tenant.subdomain;
      newValues.subdomain = subdomain;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updated_at = new Date();

      await this.prisma.$transaction(async (tx) => {
        await tx.adm_tenants.update({
          where: { id: tenant.id },
          data: updateData,
        });

        await tx.adm_tenant_lifecycle_events.create({
          data: {
            tenant_id: tenant.id,
            event_type: "updated",
            description: "Tenant updated from Clerk organization webhook",
          },
        });
      });

      await this.auditService.logAction({
        tenantId: tenant.id,
        memberId: SYSTEM_USER_ID, // System action
        entity: "tenant",
        action: "update",
        entityId: tenant.id,
        oldValues,
        newValues,
        reason: "Organization updated from Clerk webhook",
      });
    }
  }

  /**
   * Handle Clerk organization.deleted webhook
   *
   * Soft deletes tenant, suspends all members, creates lifecycle event.
   *
   * @param data - Clerk organization data
   * @throws {NotFoundError} If tenant not found
   */
  async handleOrganizationDeleted(
    data: Pick<ClerkOrganizationData, "clerkOrgId">
  ): Promise<void> {
    const { clerkOrgId } = data;

    const tenant = await this.prisma.adm_tenants.findFirst({
      where: { clerk_organization_id: clerkOrgId, deleted_at: null },
    });

    if (!tenant) {
      throw new NotFoundError(
        `Tenant with clerk_organization_id ${clerkOrgId} not found`
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // Soft delete tenant
      await tx.adm_tenants.update({
        where: { id: tenant.id },
        data: {
          deleted_at: new Date(),
          status: "cancelled",
        },
      });

      // Suspend all members
      await tx.clt_members.updateMany({
        where: {
          tenant_id: tenant.id,
          deleted_at: null,
        },
        data: {
          status: "suspended",
          updated_at: new Date(),
          updated_by: SYSTEM_USER_ID, // System action
        },
      });

      // Create lifecycle event
      await tx.adm_tenant_lifecycle_events.create({
        data: {
          tenant_id: tenant.id,
          event_type: "deleted",
          description: "Tenant deleted from Clerk organization webhook",
        },
      });
    });

    await this.auditService.logAction({
      tenantId: tenant.id,
      memberId: SYSTEM_USER_ID, // System action
      entity: "tenant",
      action: "delete",
      entityId: tenant.id,
      reason: "Organization deleted from Clerk webhook",
    });
  }

  /**
   * Verify synchronization between Clerk and FleetCore
   *
   * Compares Clerk users (via API) with clt_members to detect desynchronization.
   * Used for daily health checks.
   *
   * NOTE: This is a placeholder - actual Clerk API integration would require
   * the @clerk/backend SDK and pagination through all users.
   *
   * @returns Sync verification result
   *
   * @example
   * ```typescript
   * const result = await clerkSync.verifySync();
   * if (result.missingInFleetCore.length > 0) {
   *   // Alert: Users in Clerk not synced to FleetCore
   * }
   * ```
   */
  async verifySync(): Promise<SyncVerificationResult> {
    // Fetch all members with clerk_user_id
    const members = await this.prisma.clt_members.findMany({
      where: {
        clerk_user_id: { not: "" }, // Filter out empty strings (required field default)
        deleted_at: null,
      },
      select: {
        clerk_user_id: true,
      },
    });

    const fleetCoreUserIds = new Set(
      members
        .map((m) => m.clerk_user_id)
        .filter((id): id is string => typeof id === "string" && id !== "")
    );

    // NOTE: In real implementation, would fetch from Clerk API:
    // const clerkUsers = await clerk.users.getUserList();
    // const clerkUserIds = new Set(clerkUsers.map(u => u.id));

    // Placeholder: return empty for now
    // Actual implementation requires Clerk SDK
    const missingInFleetCore: string[] = [];
    const missingInClerk: string[] = [];

    return {
      missingInFleetCore,
      missingInClerk,
      total: fleetCoreUserIds.size,
    };
  }
}
