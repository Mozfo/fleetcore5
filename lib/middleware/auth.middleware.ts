/**
 * Authentication Middleware - Clerk Integration
 *
 * Provides authentication verification for Next.js 15 App Router API routes.
 * Integrates with Clerk for user authentication and tenant validation.
 *
 * Key features:
 * - Extracts and validates Clerk JWT token
 * - Verifies tenant exists and is active (not suspended)
 * - Injects user/tenant info into request headers for downstream middleware
 * - Returns appropriate HTTP errors (401 Unauthorized, 403 Forbidden)
 *
 * @module lib/middleware/auth.middleware
 */

import { auth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { UnauthorizedError, ForbiddenError } from "@/lib/core/errors";
import { prisma } from "@/lib/prisma";

/**
 * Authentication result with user and tenant information
 */
export interface AuthResult {
  userId: string;
  tenantId: string;
  headers: Headers;
}

/**
 * Require authentication middleware
 *
 * Verifies Clerk authentication token and validates tenant access.
 * This middleware should be called FIRST in the middleware chain.
 *
 * Flow:
 * 1. Extract userId and orgId from Clerk JWT
 * 2. Validate user is authenticated (has userId)
 * 3. Validate user belongs to an organization (has orgId)
 * 4. Query database to find tenant by clerk_organization_id
 * 5. Verify tenant exists and is not suspended
 * 6. Return headers with x-user-id and x-tenant-id for downstream use
 *
 * @param req - Next.js request object
 * @returns Authentication result with userId, tenantId, and modified headers
 *
 * @throws {UnauthorizedError} If token is missing, invalid, or tenant not found
 * @throws {ForbiddenError} If tenant is suspended
 *
 * @example
 * // In API route handler
 * export async function POST(req: NextRequest) {
 *   const { userId, tenantId } = await requireAuth(req);
 *
 *   // Now you have authenticated user and tenant
 *   const data = await validate(LeadCreateSchema, await req.json());
 *   const lead = await leadService.create(data, tenantId, userId);
 *
 *   return NextResponse.json(lead);
 * }
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  // Extract Clerk authentication from request
  const { userId, orgId } = await auth();

  // Validate user is authenticated
  if (!userId) {
    throw new UnauthorizedError(
      "Authentication required. Please log in to access this resource."
    );
  }

  // Validate user belongs to an organization (multi-tenant requirement)
  if (!orgId) {
    throw new UnauthorizedError(
      "Organization membership required. Please select an organization or contact support."
    );
  }

  // Query database to find tenant by Clerk organization ID
  const tenant = await prisma.adm_tenants.findUnique({
    where: {
      clerk_organization_id: orgId,
    },
    select: {
      id: true,
      status: true,
      name: true,
    },
  });

  // Validate tenant exists
  if (!tenant) {
    throw new UnauthorizedError(
      "Tenant not found. This organization is not registered in the system. Please contact support."
    );
  }

  // Validate tenant is not suspended
  if (tenant.status === "suspended") {
    throw new ForbiddenError(
      `Access suspended. The organization "${tenant.name}" has been suspended. Please contact billing or support.`
    );
  }

  // Validate tenant is not cancelled
  if (tenant.status === "cancelled") {
    throw new ForbiddenError(
      `Access denied. The organization "${tenant.name}" subscription has been cancelled. Please contact support to reactivate.`
    );
  }

  // Create modified headers with authentication context
  const headers = new Headers(req.headers);
  headers.set("x-user-id", userId);
  headers.set("x-tenant-id", tenant.id);

  // Return authentication result
  return {
    userId,
    tenantId: tenant.id,
    headers,
  };
}

/**
 * Get current authenticated user from request
 *
 * Helper function to extract userId and tenantId from request headers
 * injected by requireAuth() middleware.
 *
 * @param req - Next.js request object (must have been processed by requireAuth)
 * @returns Object with userId and tenantId
 *
 * @throws {UnauthorizedError} If headers are missing (requireAuth not called)
 *
 * @example
 * // After requireAuth has been called
 * const { userId, tenantId } = getCurrentUser(req);
 */
export function getCurrentUser(req: NextRequest): {
  userId: string;
  tenantId: string;
} {
  const userId = req.headers.get("x-user-id");
  const tenantId = req.headers.get("x-tenant-id");

  if (!userId || !tenantId) {
    throw new UnauthorizedError(
      "Authentication context missing. requireAuth() middleware must be called first."
    );
  }

  return { userId, tenantId };
}
