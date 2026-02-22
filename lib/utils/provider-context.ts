/**
 * Provider Context Utilities
 *
 * Provides functions to get the current FleetCore employee's provider_id
 * for multi-division data isolation (FleetCore France, FleetCore UAE, etc.)
 *
 * Business Logic:
 * - FleetCore employees belong to a specific provider (division)
 * - Their provider_id determines which data they can access
 * - NULL provider_id = global access (CEO, admins)
 *
 * Used by:
 * - CRM actions (lead, opportunity, order operations)
 * - Middleware (to set PostgreSQL app.current_provider_id for RLS)
 *
 * @module lib/utils/provider-context
 */

import { getSession } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

/**
 * Provider context result
 */
export interface ProviderContext {
  /** Provider UUID or null for global access */
  providerId: string | null;
  /** Employee UUID */
  employeeId: string | null;
  /** Whether user has global access (CEO/admin) */
  isGlobalAccess: boolean;
}

/**
 * Get current FleetCore employee's provider_id
 *
 * Looks up the authenticated user in adm_provider_employees
 * to determine their division (provider_id).
 *
 * @returns provider_id (division) or null (global access for CEO/admins)
 *
 * @example
 * ```typescript
 * const providerId = await getCurrentProviderId();
 * // providerId = "uuid-fleetcore-fr" -> FleetCore France employee
 * // providerId = "uuid-fleetcore-uae" -> FleetCore UAE employee
 * // providerId = null -> Global access (CEO, admin)
 * ```
 */
export async function getCurrentProviderId(): Promise<string | null> {
  const session = await getSession();

  if (!session) return null;

  const employee = await prisma.adm_provider_employees.findFirst({
    where: {
      auth_user_id: session.userId,
      status: "active",
      deleted_at: null,
    },
    select: { provider_id: true },
  });

  return employee?.provider_id ?? null;
}

/**
 * Get full provider context for current user
 *
 * Returns provider_id, employee_id, and global access flag.
 * Useful when you need more than just the provider_id.
 *
 * @returns Provider context object
 *
 * @example
 * ```typescript
 * const ctx = await getProviderContext();
 * if (ctx.isGlobalAccess) {
 *   // User can see all divisions
 * } else {
 *   // Filter by ctx.providerId
 * }
 * ```
 */
export async function getProviderContext(): Promise<ProviderContext> {
  const session = await getSession();

  if (!session) {
    return {
      providerId: null,
      employeeId: null,
      isGlobalAccess: false,
    };
  }

  const employee = await prisma.adm_provider_employees.findFirst({
    where: {
      auth_user_id: session.userId,
      status: "active",
      deleted_at: null,
    },
    select: {
      id: true,
      provider_id: true,
    },
  });

  if (!employee) {
    return {
      providerId: null,
      employeeId: null,
      isGlobalAccess: false,
    };
  }

  return {
    providerId: employee.provider_id,
    employeeId: employee.id,
    isGlobalAccess: employee.provider_id === null,
  };
}

/**
 * Build Prisma where clause for provider filtering
 *
 * Helper to construct the provider_id filter condition.
 * Returns empty object if providerId is null (global access).
 *
 * @param providerId - Provider UUID or null
 * @returns Prisma where clause fragment
 *
 * @example
 * ```typescript
 * const providerId = await getCurrentProviderId();
 * const lead = await prisma.crm_leads.findFirst({
 *   where: {
 *     id: leadId,
 *     ...buildProviderFilter(providerId),
 *   },
 * });
 * ```
 */
export function buildProviderFilter(
  providerId: string | null
): { provider_id: string } | Record<string, never> {
  if (providerId === null) {
    return {}; // Global access - no filter
  }
  return { provider_id: providerId };
}

/**
 * Build Prisma where clause for HYBRID tables (settings, countries, lead_sources)
 *
 * Hybrid tables have:
 * - System data: is_system = true, provider_id = NULL (visible to all)
 * - Custom data: is_system = false, provider_id = UUID (per division)
 *
 * Access rules:
 * - Regular employee: sees system + their division's custom data
 * - CEO (providerId = null): sees system + ALL custom data
 *
 * @param providerId - Provider UUID or null (CEO/global access)
 * @returns Prisma where clause fragment with OR condition
 *
 * @example
 * ```typescript
 * const providerId = await getCurrentProviderId();
 * const settings = await prisma.crm_settings.findMany({
 *   where: {
 *     ...buildHybridProviderFilter(providerId),
 *     is_active: true,
 *   },
 * });
 * // Returns: system settings + user's division custom settings
 * ```
 */
export function buildHybridProviderFilter(providerId: string | null):
  | {
      OR: Array<{ is_system: true } | { provider_id: string }>;
    }
  | Record<string, never> {
  if (providerId === null) {
    // CEO/global: see everything (no filter needed)
    return {};
  }

  // Regular employee: see system + their division's custom
  return {
    OR: [{ is_system: true }, { provider_id: providerId }],
  };
}
