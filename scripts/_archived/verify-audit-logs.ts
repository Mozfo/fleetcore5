import "dotenv/config";
import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🔍 Searching for validation_failed audit logs...\n");

  // Test connection first
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully\n");
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("   Check DATABASE_URL and DIRECT_URL in .env.local");
    throw error;
  }

  const logs = await prisma.adm_audit_logs.findMany({
    where: { action: "validation_failed" },
    orderBy: { timestamp: "desc" },
    take: 3,
  });

  console.log(`📊 Audit Logs Found: ${logs.length}\n`);

  if (logs.length === 0) {
    console.log("⚠️  NO LOGS FOUND");
    console.log("\nPossible reasons:");
    console.log(
      "  1. Tests haven't been run yet (run: pnpm tsx scripts/test-validation-sortby.ts)"
    );
    console.log(
      "  2. Audit logs were created in dev environment, not production"
    );
    console.log("  3. RLS (Row Level Security) is blocking the query");
    console.log("\nTo create test logs, run:");
    console.log("  pnpm tsx test-real-tenant.ts");
    process.exit(0);
  }

  logs.forEach((log, i) => {
    console.log(`${"═".repeat(50)}`);
    console.log(`LOG ${i + 1}/${logs.length}`);
    console.log(`${"═".repeat(50)}`);
    console.log("Action:", log.action);
    console.log("Entity:", log.entity);
    console.log("Entity ID:", log.entity_id);
    console.log("Tenant ID:", log.tenant_id);
    console.log("Timestamp:", log.timestamp);
    console.log("\nChanges JSONB:");
    console.log(JSON.stringify(log.changes, null, 2));
    console.log("\n");
  });

  console.log("✅ VERIFICATION COMPLETE\n");
}

main()
  .catch((error) => {
    console.error("❌ ERROR:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
