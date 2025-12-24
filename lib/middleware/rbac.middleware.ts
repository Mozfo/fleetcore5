/**
 * RBAC Middleware - Role-Based Access Control with Scopes
 *
 * Provides granular permission verification for Next.js 15 App Router API routes.
 * Supports global, branch, and team-level scopes for fine-grained access control.
 *
 * Key features:
 * - Checks user permissions via adm_member_roles and adm_roles
 * - Supports scope-based access (global, branch, team)
 * - Validates temporal role validity (valid_from / valid_until)
 * - Returns scope information for downstream resource validation
 * - NO audit logging (Step 0.2 - audit comes in Step 0.3)
 *
 * @module lib/middleware/rbac.middleware
 */

import { prisma } from "@/lib/prisma";
import { ForbiddenError, ValidationError } from "@/lib/core/errors";

/**
 * RBAC check result with scope information
 */
export interface RbacCheckResult {
  hasPermission: boolean;
  scopeType: "global" | "branch" | "team" | null;
  scopeId: string | null;
}

/**
 * Permission structure from role JSON
 */
interface RolePermissions {
  [resource: string]: {
    [action: string]: boolean;
  };
}

/**
 * Require permission middleware
 *
 * Verifies that the authenticated user has the required permission.
 * Checks all active roles assigned to the user and returns the most permissive scope.
 *
 * Permission format: "resource.action" (e.g., "leads.create", "vehicles.delete")
 *
 * Scope priority (most permissive first):
 * 1. global: Can access all resources of this type across the tenant
 * 2. branch: Can access resources belonging to a specific branch
 * 3. team: Can access resources belonging to a specific team
 *
 * Flow:
 * 1. Parse and validate permission format
 * 2. Query all active roles for the user (with temporal validity checks)
 * 3. Check if any role grants the requested permission
 * 4. Return scope information for resource validation
 *
 * @param userId - Member ID (from auth middleware)
 * @param tenantId - Tenant ID (from auth middleware)
 * @param permission - Permission string in format "resource.action"
 * @param resourceId - OPTIONAL: ID of the resource being accessed (for scope validation)
 *
 * @returns RBAC check result with scope information
 *
 * @throws {ValidationError} If permission format is invalid
 * @throws {ForbiddenError} If user does not have the required permission
 *
 * @example
 * // Check global permission
 * const result = await requirePermission(userId, tenantId, "leads.create");
 * // result.scopeType = "global" (can create leads anywhere)
 *
 * @example
 * // Check scoped permission
 * const result = await requirePermission(userId, tenantId, "leads.read", leadId);
 * if (result.scopeType === "branch") {
 *   // Verify lead belongs to authorized branch
 *   await verifyScopeAccess("branch", result.scopeId!, "crm_leads", leadId);
 * }
 */
export async function requirePermission(
  userId: string,
  tenantId: string,
  permission: string,
  _resourceId?: string
): Promise<RbacCheckResult> {
  // ===== Step 1: Validate permission format =====

  const parts = permission.split(".");
  if (parts.length !== 2) {
    throw new ValidationError(
      "Invalid permission format. Expected 'resource.action' (e.g., 'leads.create')"
    );
  }

  const [resource, action] = parts;

  if (!resource || !action) {
    throw new ValidationError(
      "Permission parts cannot be empty. Expected 'resource.action'"
    );
  }

  // ===== Step 2: Query active roles for user =====

  const now = new Date();

  const memberRoles = await prisma.adm_member_roles.findMany({
    where: {
      member_id: userId,
      tenant_id: tenantId,
      deleted_at: null,

      // Temporal validity checks
      OR: [
        { valid_from: null }, // No start date = always valid
        { valid_from: { lte: now } }, // Started in the past
      ],
      AND: [
        {
          OR: [
            { valid_until: null }, // No end date = never expires
            { valid_until: { gte: now } }, // Not expired yet
          ],
        },
      ],
    },
    include: {
      adm_roles: true,
    },
  });

  // ===== Step 3: Check permissions across all roles =====

  let authorizedScope: RbacCheckResult | null = null;

  for (const memberRole of memberRoles) {
    // Skip inactive roles
    if (memberRole.adm_roles.status !== "active") {
      continue;
    }

    // Parse permissions JSON (structure: { resource: { action: boolean } })
    const permissions = memberRole.adm_roles.permissions as RolePermissions;

    // Check if role grants this permission
    const hasPermission = permissions?.[resource]?.[action] === true;

    if (!hasPermission) {
      continue;
    }

    // Permission found! Determine scope
    const scopeType = memberRole.scope_type || "global";
    const scopeId = memberRole.scope_id;

    // If global scope, return immediately (most permissive)
    if (scopeType === "global") {
      return {
        hasPermission: true,
        scopeType: "global",
        scopeId: null,
      };
    }

    // If branch or team scope, store for potential use
    if (scopeType === "branch" || scopeType === "team") {
      // Keep the first scoped permission found
      // Future enhancement: merge multiple scopes or prioritize branch > team
      if (!authorizedScope) {
        authorizedScope = {
          hasPermission: true,
          scopeType,
          scopeId,
        };
      }
    }
  }

  // ===== Step 4: Return result or throw error =====

  // If permission found with branch/team scope, return it
  if (authorizedScope) {
    return authorizedScope;
  }

  // No permission found - throw Forbidden
  throw new ForbiddenError(
    `Permission denied: ${permission}. User does not have required access in this tenant.`
  );
}

