/**
 * Tenant Routing Server Helper
 *
 * Resolves tenant_id from a country_code using adm_tenant_countries mapping.
 * - Operational countries → mapped tenant (via adm_tenant_countries)
 * - Non-operational countries → expansion tenant (fallback)
 *
 * Usage (server-side only):
 *   import { resolveTenantByCountry } from "@/lib/helpers/tenant-routing.server";
 *   const tenantId = await resolveTenantByCountry("AE");
 *
 * @module lib/helpers/tenant-routing.server
 */

import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ── Cache ────────────────────────────────────────────────────────────────

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const countryCache = new Map<string, { tenantId: string; cachedAt: number }>();
let expansionTenantId: string | null = null;
let expansionCachedAt = 0;

// ── Internal ─────────────────────────────────────────────────────────────

async function getExpansionTenantId(): Promise<string> {
  const now = Date.now();

  if (expansionTenantId && now - expansionCachedAt < CACHE_TTL_MS) {
    return expansionTenantId;
  }

  const tenant = await db.adm_tenants.findFirst({
    where: { tenant_type: "expansion", deleted_at: null },
    select: { id: true },
  });

  if (!tenant) {
    throw new Error(
      "[tenant-routing] No expansion tenant found in adm_tenants. " +
        "Create a tenant with tenant_type = 'expansion'."
    );
  }

  expansionTenantId = tenant.id;
  expansionCachedAt = now;
  return tenant.id;
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Resolves the tenant_id that should manage a lead based on its country.
 *
 * 1. Looks up country_code in adm_tenant_countries
 * 2. If found → returns the mapped tenant_id
 * 3. If not found → returns the expansion tenant_id (fallback)
 *
 * Results are cached in memory for 5 minutes per country.
 */
export async function resolveTenantByCountry(
  countryCode: string
): Promise<string> {
  const normalized = countryCode.toUpperCase().trim();
  const now = Date.now();

  // Check cache
  const cached = countryCache.get(normalized);
  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.tenantId;
  }

  try {
    // Lookup in adm_tenant_countries
    const mapping = await db.adm_tenant_countries.findUnique({
      where: { country_code: normalized },
      select: { tenant_id: true },
    });

    if (mapping) {
      countryCache.set(normalized, {
        tenantId: mapping.tenant_id,
        cachedAt: now,
      });
      return mapping.tenant_id;
    }

    // No mapping → fallback to expansion tenant
    const fallbackId = await getExpansionTenantId();

    logger.info(
      { countryCode: normalized, expansionTenantId: fallbackId },
      "[tenant-routing] Country not mapped, routing to expansion tenant"
    );

    countryCache.set(normalized, { tenantId: fallbackId, cachedAt: now });
    return fallbackId;
  } catch (error) {
    logger.error(
      { error, countryCode: normalized },
      "[tenant-routing] Failed to resolve tenant, falling back to expansion"
    );

    // Last resort: try expansion tenant even if the main query failed
    const fallbackId = await getExpansionTenantId();
    return fallbackId;
  }
}
