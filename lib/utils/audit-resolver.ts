/**
 * Audit UUID Resolver
 *
 * Resolves auth session IDs to database UUIDs for audit logging.
 * Required because adm_audit_logs has FK constraints to tables
 * (adm_tenants, clt_members, adm_provider_employees) whose primary keys
 * differ from the auth session IDs.
 *
 * Queries match auth_user_id (Better Auth) on provider employees and members.
 *
 * @module lib/utils/audit-resolver
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// -- Types --------------------------------------------------------------------

interface TenantLookupResult {
  id: string;
  name: string;
}

interface MemberLookupResult {
  id: string;
  email: string;
  tenant_id: string;
}

interface EmployeeLookupResult {
  id: string;
  email: string;
}

// -- Resolvers ----------------------------------------------------------------

/**
 * Resolve organization ID to tenant UUID.
 *
 * @param orgId - Organization ID from auth session
 * @returns Tenant record or null
 */
export async function resolveTenantId(
  orgId: string
): Promise<TenantLookupResult | null> {
  try {
    const tenant = await db.adm_tenants.findFirst({
      where: { auth_organization_id: orgId },
      select: { id: true, name: true },
    });

    return tenant;
  } catch (error) {
    logger.error({ error, orgId }, "[resolveTenantId] Error");
    return null;
  }
}

/**
 * Resolve user ID to clt_members UUID.
 * Resolves auth_user_id (Better Auth) to the member record.
 *
 * @param userId - User ID from auth session
 * @param tenantId - Optional tenant UUID to scope the search
 * @returns Member record or null
 */
export async function resolveMemberId(
  userId: string,
  tenantId?: string
): Promise<MemberLookupResult | null> {
  try {
    const member = await db.clt_members.findFirst({
      where: {
        auth_user_id: userId,
        ...(tenantId ? { tenant_id: tenantId } : {}),
        deleted_at: null,
        status: "active",
      },
      select: { id: true, email: true, tenant_id: true },
    });

    return member;
  } catch (error) {
    logger.error({ error, userId }, "[resolveMemberId] Error");
    return null;
  }
}

/**
 * Resolve user ID to adm_provider_employees UUID.
 * Resolves auth_user_id (Better Auth) to the employee record.
 *
 * @param userId - User ID from auth session
 * @returns Employee record or null
 */
export async function resolveEmployeeId(
  userId: string
): Promise<EmployeeLookupResult | null> {
  try {
    const employee = await db.adm_provider_employees.findFirst({
      where: {
        auth_user_id: userId,
        deleted_at: null,
      },
      select: { id: true, email: true },
    });

    return employee;
  } catch (error) {
    logger.error({ error, userId }, "[resolveEmployeeId] Error");
    return null;
  }
}

/**
 * Resolve both tenant and member UUIDs for audit logging.
 *
 * Main function for Server Actions to get IDs for adm_audit_logs.
 *
 * @param orgId - Organization ID from auth session
 * @param userId - User ID from auth session
 * @returns Object with tenantUuid and memberUuid (both may be null)
 */
export async function getAuditLogUuids(
  orgId: string,
  userId: string
): Promise<{ tenantUuid: string | null; memberUuid: string | null }> {
  const [tenant, member] = await Promise.all([
    resolveTenantId(orgId),
    resolveMemberId(userId),
  ]);

  logger.debug(
    {
      orgId: orgId?.substring(0, 15),
      userId: userId?.substring(0, 15),
      tenantUuid: tenant?.id?.substring(0, 15),
      memberUuid: member?.id?.substring(0, 15),
    },
    "[getAuditLogUuids] Lookup result"
  );

  return {
    tenantUuid: tenant?.id || null,
    memberUuid: member?.id || null,
  };
}
