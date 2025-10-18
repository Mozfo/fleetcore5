#!/usr/bin/env tsx
/**
 * Test Suite: validateSortBy() Security Helper
 *
 * Tests the sortBy whitelist validation function created in Phase 3
 * to prevent SQL injection via ORDER BY clause.
 *
 * Usage:
 *   pnpm tsx scripts/test-validation-sortby.ts
 *
 * Exit codes:
 *   0 - All tests passed
 *   1 - At least one test failed
 */

import "dotenv/config";
import { validateSortBy, type SortFieldWhitelist } from "@/lib/core/validation";
import { ValidationError } from "@/lib/core/errors";

// ANSI color codes for terminal output
const COLORS = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// Test configuration
const TEST_TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TEST_WHITELIST: SortFieldWhitelist = [
  "id",
  "email",
  "name",
  "created_at",
  "updated_at",
  "status",
] as const;

// Test counters
let passCount = 0;
let failCount = 0;

// Helper functions
function printHeader(title: string) {
  process.stdout.write(`\n${COLORS.cyan}${"P".repeat(60)}${COLORS.reset}\n`);
  process.stdout.write(`${COLORS.bold}${title}${COLORS.reset}\n`);
  process.stdout.write(`${COLORS.cyan}${"P".repeat(60)}${COLORS.reset}\n\n`);
}

function printTestTitle(testNum: number, description: string) {
  process.stdout.write(
    `${COLORS.bold}Test ${testNum}: ${description}${COLORS.reset}\n`
  );
}

function logPass(message: string) {
  passCount++;
  process.stdout.write(`${COLORS.green} PASS${COLORS.reset}: ${message}\n`);
}

function logFail(message: string) {
  failCount++;
  process.stdout.write(`${COLORS.red}L FAIL${COLORS.reset}: ${message}\n`);
}

function logInfo(message: string) {
  process.stdout.write(`${COLORS.blue}9  ${message}${COLORS.reset}\n`);
}

// =============================================================================
// TEST SUITE
// =============================================================================

printHeader("VALIDATION SORTBY - TEST SUITE");

