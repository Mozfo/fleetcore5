/**
 * Authentication Middleware — Better Auth Integration
 *
 * Provides authentication verification for API routes.
 * Validates session via Better Auth and resolves tenant.
 *
 * Key features:
 * - Gets session from Better Auth (cookie-based)
 * - Verifies tenant exists and is active (not suspended)
 * - Returns userId + tenantId for downstream use
 *
 * @module lib/middleware/auth.middleware
 */

import type { NextRequest } from "next/server";
import { UnauthorizedError } from "@/lib/core/errors";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * Authentication result with user and tenant information
 */
export interface AuthResult {
  userId: string;
  tenantId: string;
}

/**
 * Require authentication middleware
 *
 * Validates Better Auth session and resolves tenant.
 * Delegates to requireTenantApiAuth() for session + tenant lookup.
 *
 * @param _req - Next.js request object (kept for API compatibility)
 * @returns Authentication result with userId and tenantId
 *
 * @throws {UnauthorizedError} If not authenticated or tenant not found
 * @throws {ForbiddenError} If tenant is suspended or cancelled
 *
 * @example
 * export async function POST(req: NextRequest) {
 *   const { userId, tenantId } = await requireAuth(req);
 *   const data = await validate(Schema, await req.json());
 *   const result = await service.create(data, tenantId, userId);
 *   return NextResponse.json(result);
 * }
 */
export async function requireAuth(_req: NextRequest): Promise<AuthResult> {
  // requireTenantApiAuth() already throws UnauthorizedError/ForbiddenError
  return await requireTenantApiAuth();
}

/**
 * Get current authenticated user from request
 *
 * @deprecated Use requireAuth() or requireTenantApiAuth() instead.
 * Kept for backward compatibility with existing consumers.
 */
export function getCurrentUser(req: NextRequest): {
  userId: string;
  tenantId: string;
} {
  const userId = req.headers.get("x-user-id");
  const tenantId = req.headers.get("x-tenant-id");

  if (!userId || !tenantId) {
    throw new UnauthorizedError(
      "Authentication context missing. requireAuth() must be called first."
    );
  }

  return { userId, tenantId };
}
