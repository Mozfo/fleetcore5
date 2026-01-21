/**
 * QA Test: BookingConfirmation Email Flow
 *
 * Tests automatisés pour vérifier le flux complet AVANT déploiement.
 * Ce script doit passer à 100% avant tout commit.
 *
 * Usage: pnpm tsx scripts/qa-booking-confirmation.ts
 */

import { readFileSync } from "fs";
import { render } from "@react-email/render";
import { BookingConfirmation } from "@/emails/templates/BookingConfirmation";
import { generateShortToken } from "@/lib/utils/token";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

// ============================================================================
// TEST RESULTS TRACKING
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | string): void {
  try {
    const result = fn();
    if (result === true) {
      results.push({ name, passed: true });
    } else {
      results.push({ name, passed: false, details: String(result) });
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

async function testAsync(
  name: string,
  fn: () => Promise<boolean | string>
): Promise<void> {
  try {
    const result = await fn();
    if (result === true) {
      results.push({ name, passed: true });
    } else {
      results.push({ name, passed: false, details: String(result) });
    }
  } catch (error) {
    results.push({
      name,
      passed: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

// ============================================================================
// TESTS
// ============================================================================

async function runTests(): Promise<void> {
  logger.info("Starting QA tests for BookingConfirmation...");

  // TEST 1: Token generation
  test("Token generation - length 6", () => {
    const token = generateShortToken();
    if (token.length !== 6) return `Expected length 6, got ${token.length}`;
    return true;
  });

  test("Token generation - alphanumeric only", () => {
    const token = generateShortToken();
    if (!/^[a-zA-Z0-9]+$/.test(token))
      return `Token contains invalid chars: ${token}`;
    return true;
  });

  test("Token generation - unique tokens", () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateShortToken());
    }
    if (tokens.size < 95) return `Only ${tokens.size}/100 unique tokens`;
    return true;
  });

  // TEST 2: Email rendering
  const locales: EmailLocale[] = ["en", "fr", "ar"];

  for (const locale of locales) {
    await testAsync(`Email renders without error - ${locale}`, async () => {
      const html = await render(
        BookingConfirmation({
          locale,
          firstName: "Test",
          bookingDate: "January 22, 2026",
          bookingTime: "14:30",
          timezone: "GMT+1",
          meetingUrl: "https://meet.google.com/test",
          rescheduleUrl: "https://fleetcore.io/fr/r/ABC123",
          cancelUrl: "https://fleetcore.io/fr/r/ABC123",
        })
      );
      if (!html || html.length < 1000)
        return `HTML too short: ${html?.length || 0}`;
      return true;
    });

    await testAsync(`Email contains reschedule URL - ${locale}`, async () => {
      const html = await render(
        BookingConfirmation({
          locale,
          firstName: "Test",
          bookingDate: "January 22, 2026",
          bookingTime: "14:30",
          timezone: "GMT+1",
          meetingUrl: "https://meet.google.com/test",
          rescheduleUrl: "https://fleetcore.io/fr/r/ABC123",
          cancelUrl: "https://fleetcore.io/fr/r/ABC123",
        })
      );
      if (!html.includes("https://fleetcore.io/fr/r/ABC123"))
        return "Reschedule URL not found in HTML";
      return true;
    });

    await testAsync(`Email contains copyright 2026 - ${locale}`, async () => {
      const html = await render(
        BookingConfirmation({
          locale,
          firstName: "Test",
          bookingDate: "January 22, 2026",
          bookingTime: "14:30",
          timezone: "GMT+1",
          meetingUrl: "https://meet.google.com/test",
          rescheduleUrl: "https://fleetcore.io/fr/r/ABC123",
          cancelUrl: "https://fleetcore.io/fr/r/ABC123",
        })
      );
      if (!html.includes("2026")) return "Copyright 2026 not found";
      if (html.includes("2025")) return "Old copyright 2025 still present!";
      return true;
    });

    await testAsync(`Email contains meeting URL - ${locale}`, async () => {
      const html = await render(
        BookingConfirmation({
          locale,
          firstName: "Test",
          bookingDate: "January 22, 2026",
          bookingTime: "14:30",
          timezone: "GMT+1",
          meetingUrl: "https://meet.google.com/test-meeting",
          rescheduleUrl: "https://fleetcore.io/fr/r/ABC123",
          cancelUrl: "https://fleetcore.io/fr/r/ABC123",
        })
      );
      if (!html.includes("https://meet.google.com/test-meeting"))
        return "Meeting URL not found";
      return true;
    });
  }

  // TEST 3: URL format validation
  test("Reschedule URL format - short token", () => {
    const token = "Xk9mP2";
    const url = `https://fleetcore.io/fr/r/${token}`;
    if (url.length > 50) return `URL too long: ${url.length} chars`;
    if (!url.match(/\/r\/[a-zA-Z0-9]{6}$/)) return `URL format invalid: ${url}`;
    return true;
  });

  // TEST 4: Webhook order verification (code analysis)
  test("Webhook: DB update before email send", () => {
    // This test verifies the code structure by reading the file
    const code = readFileSync("app/api/crm/webhooks/calcom/route.ts", "utf8");

    // Find the BOOKING_CREATED case
    const bookingCreatedMatch = code.match(
      /case "BOOKING_CREATED"[\s\S]*?break;/
    );
    if (!bookingCreatedMatch) return "BOOKING_CREATED case not found";

    const caseCode = bookingCreatedMatch[0];

    // Check that prisma.crm_leads.update comes BEFORE resend.emails.send
    const dbUpdatePos = caseCode.indexOf("prisma.crm_leads.update");
    const emailSendPos = caseCode.indexOf("resend.emails.send");

    if (dbUpdatePos === -1) return "DB update not found in BOOKING_CREATED";
    if (emailSendPos === -1) return "Email send not found in BOOKING_CREATED";
    if (dbUpdatePos > emailSendPos)
      return "CRITICAL: DB update happens AFTER email send!";

    return true;
  });

  // Print results
  logger.info("─".repeat(60));
  logger.info("QA TEST RESULTS");
  logger.info("─".repeat(60));

  let passed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.passed) {
      passed++;
      logger.info(`✅ ${result.name}`);
    } else {
      failed++;
      logger.error(`❌ ${result.name}: ${result.details}`);
    }
  }

  logger.info("─".repeat(60));
  logger.info(`TOTAL: ${passed} passed, ${failed} failed`);
  logger.info("─".repeat(60));

  if (failed > 0) {
    logger.error("QA FAILED - DO NOT DEPLOY");
    process.exit(1);
  } else {
    logger.info("QA PASSED - Safe to deploy");
    process.exit(0);
  }
}

void runTests();
