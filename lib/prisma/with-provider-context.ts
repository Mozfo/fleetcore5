/**
 * Prisma Client Extension for PostgreSQL RLS Provider Context
 *
 * Sets `app.current_provider_id` in PostgreSQL before CRM queries
 * to enable Row-Level Security (RLS) filtering by division.
 *
 * Uses transaction wrapping to guarantee same connection for:
 * 1. SET config command
 * 2. Actual query
 *
 * This is critical with connection pooling (Supabase/PgBouncer)
 * where consecutive queries may use different connections.
 *
 * @module lib/prisma/with-provider-context
 * @see https://github.com/prisma/prisma-client-extensions/tree/main/row-level-security
 */

import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentProviderId } from "@/lib/utils/provider-context";

/**
 * CRM tables that require provider_id RLS filtering
 *
 * Only these tables have RLS policies checking app.current_provider_id.
 * Non-CRM tables (adm_*, rid_*, sys_*) are excluded.
 */
const CRM_TABLES_WITH_RLS = [
  "crm_leads",
  "crm_opportunities",
  "crm_quotes",
  "crm_quote_items",
  "crm_orders",
  "crm_agreements",
  "crm_addresses",
  "crm_lead_activities",
  "crm_pipelines",
  "crm_settings",
  "crm_lead_sources",
  "crm_countries",
] as const;

/**
 * Type for extended Prisma Client with provider context
 *
 * Uses the base PrismaClient type since $extends preserves the interface.
 * The extension only modifies query behavior, not the type signature.
 */
export type PrismaClientWithProvider = PrismaClient;

/**
 * Creates a Prisma Client Extension that sets PostgreSQL RLS context
 *
 * For each query on CRM tables, wraps the operation in a transaction:
 * 1. SET LOCAL app.current_provider_id = '<providerId>'
 * 2. Execute the original query
 *
 * This ensures RLS policies see the correct provider_id.
 *
 * @param providerId - Provider UUID or null for global access
 * @returns Prisma extension to use with $extends()
 *
 * @example
 * ```typescript
 * // Basic usage
 * const providerId = await getCurrentProviderId();
 * const extendedPrisma = prisma.$extends(withProviderContext(providerId));
 *
 * // Now all CRM queries will have RLS context set
 * const leads = await extendedPrisma.crm_leads.findMany();
 * ```
 */
export function withProviderContext(providerId: string | null) {
  // Convert null to empty string for PostgreSQL
  // RLS policies use: provider_id = COALESCE(current_setting('app.current_provider_id', true), '')
  // Empty string means global access (matches all rows)
  const providerValue = providerId ?? "";

  return Prisma.defineExtension({
    name: "provider-context-rls",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Skip non-CRM tables - no RLS needed
          if (
            !model ||
            !CRM_TABLES_WITH_RLS.includes(
              model as (typeof CRM_TABLES_WITH_RLS)[number]
            )
          ) {
            return query(args);
          }

          // Skip if already in a transaction (avoid nested transaction issues)
          // The outer transaction should have already set the context
          if ((args as Record<string, unknown>).__inTransaction) {
            return query(args);
          }

          // For read operations, we can use a simple approach
          // For write operations, we need the full transaction
          const isWriteOperation = [
            "create",
            "createMany",
            "update",
            "updateMany",
            "delete",
            "deleteMany",
            "upsert",
          ].includes(operation);

          if (!isWriteOperation && !providerValue) {
            // Global access on read - no need to set context
            return query(args);
          }

          // Use $queryRawUnsafe for SET command, then execute query
          // We use $transaction to ensure same connection
          try {
            // Note: We use set_config() function instead of SET LOCAL
            // because it works better with Prisma's query execution model
            // The third parameter TRUE makes it transaction-local
            const result = await prisma.$transaction(
              async (tx) => {
                // Set the provider context for this transaction
                await tx.$executeRawUnsafe(
                  `SELECT set_config('app.current_provider_id', $1, TRUE)`,
                  providerValue
                );

                // Execute the original query within the same transaction
                // We need to call the model method on tx, not query()
                // because query() would use the original connection
                const modelDelegate = tx[model as keyof typeof tx] as Record<
                  string,
                  unknown
                >;

                if (typeof modelDelegate[operation] === "function") {
                  return (
                    modelDelegate[operation] as (
                      args: unknown
                    ) => Promise<unknown>
                  )(args);
                }

                // Fallback to original query if model method not found
                return query(args);
              },
              {
                // Use READ COMMITTED for better concurrency
                isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
              }
            );

            return result;
          } catch (error) {
            // If transaction fails, log and rethrow
            // Don't swallow errors - RLS failures should be visible
            throw error;
          }
        },
      },
    },
  });
}

/**
 * Get a Prisma client with provider context from current session
 *
 * Convenience function that:
 * 1. Gets current user's provider_id from Clerk session
 * 2. Returns extended Prisma client with RLS context
 *
 * Use this in API routes and Server Actions for automatic
 * multi-division data isolation.
 *
 * @returns Extended Prisma client with provider RLS context
 *
 * @example
 * ```typescript
 * // In an API route or Server Action
 * export async function getLeads() {
 *   const db = await getPrismaWithProvider();
 *
 *   // This query will automatically filter by provider_id
 *   // thanks to PostgreSQL RLS policies
 *   const leads = await db.crm_leads.findMany({
 *     where: { status: "active" },
 *   });
 *
 *   return leads;
 * }
 * ```
 *
 * @example
 * ```typescript
 * // For global access (CEO/admin), provider_id will be null
 * // RLS policies will return all rows
 * const db = await getPrismaWithProvider();
 * const allLeads = await db.crm_leads.findMany();
 * ```
 */
export async function getPrismaWithProvider(): Promise<PrismaClientWithProvider> {
  const providerId = await getCurrentProviderId();
  return prisma.$extends(
    withProviderContext(providerId)
  ) as PrismaClientWithProvider;
}

/**
 * Get a Prisma client with explicit provider context
 *
 * Use this when you need to specify the provider_id explicitly,
 * for example in cron jobs or background tasks that don't have
 * a Clerk session.
 *
 * @param providerId - Provider UUID or null for global access
 * @returns Extended Prisma client with provider RLS context
 *
 * @example
 * ```typescript
 * // In a cron job that processes a specific division
 * const db = getPrismaForProvider("uuid-fleetcore-france");
 * const leads = await db.crm_leads.findMany({ ... });
 * ```
 *
 * @example
 * ```typescript
 * // For global processing (all divisions)
 * const db = getPrismaForProvider(null);
 * const allLeads = await db.crm_leads.findMany({ ... });
 * ```
 */
export function getPrismaForProvider(
  providerId: string | null
): PrismaClientWithProvider {
  return prisma.$extends(
    withProviderContext(providerId)
  ) as PrismaClientWithProvider;
}
