/**
 * Batch 3 Staging Tests - FleetCore API
 * Tests fonctionnels automatisés des 8 routes migrées en Batch 3
 * Date: 17 octobre 2025
 *
 * Usage: pnpm run test:batch3
 * With verbose logging: pnpm run test:batch3:verbose
 */

import { logger } from "../lib/logger";
import { writeFile } from "fs/promises";
import {
  createClerkTestAuth,
  cleanupClerkTestAuth,
  type ClerkTestAuth,
} from "@/lib/testing/clerk-test-auth";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const NONEXISTENT_UUID = "00000000-0000-0000-0000-000000000000";

// Global auth credentials (created once, reused for all tests)
let globalAuth: ClerkTestAuth | null = null;

interface TestResult {
  route: string;
  test: string;
  passed: boolean;
  statusCode: number;
  duration: number;
  error?: string;
  response?: unknown;
}

const results: TestResult[] = [];

async function testRoute(
  method: string,
  path: string,
  testName: string,
  expectedStatus: number,
  options: {
    body?: unknown;
    headers?: Record<string, string>;
    validateResponse?: (data: unknown) => boolean;
    skipAuth?: boolean; // For testing 401 responses
  } = {}
): Promise<TestResult> {
  const startTime = Date.now();
  const fullUrl = `${BASE_URL}${path}`;

  try {
    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add Authorization header unless explicitly skipped (for 401 tests)
    if (!options.skipAuth && globalAuth) {
      headers["Authorization"] = `Bearer ${globalAuth.token}`;
    }

    // Add timeout to prevent hanging on slow queries or database issues
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const duration = Date.now() - startTime;
    const data = await response.json();
    const statusMatch = response.status === expectedStatus;
    const responseValid = options.validateResponse
      ? options.validateResponse(data)
      : true;
    const passed = statusMatch && responseValid;

    const result: TestResult = {
      route: `${method} ${path}`,
      test: testName,
      passed,
      statusCode: response.status,
      duration,
      response: data,
      error: passed ? undefined : JSON.stringify(data, null, 2),
    };

    results.push(result);

    // Log result
    const icon = passed ? "✓" : "✗";
    const statusText = passed ? "PASS" : "FAIL";
    logger.info(
      {
        test: testName,
        status: response.status,
        expected: expectedStatus,
        duration: `${duration}ms`,
      },
      `${icon} [${statusText}] ${testName}`
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    const result: TestResult = {
      route: `${method} ${path}`,
      test: testName,
      passed: false,
      statusCode: 0,
      duration,
      error: String(error),
    };
    results.push(result);
    logger.error({ error, test: testName }, `✗ [ERROR] ${testName}`);
    return result;
  }
}

// Helper to get a test vehicle ID via API
async function getTestVehicleId(
  tenantId: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/vehicles?page=1&limit=1`, {
      headers: {
        "x-tenant-id": tenantId,
        "x-user-id": userId,
      },
    });
    const data = (await response.json()) as { data?: Array<{ id: string }> };
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

// Helper to get a test driver ID via API
async function getTestDriverId(
  tenantId: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/v1/drivers?page=1&limit=1`, {
      headers: {
        "x-tenant-id": tenantId,
        "x-user-id": userId,
      },
    });
    const data = (await response.json()) as { data?: Array<{ id: string }> };
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

// Helper to get a test car make ID via API
async function getTestMakeId(
  tenantId: string,
  userId: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/directory/makes?page=1&limit=1`,
      {
        headers: {
          "x-tenant-id": tenantId,
          "x-user-id": userId,
        },
      }
    );
    const data = (await response.json()) as { data?: Array<{ id: string }> };
    return data.data?.[0]?.id || null;
  } catch {
    return null;
  }
}

function validateErrorResponse(data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;

  const error = (data as { error?: unknown }).error;
  if (typeof error !== "object" || error === null) return false;

  const errorObj = error as Record<string, unknown>;

  return (
    typeof errorObj.code === "string" &&
    typeof errorObj.message === "string" &&
    typeof errorObj.path === "string" &&
    typeof errorObj.timestamp === "string" &&
    typeof errorObj.request_id === "string"
  );
}

async function runBatch3Tests() {
  try {
    logger.info("🚀 Starting Batch 3 Staging Tests");
    logger.info(`📍 Base URL: ${BASE_URL}`);

    // SETUP: Create Clerk test authentication
    logger.info("\n⚙️  SETUP: Creating test authentication credentials...");
    const setupStart = Date.now();

    globalAuth = await createClerkTestAuth();

    const setupDuration = Date.now() - setupStart;
    logger.info(
      {
        userId: globalAuth.userId,
        orgId: globalAuth.orgId,
        email: globalAuth.email,
        tokenExpires: new Date(globalAuth.expiresAt).toISOString(),
        duration: `${setupDuration}ms`,
      },
      `✅ Test credentials created (${setupDuration}ms)`
    );

    // PHASE 2A: Complex Routes
    logger.info("\n📝 PHASE 2A: Complex Routes (Priority 1)");

    await testRoute21_DeleteVehicle(globalAuth.orgId, globalAuth.userId);
    await testRoute23_ListDrivers(globalAuth.orgId, globalAuth.userId);
    await testRoute26_DriverStatistics(globalAuth.orgId, globalAuth.userId);
    await testRoute22_CreateMake(globalAuth.orgId, globalAuth.userId);

    // PHASE 2B: Simple Routes
    logger.info("\n📝 PHASE 2B: Simple Routes");

    await testRoute24_CreateModel(globalAuth.orgId, globalAuth.userId);
    await testRoute25_ListRegulations(globalAuth.orgId, globalAuth.userId);
    await testRoute27_InsuranceExpiring(globalAuth.orgId, globalAuth.userId);
    await testRoute28_MaintenanceNeeded(globalAuth.orgId, globalAuth.userId);

    logger.info("\n" + "=".repeat(80));
    logger.info("📊 TEST RESULTS SUMMARY");
    logger.info("=".repeat(80));

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const total = results.length;
    const passRate = ((passed / total) * 100).toFixed(1);

    logger.info(`✅ Passed: ${passed}/${total} (${passRate}%)`);
    logger.info(`❌ Failed: ${failed}/${total}`);

    const byRoute = results.reduce(
      (acc, r) => {
        if (!acc[r.route]) {
          acc[r.route] = { passed: 0, failed: 0, tests: [] };
        }
        if (r.passed) {
          acc[r.route].passed++;
        } else {
          acc[r.route].failed++;
        }
        acc[r.route].tests.push(r);
        return acc;
      },
      {} as Record<
        string,
        { passed: number; failed: number; tests: TestResult[] }
      >
    );

    logger.info("\n📋 Results by Route:");
    Object.entries(byRoute).forEach(([route, stats]) => {
      const status =
        stats.failed === 0
          ? "✅ PASS"
          : stats.passed === 0
            ? "❌ FAIL"
            : "⚠️  PARTIAL";
      logger.info(
        `${status} ${route}: ${stats.passed}/${stats.passed + stats.failed} tests passed`
      );

      stats.tests.forEach((test) => {
        const icon = test.passed ? "  ✓" : "  ✗";
        logger.info(
          `${icon} ${test.test} (${test.statusCode}) - ${test.duration}ms`
        );
        if (!test.passed && test.error) {
          logger.error(`    Error: ${test.error.substring(0, 200)}`);
        }
      });
    });

    const avgDuration = (
      results.reduce((sum, r) => sum + r.duration, 0) / results.length
    ).toFixed(0);
    const maxDuration = Math.max(...results.map((r) => r.duration));
    const minDuration = Math.min(...results.map((r) => r.duration));

    logger.info("\n⚡ Performance Metrics:");
    logger.info(`  Average response time: ${avgDuration}ms`);
    logger.info(`  Min response time: ${minDuration}ms`);
    logger.info(`  Max response time: ${maxDuration}ms`);

    logger.info("\n" + "=".repeat(80));
    if (failed === 0) {
      logger.info("🎉 ALL TESTS PASSED - Batch 3 migration VALIDATED");
    } else {
      logger.error(
        `⚠️  ${failed} TEST(S) FAILED - Review errors above before proceeding`
      );
    }
    logger.info("=".repeat(80));

    const resultsJson = JSON.stringify(
      {
        summary: { total, passed, failed, passRate },
        byRoute,
        allResults: results,
        timestamp: new Date().toISOString(),
        testCredentials: {
          userId: globalAuth?.userId,
          orgId: globalAuth?.orgId,
          email: globalAuth?.email,
        },
      },
      null,
      2
    );

    await writeFile(
      "docs/test-results/batch3-test-results.json",
      resultsJson,
      "utf-8"
    );
    logger.info(
      "\n💾 Results saved to: docs/test-results/batch3-test-results.json"
    );
  } catch (error) {
    logger.error({ error }, "❌ Test suite failed");
    throw error;
  } finally {
    // TEARDOWN: Cleanup test credentials
    if (globalAuth) {
      logger.info("\n🧹 TEARDOWN: Cleaning up test credentials...");
      const cleanupStart = Date.now();

      try {
        await cleanupClerkTestAuth(globalAuth);
        const cleanupDuration = Date.now() - cleanupStart;
        logger.info(`✅ Test credentials cleaned up (${cleanupDuration}ms)`);
      } catch (error) {
        logger.error(
          { error },
          "⚠️  Failed to cleanup test credentials (non-critical)"
        );
      }
    }
  }
}

void runBatch3Tests();

// Route #21: DELETE /vehicles/:id
async function testRoute21_DeleteVehicle(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #21: DELETE /vehicles/:id");

  const vehicleId = await getTestVehicleId(tenantId, userId);

  if (!vehicleId) {
    logger.warn("⚠️  No vehicle found - skipping DELETE test");
    return;
  }

  await testRoute(
    "DELETE",
    `/api/v1/vehicles/${vehicleId}`,
    "Soft delete with reason",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      body: { reason: "Test deletion - Batch 3 staging" },
      validateResponse: (data) => {
        const d = data as { id?: string; deleted_at?: string };
        return !!d.id && !!d.deleted_at;
      },
    }
  );

  await testRoute(
    "DELETE",
    `/api/v1/vehicles/${NONEXISTENT_UUID}`,
    "Vehicle not found",
    404,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: validateErrorResponse,
    }
  );

  await testRoute(
    "DELETE",
    `/api/v1/vehicles/${vehicleId}`,
    "Unauthorized",
    401,
    { skipAuth: true }
  );
}

// Route #23: GET /drivers
async function testRoute23_ListDrivers(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #23: GET /drivers (CRITICAL - 11 params)");

  await testRoute("GET", "/api/v1/drivers?page=1&limit=10", "Basic list", 200, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    validateResponse: (data) => {
      const d = data as { data?: unknown[]; pagination?: unknown };
      return Array.isArray(d.data) && !!d.pagination;
    },
  });

  const complexQuery = [
    "page=1",
    "limit=20",
    "sortBy=created_at",
    "sortOrder=desc",
    "driver_status=active",
    "cooperation_type=employee",
    "rating_min=4.0",
    "rating_max=5.0",
    "search=test",
    "has_active_assignment=true",
    "expiring_documents=30",
  ].join("&");

  await testRoute(
    "GET",
    `/api/v1/drivers?${complexQuery}`,
    "Complex query (11 params)",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        const d = data as { data?: unknown[] };
        return Array.isArray(d.data);
      },
    }
  );

  await testRoute(
    "GET",
    "/api/v1/drivers?sortBy=invalid_field",
    "Invalid sortBy",
    400,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: validateErrorResponse,
    }
  );

  await testRoute("GET", "/api/v1/drivers", "Unauthorized", 401, {
    skipAuth: true,
  });
}

// Route #26: GET /drivers/:id/statistics
async function testRoute26_DriverStatistics(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #26: GET /drivers/:id/statistics");

  const driverId = await getTestDriverId(tenantId, userId);

  if (!driverId) {
    logger.warn("⚠️  No driver found - skipping statistics test");
    return;
  }

  await testRoute(
    "GET",
    `/api/v1/drivers/${driverId}/statistics`,
    "All-time statistics",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        const d = data as { trips?: unknown; revenue?: unknown };
        return !!d.trips && !!d.revenue;
      },
    }
  );

  await testRoute(
    "GET",
    `/api/v1/drivers/${driverId}/statistics?start_date=2025-01-01&end_date=2025-10-17`,
    "Date range statistics",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    }
  );

  await testRoute(
    "GET",
    `/api/v1/drivers/${NONEXISTENT_UUID}/statistics`,
    "Driver not found",
    404,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: validateErrorResponse,
    }
  );

  await testRoute(
    "GET",
    `/api/v1/drivers/${driverId}/statistics?start_date=invalid`,
    "Invalid date format",
    400,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: validateErrorResponse,
    }
  );

  await testRoute(
    "GET",
    `/api/v1/drivers/${driverId}/statistics`,
    "Unauthorized",
    401,
    { skipAuth: true }
  );
}

// Route #22: POST /directory/makes
async function testRoute22_CreateMake(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #22: POST /directory/makes");

  const uniqueName = `Tesla_Test_${Date.now()}`;

  await testRoute("POST", "/api/v1/directory/makes", "Create make", 201, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    body: { name: uniqueName, country: "USA" },
    validateResponse: (data) => {
      const d = data as { id?: string; name?: string };
      return !!d.id && d.name === uniqueName;
    },
  });

  await testRoute("POST", "/api/v1/directory/makes", "Duplicate name", 409, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    body: { name: uniqueName, country: "USA" },
    validateResponse: validateErrorResponse,
  });

  await testRoute("POST", "/api/v1/directory/makes", "Invalid body", 400, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    body: { invalid: "field" },
    validateResponse: validateErrorResponse,
  });

  await testRoute("POST", "/api/v1/directory/makes", "Unauthorized", 401, {
    body: { name: "BMW", country: "Germany" },
    skipAuth: true,
  });
}

// Route #24: POST /directory/models
async function testRoute24_CreateModel(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #24: POST /directory/models");

  const makeId = await getTestMakeId(tenantId, userId);

  if (!makeId) {
    logger.warn("⚠️  No car make found - skipping model creation test");
    return;
  }

  const uniqueName = `Model_Test_${Date.now()}`;

  await testRoute("POST", "/api/v1/directory/models", "Create model", 201, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    body: { make_id: makeId, name: uniqueName, year: 2023 },
    validateResponse: (data) => {
      const d = data as { id?: string };
      return !!d.id;
    },
  });

  await testRoute("POST", "/api/v1/directory/models", "Invalid make_id", 404, {
    headers: { "x-user-id": userId, "x-tenant-id": tenantId },
    body: {
      make_id: NONEXISTENT_UUID,
      name: "Invalid",
      year: 2023,
    },
    validateResponse: validateErrorResponse,
  });

  await testRoute("POST", "/api/v1/directory/models", "Unauthorized", 401, {
    body: { make_id: NONEXISTENT_UUID, name: "Test", year: 2023 },
    skipAuth: true,
  });
}

// Route #25: GET /directory/regulations
async function testRoute25_ListRegulations(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #25: GET /directory/regulations");

  await testRoute(
    "GET",
    "/api/v1/directory/regulations",
    "List all regulations",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        return Array.isArray(data);
      },
    }
  );

  await testRoute(
    "GET",
    "/api/v1/directory/regulations?country_code=FR",
    "Filter by country",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        return Array.isArray(data);
      },
    }
  );

  await testRoute("GET", "/api/v1/directory/regulations", "Unauthorized", 401, {
    skipAuth: true,
  });
}

// Route #27: GET /vehicles/insurance-expiring
async function testRoute27_InsuranceExpiring(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #27: GET /vehicles/insurance-expiring");

  await testRoute(
    "GET",
    "/api/v1/vehicles/insurance-expiring",
    "Default daysAhead",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        return Array.isArray(data);
      },
    }
  );

  await testRoute(
    "GET",
    "/api/v1/vehicles/insurance-expiring?daysAhead=60",
    "Custom daysAhead",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        return Array.isArray(data);
      },
    }
  );

  await testRoute(
    "GET",
    "/api/v1/vehicles/insurance-expiring",
    "Unauthorized",
    401,
    { skipAuth: true }
  );
}

// Route #28: GET /vehicles/maintenance
async function testRoute28_MaintenanceNeeded(
  tenantId: string,
  userId: string
): Promise<void> {
  logger.info("🧪 Testing Route #28: GET /vehicles/maintenance");

  await testRoute(
    "GET",
    "/api/v1/vehicles/maintenance",
    "List maintenance needed",
    200,
    {
      headers: { "x-user-id": userId, "x-tenant-id": tenantId },
      validateResponse: (data) => {
        return Array.isArray(data);
      },
    }
  );

  await testRoute("GET", "/api/v1/vehicles/maintenance", "Unauthorized", 401, {
    skipAuth: true,
  });
}
