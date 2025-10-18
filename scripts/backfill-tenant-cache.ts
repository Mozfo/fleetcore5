/**
 * Backfill Vercel KV cache with existing tenant mappings
 *
 * Usage:
 *   pnpm tsx scripts/backfill-tenant-cache.ts
 *
 * This script should be run ONCE after deploying the KV solution
 * to warm the cache with existing organizations.
 */

import { prisma } from "@/lib/prisma";
import { setTenantIdInCache } from "@/lib/cache/tenant-mapping";

async function backfillTenantCache() {
  console.log("= Starting tenant cache backfill...\n");

  try {
    // Fetch all tenants with Clerk organization IDs
    const tenants = await prisma.adm_tenants.findMany({
      where: {
        clerk_organization_id: { not: null },
        deleted_at: null,
      },
      select: {
        id: true,
        clerk_organization_id: true,
        name: true,
      },
    });

    console.log(`Found ${tenants.length} tenants to backfill\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const tenant of tenants) {
      if (tenant.clerk_organization_id) {
        try {
          await setTenantIdInCache(tenant.clerk_organization_id, tenant.id);
          console.log(
            ` ${tenant.name}: ${tenant.clerk_organization_id} � ${tenant.id}`
          );
          successCount++;
        } catch (error) {
          console.error(
            `L Failed to cache ${tenant.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
          errorCount++;
        }
      }
    }

    console.log(
      `\n=� Backfill complete: ${successCount} success, ${errorCount} errors`
    );

    if (errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("L Backfill failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void backfillTenantCache();
