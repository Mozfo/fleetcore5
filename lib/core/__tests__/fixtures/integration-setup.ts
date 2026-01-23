/**
 * Integration Tests Setup - Prisma with SQLite
 *
 * Best practices from Prisma docs 2025:
 * - Use dependency injection pattern for PrismaClient
 * - Import types from custom output path for type safety
 * - Reset database between tests for isolation
 * - Use Prisma Client directly (no raw SQL)
 *
 * This file runs BEFORE all integration tests via vitest.config.integration.ts
 *
 * Flow:
 * 1. Create PrismaClient pointing to SQLite test database
 * 2. Run migrations (prisma db push)
 * 3. Seed minimal test data
 * 4. Export client for dependency injection into services
 */

import { execSync } from "child_process";
import { beforeAll, afterAll, beforeEach } from "vitest";

// Import types from the INTEGRATION client (not main @prisma/client)
// This is the recommended pattern for multiple Prisma clients with custom output
type PrismaClientIntegration =
  import("../../../../node_modules/.prisma/client-integration/index").PrismaClient;

// Prisma client for integration tests (dependency injection pattern)
let testPrisma: PrismaClientIntegration | null = null;

/**
 * Initialize Prisma with SQLite test database
 */
export async function setupIntegrationDatabase(): Promise<void> {
  // Step 1: Delete old database file if exists
  try {
    execSync("rm -f ./test-integration.db ./test-integration.db-journal", {
      stdio: "pipe",
    });
  } catch (_error) {
    // Ignore error if file doesn't exist
  }

  // Step 2: Generate Prisma Client for SQLite schema
  try {
    execSync(
      "pnpm exec prisma generate --schema=prisma/schema.integration.prisma",
      {
        stdio: "pipe",
      }
    );
  } catch (error) {
    throw new Error(`Failed to generate Prisma Client: ${error}`);
  }

  // Step 3: Push schema to SQLite (creates tables)
  try {
    execSync(
      "pnpm exec prisma db push --skip-generate --accept-data-loss --schema=prisma/schema.integration.prisma",
      {
        stdio: "pipe",
        env: { ...process.env, DATABASE_URL: "file:./test-integration.db" },
      }
    );
  } catch (error) {
    throw new Error(`Failed to push schema: ${error}`);
  }

  // Step 4: Disconnect old client if exists
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }

  // Step 5: Create fresh PrismaClient instance for tests
  // Import from custom output path (best practice for multiple clients)
  const clientPath =
    "../../../../node_modules/.prisma/client-integration/index.js";
  delete require.cache[require.resolve(clientPath)];

  const { PrismaClient } = await import(
    `${clientPath}?cacheBust=${Date.now()}`
  );

  testPrisma = new PrismaClient({
    datasources: {
      db: {
        url: "file:./test-integration.db",
      },
    },
  });

  if (!testPrisma) {
    throw new Error("Prisma client not initialized");
  }
  await testPrisma.$connect();

  // Step 6: Seed minimal test data
  await seedTestData();
}

/**
 * Seed minimal test data
 */
async function seedTestData(): Promise<void> {
  if (!testPrisma) return;

  // Use upsert to avoid unique constraint errors
  // Type-safe calls using the integration client types
  await testPrisma.adm_tenants.upsert({
    where: { id: TEST_DATA.ACTIVE_TENANT_ID },
    update: {},
    create: {
      id: TEST_DATA.ACTIVE_TENANT_ID,
      name: "Test Active Tenant",
      status: "active",
      clerk_organization_id: "org_test_active",
    },
  });

  await testPrisma.adm_tenants.upsert({
    where: { id: TEST_DATA.SUSPENDED_TENANT_ID },
    update: {},
    create: {
      id: TEST_DATA.SUSPENDED_TENANT_ID,
      name: "Test Suspended Tenant",
      status: "suspended",
    },
  });

  await testPrisma.clt_members.upsert({
    where: { id: TEST_DATA.MEMBER_ID },
    update: {},
    create: {
      id: TEST_DATA.MEMBER_ID,
      tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
      email: "test@example.com",
      clerk_user_id: "user_test123",
    },
  });

  // Phase 0.3: Seed role for ClerkSync tests
  await testPrisma.adm_roles.upsert({
    where: { id: TEST_DATA.ROLE_ID },
    update: {},
    create: {
      id: TEST_DATA.ROLE_ID,
      tenant_id: TEST_DATA.ACTIVE_TENANT_ID,
      slug: "member",
      name: "Member",
    },
  });
}

/**
 * Reset database between tests for isolation
 */
export async function resetDatabase(): Promise<void> {
  if (!testPrisma) return;

  // Delete all data in reverse order of dependencies
  // Type-safe calls using the integration client
  await testPrisma.adm_audit_logs.deleteMany();
  await testPrisma.flt_drivers.deleteMany();
  await testPrisma.adm_member_roles.deleteMany();
  await testPrisma.adm_invitations.deleteMany();
  await testPrisma.clt_members.deleteMany();
  await testPrisma.adm_roles.deleteMany();
  await testPrisma.adm_tenant_lifecycle_events.deleteMany();
  await testPrisma.adm_tenants.deleteMany();

  // Re-seed minimal test data
  await seedTestData();
}

/**
 * Cleanup database after all tests
 */
export async function teardownIntegrationDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * Get Prisma client for integration tests (dependency injection pattern)
 *
 * Returns the SQLite integration client with full type safety
 */
export function getTestPrisma(): PrismaClientIntegration {
  if (!testPrisma) {
    throw new Error(
      "Test Prisma not initialized. Call setupIntegrationDatabase() first."
    );
  }
  return testPrisma;
}

// Test data IDs (defined before setup for use in seeding)
export const TEST_DATA = {
  ACTIVE_TENANT_ID: "test-tenant-active-001",
  SUSPENDED_TENANT_ID: "test-tenant-suspended-002",
  MEMBER_ID: "test-member-001",
  ROLE_ID: "test-role-member-001",
};

// Vitest hooks: Run setup/teardown globally
beforeAll(async () => {
  await setupIntegrationDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await teardownIntegrationDatabase();
});
