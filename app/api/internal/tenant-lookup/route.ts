/**
 * Internal API: Tenant Lookup by Clerk Org ID
 *
 * Security: Protected by x-internal-auth header
 * Runtime: Node.js (Prisma requires Node.js)
 *
 * Used by:
 * - Middleware (Edge) when KV cache misses
 * - Webhook for proactive cache warming
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setTenantIdInCache } from "@/lib/cache/tenant-mapping";
import { logger } from "@/lib/logger";

export const runtime = "nodejs"; // Prisma requires Node.js

/**
 * Verify internal API authentication
 */
function verifyInternalAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("x-internal-auth");
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey) {
    logger.error("INTERNAL_API_KEY not configured");
    return false;
  }

  return authHeader === expectedKey;
}

export async function GET(req: NextRequest) {
  // 1. Verify authentication
  if (!verifyInternalAuth(req)) {
    logger.warn("Unauthorized access to internal tenant lookup API");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract orgId
  const orgId = req.nextUrl.searchParams.get("orgId");

  if (!orgId) {
    return NextResponse.json(
      { error: "Missing orgId parameter" },
      { status: 400 }
    );
  }

  // 3. Lookup tenant in database
  try {
    const tenant = await prisma.adm_tenants.findUnique({
      where: { clerk_organization_id: orgId },
      select: { id: true },
    });

    if (!tenant) {
      logger.warn({ orgId }, "Tenant not found for Clerk organization");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // 4. Warm cache for next request
    await setTenantIdInCache(orgId, tenant.id);

    logger.info(
      { orgId, tenantId: tenant.id },
      "Tenant lookup successful (cache warmed)"
    );

    return NextResponse.json({ tenantId: tenant.id });
  } catch (error) {
    logger.error({ orgId, error }, "Database lookup failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
