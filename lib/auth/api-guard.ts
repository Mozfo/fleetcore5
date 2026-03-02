/**
 * API Route Auth Guards
 *
 * Lightweight wrappers for API route handlers.
 * Replaces middleware-injected x-user-id / x-org-id / x-tenant-id headers.
 *
 * Two patterns:
 * - requireCrmApiAuth()    → CRM routes (Pattern A: userId + orgId)
 * - requireTenantApiAuth() → Client routes (Pattern B: userId + tenantId)
 *
 * @module lib/auth/api-guard
 */

import { requireCrmAuth, requireAuth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { UnauthorizedError, ForbiddenError } from "@/lib/core/errors";
import { resolveMemberId } from "@/lib/utils/audit-resolver";

// -- CRM API Guard (Pattern A) -----------------------------------------------

/**
 * Require CRM admin access for API routes.
 *
 * Replaces middleware header injection of x-user-id + x-org-id.
 * Delegates to requireCrmAuth() — same HQ org check, same throws.
 *
 * @returns { userId, orgId } for passing to services
 * @throws {UnauthorizedError} if not authenticated or no org
 * @throws {ForbiddenError} if org is suspended/cancelled
 */
export async function requireCrmApiAuth(): Promise<{
  userId: string;
  orgId: string;
  memberId: string;
}> {
  try {
    const session = await requireCrmAuth();
    const member = await resolveMemberId(session.userId);
    if (!member) {
      throw new UnauthorizedError(
        "Member record not found for authenticated user"
      );
    }
    return {
      userId: session.userId,
      orgId: session.orgId,
      memberId: member.id,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    if (message.includes("suspended") || message.includes("cancelled")) {
      throw new ForbiddenError(message);
    }
    throw new UnauthorizedError(message);
  }
}

// -- Tenant API Guard (Pattern B) ---------------------------------------------

/**
 * Require tenant-scoped access for client API routes.
 *
 * Replaces middleware header injection of x-user-id + x-tenant-id.
 * Resolves tenantId by looking up adm_tenants via the active org.
 *
 * Flow:
 * 1. Get authenticated session (userId + orgId)
 * 2. Lookup tenant by shared-ID pattern (auth_organization.id = adm_tenants.id)
 * 3. Verify tenant is active (not suspended/cancelled)
 *
 * @returns { userId, tenantId } for passing to services
 * @throws {UnauthorizedError} if not authenticated, no org, or no tenant
 * @throws {ForbiddenError} if tenant is suspended or cancelled
 */
export async function requireTenantApiAuth(): Promise<{
  userId: string;
  tenantId: string;
  memberId: string;
}> {
  let session;
  try {
    session = await requireAuth();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : "Authentication failed";
    throw new UnauthorizedError(message);
  }

  if (!session.orgId) {
    throw new UnauthorizedError("No active organization");
  }

  // Lookup tenant + member in parallel
  const [tenant, member] = await Promise.all([
    prisma.adm_tenants.findUnique({
      where: { id: session.orgId },
      select: { id: true, status: true, name: true },
    }),
    resolveMemberId(session.userId),
  ]);

  if (!tenant) {
    throw new UnauthorizedError(
      "Tenant not found. Organization is not registered in the system."
    );
  }

  if (tenant.status === "suspended") {
    throw new ForbiddenError(
      `Access suspended. Organization "${tenant.name}" has been suspended.`
    );
  }

  if (tenant.status === "cancelled") {
    throw new ForbiddenError(
      `Access denied. Organization "${tenant.name}" subscription has been cancelled.`
    );
  }

  if (!member) {
    throw new UnauthorizedError(
      "Member record not found for authenticated user"
    );
  }

  return { userId: session.userId, tenantId: tenant.id, memberId: member.id };
}
