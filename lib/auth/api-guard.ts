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
}> {
  try {
    const session = await requireCrmAuth();
    return { userId: session.userId, orgId: session.orgId };
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
 * 2. Lookup tenant by clerk_organization_id (column reused during transition)
 * 3. Verify tenant is active (not suspended/cancelled)
 *
 * @returns { userId, tenantId } for passing to services
 * @throws {UnauthorizedError} if not authenticated, no org, or no tenant
 * @throws {ForbiddenError} if tenant is suspended or cancelled
 */
export async function requireTenantApiAuth(): Promise<{
  userId: string;
  tenantId: string;
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

  // Lookup tenant by org ID (clerk_organization_id reused for Better Auth org IDs)
  const tenant = await prisma.adm_tenants.findUnique({
    where: { clerk_organization_id: session.orgId },
    select: { id: true, status: true, name: true },
  });

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

  return { userId: session.userId, tenantId: tenant.id };
}
