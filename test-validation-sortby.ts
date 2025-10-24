/**
 * Manual Test Suite for validateSortBy()
 *
 * Run: npx tsx test-validation-sortby.ts
 *
 * Tests:
 * 1. Valid sortBy field (success path)
 * 2. Invalid sortBy field with tenantId (audit logged)
 * 3. Invalid sortBy field without tenantId (audit skipped)
 * 4. Empty whitelist runtime check (type bypass simulation)
 * 5. Performance validation (< 0.001ms success path)
 */

import { validateSortBy, type SortFieldWhitelist } from "./lib/core/validation";
import { ValidationError } from "./lib/core/errors";

// Test configuration
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_WHITELIST: SortFieldWhitelist = [
  "id",
  "created_at",
  "updated_at",
  "email",
  "first_name",
  "last_name",
  "status",
] as const;

let passCount = 0;
let failCount = 0;

function logTest(testNum: number, description: string) {
  process.stdout.write(`\n${"=".repeat(60)}\n`);
  process.stdout.write(`TEST ${testNum}: ${description}\n`);
  process.stdout.write(`${"=".repeat(60)}\n`);
}

function logPass(message: string) {
  passCount++;
  process.stdout.write(` PASS: ${message}\n`);
}

function logFail(message: string) {
  failCount++;
  process.stdout.write(`L FAIL: ${message}\n`);
}

function logInfo(message: string) {
  process.stdout.write(`9  ${message}\n`);
}

// =============================================================================
// TEST 1: Valid sortBy field (success path)
// =============================================================================
logTest(1, "Valid sortBy field");
try {
  validateSortBy("email", TEST_WHITELIST, TEST_TENANT_ID);
  logPass("Valid field 'email' accepted without error");
  logInfo("No audit log created (expected behavior)");
} catch (error: unknown) {
  logFail(`Should not throw error: ${(error as Error).message}`);
}

// =============================================================================
// TEST 2: Invalid sortBy with tenantId (audit logged)
// =============================================================================
logTest(2, "Invalid sortBy with tenantId (audit logged)");
try {
  validateSortBy("deleted_at", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have thrown ValidationError");
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    logPass("ValidationError thrown as expected");
    logInfo(`Error message: "${(error as Error).message}"`);
    logInfo("Fire-and-forget audit should be logged to adm_audit_logs");
    logInfo(
      `Query: SELECT * FROM adm_audit_logs WHERE tenant_id = '${TEST_TENANT_ID}' AND action = 'validation_failed' ORDER BY timestamp DESC LIMIT 1;`
    );
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}

// =============================================================================
// TEST 3: Invalid sortBy without tenantId (audit skipped)
// =============================================================================
logTest(3, "Invalid sortBy without tenantId (audit skipped)");
try {
  validateSortBy("password", TEST_WHITELIST);
  logFail("Should have thrown ValidationError");
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    logPass("ValidationError thrown as expected");
    logInfo(`Error message: "${(error as Error).message}"`);
    logInfo("Audit skipped (no tenantId) - acceptable per design");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}

// =============================================================================
// TEST 4: SQL Injection attempt
// =============================================================================
logTest(4, "SQL Injection attempt");
try {
  validateSortBy("id; DROP TABLE users--", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have thrown ValidationError");
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    logPass("Injection attempt blocked");
    logInfo(`Attempted field: "id; DROP TABLE users--"`);
    logInfo("Audit logged for security monitoring");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}

// =============================================================================
// TEST 5: Empty whitelist runtime failsafe
// =============================================================================
logTest(5, "Empty whitelist runtime failsafe");
try {
  // Simulate type system bypass: developer uses `as any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const EMPTY_BYPASSED = [] as any as SortFieldWhitelist;
  validateSortBy("id", EMPTY_BYPASSED, TEST_TENANT_ID);
  logFail("Should have thrown Error for empty whitelist");
} catch (error: unknown) {
  if (
    (error as Error).message.includes("SECURITY: Whitelist cannot be empty")
  ) {
    logPass("Runtime check caught empty whitelist");
    logInfo("Defense in depth: Type bypass detected");
  } else {
    logFail(`Wrong error: ${(error as Error).message}`);
  }
}

// =============================================================================
// TEST 6: Performance validation (success path)
// =============================================================================
logTest(6, "Performance validation (success path)");
const iterations = 10000;
const startTime = process.hrtime.bigint();

for (let i = 0; i < iterations; i++) {
  try {
    validateSortBy("email", TEST_WHITELIST, TEST_TENANT_ID);
  } catch (error) {
    logFail(
      `Unexpected error in performance test: ${(error as Error).message}`
    );
    break;
  }
}

const endTime = process.hrtime.bigint();
const totalNs = Number(endTime - startTime);
const avgNs = totalNs / iterations;
const avgMs = avgNs / 1_000_000;

if (avgMs < 0.001) {
  logPass(`Average time: ${avgMs.toFixed(6)}ms (< 0.001ms target)`);
  logInfo(`Total iterations: ${iterations.toLocaleString()}`);
} else {
  logFail(`Average time: ${avgMs.toFixed(6)}ms (exceeds 0.001ms target)`);
}

// =============================================================================
// TEST 7: Error message displays full whitelist
// =============================================================================
logTest(7, "Error message displays full whitelist");
try {
  validateSortBy("invalid_field", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have thrown ValidationError");
} catch (error: unknown) {
  const message = (error as Error).message;
  const containsAllFields = TEST_WHITELIST.every((field) =>
    message.includes(field)
  );

  if (containsAllFields) {
    logPass("Error message contains all whitelist fields");
    logInfo("Developer experience: Immediate feedback on allowed fields");
  } else {
    logFail("Error message missing some whitelist fields");
    logInfo(`Message: ${message}`);
  }
}

// =============================================================================
// TEST 8: Case sensitivity check
// =============================================================================
logTest(8, "Case sensitivity validation");
try {
  validateSortBy("EMAIL", TEST_WHITELIST, TEST_TENANT_ID); // uppercase
  logFail("Should have thrown ValidationError (case sensitive)");
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    logPass("Validation is case-sensitive (expected)");
    logInfo("Field 'EMAIL' rejected (whitelist has 'email')");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}

// =============================================================================
// SUMMARY
// =============================================================================
process.stdout.write(`\n${"=".repeat(60)}\n`);
process.stdout.write(`TEST SUMMARY\n`);
process.stdout.write(`${"=".repeat(60)}\n`);
process.stdout.write(` Passed: ${passCount}/8\n`);
process.stdout.write(`L Failed: ${failCount}/8\n`);

if (failCount === 0) {
  process.stdout.write(`\n<� All tests passed!\n`);
  process.stdout.write(`\n�  MANUAL VERIFICATION REQUIRED:\n`);
  process.stdout.write(`   1. Check audit logs in database:\n`);
  process.stdout.write(`      SELECT * FROM adm_audit_logs \n`);
  process.stdout.write(`      WHERE action = 'validation_failed' \n`);
  process.stdout.write(`      ORDER BY timestamp DESC LIMIT 3;\n`);
  process.stdout.write(`\n   2. Verify metadata JSONB contains:\n`);
  process.stdout.write(`      - attempted_field: "deleted_at"\n`);
  process.stdout.write(`      - allowed_fields: [array of whitelist]\n`);
  process.exit(0);
} else {
  process.stdout.write(`\nL Some tests failed. Review output above.\n`);
  process.exit(1);
}
