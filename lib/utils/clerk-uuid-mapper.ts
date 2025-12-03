/**
 * Clerk ID to UUID Mapper
 *
 * Utility functions to map Clerk IDs (org/user) to database UUIDs.
 * Required because adm_audit_logs has FK constraints to UUID columns,
 * but Clerk auth returns string IDs like "org_33cBkAws9Wm" and "user_33l30azAaS".
 *
 * @see lib/actions/crm/qualify.actions.ts
 * @see lib/actions/crm/convert.actions.ts
 * @see lib/actions/crm/lead.actions.ts
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface TenantLookupResult {
  id: string;
  name: string;
}

interface MemberLookupResult {
  id: string;
  email: string;
  tenant_id: string;
}

interface ProviderEmployeeLookupResult {
  id: string;
  email: string;
}

/**
 * Look up tenant UUID from Clerk organization ID
 *
 * @param clerkOrgId - Clerk organization ID (e.g., "org_33cBkAws9Wm")
 * @returns Tenant UUID or null if not found
 */
export async function getTenantUuidFromClerkOrgId(
  clerkOrgId: string
): Promise<TenantLookupResult | null> {
  try {
    const tenant = await db.adm_tenants.findFirst({
      where: { clerk_organization_id: clerkOrgId },
      select: { id: true, name: true },
    });

    return tenant;
  } catch (error) {
    logger.error({ error, clerkOrgId }, "[getTenantUuidFromClerkOrgId] Error");
    return null;
  }
}

/**
 * Look up member UUID from Clerk user ID
 *
 * Tries exact match first, then falls back to startsWith match.
 * This handles cases where the full Clerk user ID might not be available.
 *
 * @param clerkUserId - Clerk user ID (e.g., "user_33l30azAaS")
 * @param tenantId - Optional tenant UUID to scope the search
 * @returns Member UUID or null if not found
 */
export async function getMemberUuidFromClerkUserId(
  clerkUserId: string,
  tenantId?: string
): Promise<MemberLookupResult | null> {
  try {
    // First try exact match
    const exactMatch = await db.adm_members.findFirst({
      where: {
        clerk_user_id: clerkUserId,
        ...(tenantId ? { tenant_id: tenantId } : {}),
      },
      select: { id: true, email: true, tenant_id: true },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Fall back to startsWith match if exact match fails
    // This helps when clerk_user_id might have slight variations
    const startsWithMatch = await db.adm_members.findFirst({
      where: {
        clerk_user_id: { startsWith: clerkUserId.substring(0, 20) },
        ...(tenantId ? { tenant_id: tenantId } : {}),
      },
      select: { id: true, email: true, tenant_id: true },
    });

    return startsWithMatch;
  } catch (error) {
    logger.error(
      { error, clerkUserId },
      "[getMemberUuidFromClerkUserId] Error"
    );
    return null;
  }
}

/**
 * Look up provider employee UUID from Clerk user ID
 *
 * Used for tables with FK constraints to adm_provider_employees (like crm_settings).
 *
 * @param clerkUserId - Clerk user ID (e.g., "user_33l30azAaS")
 * @returns Provider employee UUID or null if not found
 */
export async function getProviderEmployeeUuidFromClerkUserId(
  clerkUserId: string
): Promise<ProviderEmployeeLookupResult | null> {
  try {
    // First try exact match
    const exactMatch = await db.adm_provider_employees.findFirst({
      where: {
        clerk_user_id: clerkUserId,
        deleted_at: null,
      },
      select: { id: true, email: true },
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Fall back to startsWith match if exact match fails
    const startsWithMatch = await db.adm_provider_employees.findFirst({
      where: {
        clerk_user_id: { startsWith: clerkUserId.substring(0, 20) },
        deleted_at: null,
      },
      select: { id: true, email: true },
    });

    return startsWithMatch;
  } catch (error) {
    logger.error(
      { error, clerkUserId },
      "[getProviderEmployeeUuidFromClerkUserId] Error"
    );
    return null;
  }
}

/**
 * Get both tenant and member UUIDs for audit logging
 *
 * This is the main function to use in Server Actions for audit log creation.
 * Returns UUIDs suitable for adm_audit_logs.tenant_id and member_id columns.
 *
 * @param clerkOrgId - Clerk organization ID from auth()
 * @param clerkUserId - Clerk user ID from auth()
 * @returns Object with tenantUuid and memberUuid (both may be null if not found)
 */
export async function getAuditLogUuids(
  clerkOrgId: string,
  clerkUserId: string
): Promise<{ tenantUuid: string | null; memberUuid: string | null }> {
  // Parallel lookups for efficiency
  const [tenant, member] = await Promise.all([
    getTenantUuidFromClerkOrgId(clerkOrgId),
    getMemberUuidFromClerkUserId(clerkUserId),
  ]);

  logger.debug(
    {
      clerkOrgId: clerkOrgId?.substring(0, 15),
      clerkUserId: clerkUserId?.substring(0, 15),
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