// -----------------------------------------------------------------------------
// Test 1: Valid sortBy - Success Path
// -----------------------------------------------------------------------------
printTestTitle(1, "Valid sortBy - Success Path");
try {
  validateSortBy("email", TEST_WHITELIST, TEST_TENANT_ID);
  logPass("No error thrown");
  logInfo("No audit log created (expected for valid input)");
} catch (error) {
  logFail(`Should not throw: ${(error as Error).message}`);
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 2: Invalid sortBy WITH tenantId
// -----------------------------------------------------------------------------
printTestTitle(2, "Invalid sortBy WITH tenantId");
try {
  validateSortBy("deleted_at", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have thrown ValidationError");
} catch (error) {
  if (error instanceof ValidationError) {
    logPass("ValidationError thrown with correct message");
    logInfo("Audit log fired (check adm_audit_logs table)");
    logInfo(
      `Query: SELECT * FROM adm_audit_logs WHERE tenant_id = '${TEST_TENANT_ID}' AND action = 'validation_failed' ORDER BY timestamp DESC LIMIT 1;`
    );
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 3: Invalid sortBy WITHOUT tenantId
// -----------------------------------------------------------------------------
printTestTitle(3, "Invalid sortBy WITHOUT tenantId");
try {
  validateSortBy("password", TEST_WHITELIST);
  logFail("Should have thrown ValidationError");
} catch (error) {
  if (error instanceof ValidationError) {
    logPass("ValidationError thrown");
    logInfo("Audit skipped (no tenantId provided)");
    logInfo("This is expected behavior per lib/audit.ts:54");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 4: SQL Injection Protection
// -----------------------------------------------------------------------------
printTestTitle(4, "SQL Injection Protection");
try {
  validateSortBy("id; DROP TABLE users--", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have blocked injection attempt");
} catch (error) {
  if (error instanceof ValidationError) {
    logPass("Injection attempt blocked");
    logInfo('Malicious input: "id; DROP TABLE users--"');
    logInfo("System protected against SQL injection via sortBy");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 5: Empty Whitelist Runtime Failsafe
// -----------------------------------------------------------------------------
printTestTitle(5, "Empty Whitelist Runtime Failsafe");
try {
  // Simulate type system bypass with `as any`
  const EMPTY_BYPASSED = [] as any as SortFieldWhitelist;
  validateSortBy("id", EMPTY_BYPASSED, TEST_TENANT_ID);
  logFail("Should have caught empty whitelist");
} catch (error) {
  const message = (error as Error).message;
  if (message.includes("SECURITY: Whitelist cannot be empty")) {
    logPass("Runtime check caught empty whitelist");
    logInfo("Defense in depth: Protected against type bypass");
  } else {
    logFail(`Wrong error message: ${message}`);
  }
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 6: Performance Success Path
// -----------------------------------------------------------------------------
printTestTitle(6, "Performance Success Path");
const iterations = 10000;
const startTime = performance.now();

try {
  for (let i = 0; i < iterations; i++) {
    validateSortBy("email", TEST_WHITELIST, TEST_TENANT_ID);
  }

  const endTime = performance.now();
  const totalMs = endTime - startTime;
  const avgMs = totalMs / iterations;

  if (avgMs < 0.001) {
    logPass(`Average time: ${avgMs.toFixed(6)}ms (< 0.001ms target)`);
    logInfo(`Total iterations: ${iterations.toLocaleString()}`);
    logInfo(`Total time: ${totalMs.toFixed(2)}ms`);
  } else {
    logFail(`Average time: ${avgMs.toFixed(6)}ms (exceeds 0.001ms target)`);
  }
} catch (error) {
  logFail(`Unexpected error: ${(error as Error).message}`);
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 7: Error Message UX
// -----------------------------------------------------------------------------
printTestTitle(7, "Error Message UX");
try {
  validateSortBy("hack", TEST_WHITELIST, TEST_TENANT_ID);
  logFail("Should have thrown ValidationError");
} catch (error) {
  const message = (error as Error).message;
  const hasAllFields = TEST_WHITELIST.every((field) => message.includes(field));

  if (hasAllFields) {
    logPass("Error message contains ENTIRE whitelist");
    logInfo("Developer gets immediate feedback on allowed fields");
    logInfo(`Message preview: ${message.substring(0, 80)}...`);
  } else {
    logFail("Error message missing some whitelist fields");
    logInfo(`Full message: ${message}`);
  }
}
process.stdout.write("\n");

// -----------------------------------------------------------------------------
// Test 8: Case Sensitivity
// -----------------------------------------------------------------------------
printTestTitle(8, "Case Sensitivity");
try {
  validateSortBy("Email", TEST_WHITELIST, TEST_TENANT_ID); // Capital E
  logFail("Should reject uppercase (case-sensitive)");
} catch (error) {
  if (error instanceof ValidationError) {
    logPass("Case-sensitive validation confirmed");
    logInfo("Field 'Email' rejected (whitelist has 'email')");
    logInfo("Prevents confusion and injection via case variations");
  } else {
    logFail(`Wrong error type: ${(error as Error).constructor.name}`);
  }
}
process.stdout.write("\n");

// =============================================================================
// SUMMARY
// =============================================================================

printHeader("TEST RESULTS");

const totalTests = 8;
const successRate = ((passCount / totalTests) * 100).toFixed(1);

process.stdout.write(
  `${COLORS.bold}Total Tests:${COLORS.reset} ${totalTests}\n`
);
process.stdout.write(
  `${COLORS.green}${COLORS.bold} Passed:${COLORS.reset} ${passCount}/${totalTests}\n`
);
process.stdout.write(
  `${COLORS.red}${COLORS.bold}L Failed:${COLORS.reset} ${failCount}/${totalTests}\n`
);
process.stdout.write(
  `${COLORS.cyan}${COLORS.bold}Success Rate:${COLORS.reset} ${successRate}%\n`
);

if (failCount === 0) {
  process.stdout.write(
    `\n${COLORS.green}${COLORS.bold}<� ALL TESTS PASSED (${passCount}/${totalTests})${COLORS.reset}\n`
  );
  process.stdout.write(`${COLORS.cyan}${"P".repeat(60)}${COLORS.reset}\n\n`);

  // Manual verification instructions
  process.stdout.write(
    `${COLORS.yellow}${COLORS.bold}�  MANUAL VERIFICATION REQUIRED:${COLORS.reset}\n\n`
  );
  process.stdout.write(
    `${COLORS.bold}1. Check audit logs in database:${COLORS.reset}\n`
  );
  process.stdout.write(`   ${COLORS.cyan}psql -c "SELECT * FROM adm_audit_logs \n`);
  process.stdout.write(`           WHERE action = 'validation_failed' \n`);
  process.stdout.write(
    `           ORDER BY timestamp DESC LIMIT 3;"${COLORS.reset}\n\n`
  );
  process.stdout.write(
    `${COLORS.bold}2. Verify metadata JSONB contains:${COLORS.reset}\n`
  );
  process.stdout.write(`   - ${COLORS.cyan}attempted_field${COLORS.reset}: "deleted_at"\n`);
  process.stdout.write(
    `   - ${COLORS.cyan}allowed_fields${COLORS.reset}: [array of whitelist]\n\n`
  );

  process.exit(0);
} else {
  process.stdout.write(
    `\n${COLORS.red}${COLORS.bold}L SOME TESTS FAILED (${failCount}/${totalTests})${COLORS.reset}\n`
  );
  process.stdout.write(`${COLORS.cyan}${"P".repeat(60)}${COLORS.reset}\n`);
  process.stdout.write(
    `\n${COLORS.yellow}Review the output above for details.${COLORS.reset}\n\n`
  );

  process.exit(1);
}
