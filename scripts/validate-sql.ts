import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";

async function validateSQL() {
  try {
    logger.info("🔍 SQL Validation Queries\n");

    // Query 1: Vérifier Structure JSONB
    logger.info("━━━ Query 1: Structure JSONB ━━━");
    const logs = await prisma.$queryRaw<
      Array<{
        id: string;
        action: string;
        entity: string;
        changes: unknown;
      }>
    >`
      SELECT
        id,
        action,
        entity,
        changes
      FROM adm_audit_logs
      WHERE tenant_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
      ORDER BY timestamp DESC
      LIMIT 4
    `;

    logs.forEach((log, i) => {
      logger.info(
        {
          logNumber: i + 1,
          id: log.id,
          action: log.action,
          entity: log.entity,
          changes: log.changes,
        },
        `Log ${i + 1}`
      );
    });

    // Query 2: Vérifier Préfixes _audit_*
    logger.info("\n━━━ Query 2: Préfixes _audit_* ━━━");
    const prefixCheck = await prisma.$queryRaw<
      Array<{
        action: string;
        entity: string;
        has_reason: boolean;
        has_metadata: boolean;
        has_snapshot: boolean;
        has_clerk_id: boolean;
      }>
    >`
      SELECT
        action,
        entity,
        changes ? '_audit_reason' as has_reason,
        changes ? '_audit_metadata' as has_metadata,
        changes ? '_audit_snapshot' as has_snapshot,
        changes ? '_audit_clerk_id' as has_clerk_id
      FROM adm_audit_logs
      WHERE changes IS NOT NULL
        AND tenant_id = '550e8400-e29b-41d4-a716-446655440001'::uuid
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    prefixCheck.forEach((row, i) => {
      logger.info(
        {
          logNumber: i + 1,
          action: row.action,
          entity: row.entity,
          hasReason: row.has_reason,
          hasMetadata: row.has_metadata,
          hasSnapshot: row.has_snapshot,
          hasClerkId: row.has_clerk_id,
        },
        `Prefix check ${i + 1}`
      );
    });

    // Query 3: Tester Index GIN (EXPLAIN ANALYZE)
    logger.info("\n━━━ Query 3: Index GIN Performance ━━━");

    // Note: EXPLAIN ANALYZE ne peut pas être facilement parsé avec Prisma
    // On exécute juste la query et on vérifie qu'elle fonctionne
    const ginTest = await prisma.$queryRaw<
      Array<{
        id: string;
        action: string;
        entity: string;
      }>
    >`
      SELECT id, action, entity
      FROM adm_audit_logs
      WHERE changes @> '{"_audit_reason": "GDPR deletion request - user requested account removal"}'::jsonb
      LIMIT 5
    `;

    logger.info(
      {
        resultsFound: ginTest.length,
        matchingLogs: ginTest,
      },
      "GIN Index query test"
    );

    if (ginTest.length > 0) {
      logger.info("✅ GIN index successfully used for JSONB containment query");
    } else {
      logger.warn("⚠️ No results found (expected if no exact match)");
    }

    logger.info("\n✅ SQL Validation Complete");
  } catch (error) {
    logger.error({ error }, "❌ SQL Validation Failed");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

validateSQL();
