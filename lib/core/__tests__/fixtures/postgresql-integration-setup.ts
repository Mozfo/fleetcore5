/**
 * PostgreSQL Integration Tests Setup - Testcontainers
 *
 * Best practices from Prisma + Testcontainers 2025:
 * - Use real PostgreSQL via Docker containers (production parity)
 * - One container per test file for strong isolation
 * - Snapshot clean DB state for fast test resets
 * - Automatic container lifecycle management
 *
 * Pattern: Singleton container manager + dependency injection
 *
 * Note: These tests require Docker to be running and properly configured.
 * Tests will be skipped if Docker is not available.
 */

import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

/**
 * Check if Docker is available and properly configured for testcontainers.
 * Returns true if Docker is available, false otherwise.
 */
export function isDockerAvailable(): boolean {
  try {
    // Check if docker command exists and daemon is running
    execSync("docker info", { stdio: "pipe", timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Error thrown when Docker is not available
 */
export class DockerNotAvailableError extends Error {
  constructor() {
    super(
      "Docker is not available. PostgreSQL integration tests require Docker to be running."
    );
    this.name = "DockerNotAvailableError";
  }
}
import {
  beforeAll as _beforeAll,
  afterAll as _afterAll,
  beforeEach as _beforeEach,
} from "vitest";
import {
  SYSTEM_USER_ID,
  SYSTEM_TENANT_ID,
  SYSTEM_PROVIDER_EMPLOYEE_ID,
} from "@/lib/constants/system";

/**
 * PostgreSQL Container Manager (Singleton)
 *
 * Manages lifecycle of PostgreSQL Docker container for integration tests.
 * One container per test file provides strong isolation.
 */
export class PostgresContainerManager {
  private static instance: PostgresContainerManager | null = null;
  private container: StartedPostgreSqlContainer | null = null;
  private prismaClient: PrismaClient | null = null;
  private isInitialized = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PostgresContainerManager {
    if (!PostgresContainerManager.instance) {
      PostgresContainerManager.instance = new PostgresContainerManager();
    }
    return PostgresContainerManager.instance;
  }

  /**
   * Initialize PostgreSQL container and apply migrations
   *
   * Called once per test file in beforeAll()
   * @throws {DockerNotAvailableError} If Docker is not available
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return; // Already initialized
    }

    // Check if Docker is available before attempting to start container
    if (!isDockerAvailable()) {
      throw new DockerNotAvailableError();
    }

    // Start PostgreSQL container (auto-pulls image if needed)
    this.container = await new PostgreSqlContainer("postgres:16-alpine")
      .withDatabase("test_db")
      .withUsername("test_user")
      .withPassword("test_password")
      .start();

    // Get connection URL
    const databaseUrl = this.getDatabaseUrl();

    // Create temporary PrismaClient to enable extensions
    const tempPrisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });
    await tempPrisma.$connect();

    // Enable PostgreSQL extensions required by Prisma schema
    await tempPrisma.$executeRawUnsafe(
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    );
    await tempPrisma.$executeRawUnsafe(
      'CREATE EXTENSION IF NOT EXISTS "citext";'
    );
    await tempPrisma.$disconnect();

    // Apply Prisma migrations
    execSync(
      "pnpm exec prisma db push --schema=prisma/schema.prisma --skip-generate --accept-data-loss",
      {
        env: {
          ...process.env,
          DATABASE_URL: databaseUrl, // Override pooled connection
          DIRECT_URL: databaseUrl, // Override direct connection (required for migrations)
        },
        stdio: "inherit", // Show output for debugging
      }
    );

    // Create PrismaClient connected to container
    this.prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    });

    await this.prismaClient.$connect();

    this.isInitialized = true;
  }

  /**
   * Get database connection URL for container
   */
  getDatabaseUrl(): string {
    if (!this.container) {
      throw new Error("Container not started. Call initialize() first.");
    }

    return `postgresql://test_user:test_password@${this.container.getHost()}:${this.container.getPort()}/test_db`;
  }

  /**
   * Get PrismaClient instance for tests (dependency injection)
   */
  getPrismaClient(): PrismaClient {
    if (!this.prismaClient) {
      throw new Error(
        "Prisma client not initialized. Call initialize() first."
      );
    }
    return this.prismaClient;
  }

  /**
   * Reset database between tests
   *
   * Truncates all tables to start with clean slate.
   * Called in beforeEach()
   */
  async resetDatabase(): Promise<void> {
    if (!this.prismaClient) return;

    // Truncate all tables using raw SQL (faster and works without regenerating Prisma Client)
    // Phase 0.3 tables
    await this.prismaClient.$executeRaw`TRUNCATE TABLE adm_audit_logs CASCADE`;
    await this.prismaClient
      .$executeRaw`TRUNCATE TABLE adm_tenant_lifecycle_events CASCADE`;
    await this.prismaClient
      .$executeRaw`TRUNCATE TABLE adm_member_roles CASCADE`;
    await this.prismaClient.$executeRaw`TRUNCATE TABLE adm_invitations CASCADE`;
    await this.prismaClient.$executeRaw`TRUNCATE TABLE adm_roles CASCADE`;

    // Core admin tables
    await this.prismaClient.$executeRaw`TRUNCATE TABLE clt_members CASCADE`;
    await this.prismaClient.$executeRaw`TRUNCATE TABLE adm_tenants CASCADE`;

    // Seed minimal test data
    await this.seedTestData();
  }

  /**
   * Seed minimal test data using raw SQL with UUID casting
   */
  private async seedTestData(): Promise<void> {
    if (!this.prismaClient) return;

    // Create SYSTEM tenant (required for SYSTEM_USER foreign key)
    await this.prismaClient.$executeRaw`
      INSERT INTO adm_tenants (id, name, country_code, status, auth_organization_id)
      VALUES (${SYSTEM_TENANT_ID}::uuid, 'System', 'FR', 'active', ${SYSTEM_TENANT_ID}::uuid)
    `;

    // Create SYSTEM user (used for all automated operations - audit trail best practice)
    await this.prismaClient.$executeRaw`
      INSERT INTO clt_members (id, tenant_id, email, auth_user_id, phone)
      VALUES (${SYSTEM_USER_ID}::uuid, ${SYSTEM_TENANT_ID}::uuid, 'system@fleetcore.internal', ${SYSTEM_USER_ID}::uuid, '+33000000000')
    `;

    // Create SYSTEM provider employee (used for tenant lifecycle events)
    await this.prismaClient.$executeRaw`
      INSERT INTO clt_members (id, auth_user_id, first_name, last_name, email, status)
      VALUES (${SYSTEM_PROVIDER_EMPLOYEE_ID}::uuid, ${SYSTEM_PROVIDER_EMPLOYEE_ID}::uuid, 'System', NULL, 'system@fleetcore.internal', 'active')
    `;

    // Create test tenant
    await this.prismaClient.$executeRaw`
      INSERT INTO adm_tenants (id, name, country_code, status, auth_organization_id)
      VALUES (${TEST_DATA.ACTIVE_TENANT_ID}::uuid, 'Test Active Tenant', 'FR', 'active', ${TEST_DATA.ACTIVE_TENANT_ID}::uuid)
    `;

    // Create test provider employee (required for sent_by in invitations)
    await this.prismaClient.$executeRaw`
      INSERT INTO clt_members (id, auth_user_id, first_name, last_name, email, status)
      VALUES (${TEST_DATA.PROVIDER_EMPLOYEE_ID}::uuid, ${TEST_DATA.PROVIDER_EMPLOYEE_ID}::uuid, 'Test', 'Admin', 'admin@fleetcore.com', 'active')
    `;

    // Create test member
    await this.prismaClient.$executeRaw`
      INSERT INTO clt_members (id, tenant_id, email, auth_user_id, phone)
      VALUES (${TEST_DATA.MEMBER_ID}::uuid, ${TEST_DATA.ACTIVE_TENANT_ID}::uuid, 'test@example.com', ${TEST_DATA.MEMBER_ID}::uuid, '+33612345678')
    `;

    // Create test role
    await this.prismaClient.$executeRaw`
      INSERT INTO adm_roles (id, tenant_id, slug, name)
      VALUES (${TEST_DATA.ROLE_ID}::uuid, ${TEST_DATA.ACTIVE_TENANT_ID}::uuid, 'member', 'Member')
    `;
  }

  /**
   * Teardown container after all tests
   *
   * Called in afterAll()
   */
  async teardown(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }

    this.isInitialized = false;
    PostgresContainerManager.instance = null;
  }
}

// Test data IDs (valid UUIDs for PostgreSQL)
// Note: ...-0000 and ...-0001 are reserved for SYSTEM_TENANT and SYSTEM_USER
export const TEST_DATA = {
  ACTIVE_TENANT_ID: "00000000-0000-0000-0000-000000000010",
  MEMBER_ID: "00000000-0000-0000-0000-000000000011",
  ROLE_ID: "00000000-0000-0000-0000-000000000012",
  PROVIDER_EMPLOYEE_ID: "00000000-0000-0000-0000-000000000013",
  // Entity IDs for audit logs (valid UUIDs)
  LEAD_ID_1: "00000000-0000-0000-0000-000000000021",
  LEAD_ID_2: "00000000-0000-0000-0000-000000000022",
  OPPORTUNITY_ID_1: "00000000-0000-0000-0000-000000000031",
};

/**
 * Get container manager instance for test setup
 */
export function getContainerManager(): PostgresContainerManager {
  return PostgresContainerManager.getInstance();
}

/**
 * Get PrismaClient for tests (dependency injection)
 */
export function getTestPrisma(): PrismaClient {
  return PostgresContainerManager.getInstance().getPrismaClient();
}