/**
 * Verify scope access to a resource
 *
 * Helper function to validate that a specific resource belongs to the authorized scope.
 * This should be called AFTER requirePermission() when dealing with scoped permissions.
 *
 * Implementation note: This is a simplified version for Step 0.2.
 * In production, this would need table-specific implementations or a registry pattern
 * to properly type-check each Prisma model.
 *
 * @param scopeType - Type of scope ("branch" or "team")
 * @param scopeId - ID of the authorized scope
 * @param resourceTable - Prisma table name (e.g., "crm_leads", "flt_vehicles")
 * @param resourceId - ID of the resource to check
 *
 * @throws {ForbiddenError} If resource does not belong to the authorized scope
 * @throws {ValidationError} If table name is invalid
 *
 * @example
 * // After requirePermission returns branch scope
 * const result = await requirePermission(userId, tenantId, "leads.update", leadId);
 * if (result.scopeType !== "global") {
 *   await verifyScopeAccess(result.scopeType!, result.scopeId!, "crm_leads", leadId);
 * }
 * // Now safe to proceed with update
 */
export async function verifyScopeAccess(
  scopeType: "branch" | "team",
  scopeId: string,
  resourceTable: string,
  resourceId: string
): Promise<void> {
  // Determine the field name to check based on scope type
  const scopeField = scopeType === "branch" ? "branch_id" : "team_id";

  // Validate table name to prevent injection
  const validTables = [
    "crm_leads",
    "crm_opportunities",
    "crm_orders",
    "flt_vehicles",
  ];

  if (!validTables.includes(resourceTable)) {
    throw new ValidationError(
      `Invalid resource table: ${resourceTable}. Table must be one of: ${validTables.join(", ")}`
    );
  }

  // Build where clause
  const whereClause = {
    id: resourceId,
    [scopeField]: scopeId,
    deleted_at: null,
  };

  // Execute query based on table (type-safe approach)
  let resource: { id: string } | null = null;

  switch (resourceTable) {
    case "crm_leads":
      resource = await prisma.crm_leads.findFirst({
        where: whereClause,
        select: { id: true },
      });
      break;
    case "crm_opportunities":
      resource = await prisma.crm_opportunities.findFirst({
        where: whereClause,
        select: { id: true },
      });
      break;
    case "crm_orders":
      resource = await prisma.crm_orders.findFirst({
        where: whereClause,
        select: { id: true },
      });
      break;
    case "flt_vehicles":
      resource = await prisma.flt_vehicles.findFirst({
        where: whereClause,
        select: { id: true },
      });
      break;
  }

  // If resource not found or not in scope, deny access
  if (!resource) {
    throw new ForbiddenError(
      `Resource not accessible: ${resourceTable}/${resourceId} is not in your authorized ${scopeType}. You can only access resources within your assigned ${scopeType}.`
    );
  }

  // Resource exists and belongs to authorized scope - access granted
}

/**
 * Check if user has ANY of the specified permissions
 *
 * Utility function to check multiple permissions with OR logic.
 * Useful for endpoints that accept multiple roles (e.g., admin OR manager).
 *
 * @param userId - Member ID
 * @param tenantId - Tenant ID
 * @param permissions - Array of permission strings
 *
 * @returns RBAC check result for the first granted permission
 *
 * @throws {ForbiddenError} If user has NONE of the permissions
 *
 * @example
 * // Allow access if user has either admin OR manager permission
 * const result = await requireAnyPermission(
 *   userId,
 *   tenantId,
 *   ["leads.delete", "leads.admin"]
 * );
 */
export async function requireAnyPermission(
  userId: string,
  tenantId: string,
  permissions: string[]
): Promise<RbacCheckResult> {
  const errors: string[] = [];

  // Try each permission in order
  for (const permission of permissions) {
    try {
      const result = await requirePermission(userId, tenantId, permission);
      return result; // First success wins
    } catch (error) {
      if (error instanceof ForbiddenError) {
        errors.push(permission);
        continue; // Try next permission
      }
      throw error; // Re-throw unexpected errors
    }
  }

  // None of the permissions granted
  throw new ForbiddenError(
    `Permission denied. User requires one of: ${permissions.join(", ")}`
  );
}
