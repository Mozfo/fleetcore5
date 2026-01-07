/**
 * Test Customer Verification Email - V6.2-8.5
 *
 * Tests the customer_verification email template via NotificationQueueService
 * (the production flow, NOT direct Resend API).
 *
 * Run: TEST_EMAIL=your@email.com pnpm exec tsx scripts/test-customer-verification-email.ts
 *
 * Prerequisites:
 * - customer_verification template must exist in DB (run prisma db seed)
 * - RESEND_API_KEY must be set in .env.local
 */

import { prisma } from "@/lib/prisma";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

const TEST_EMAIL = process.env.TEST_EMAIL || "mohamed@bluewise.io";
const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

interface TestResult {
  locale: string;
  success: boolean;
  queueId?: string;
  error?: string;
}

async function checkTemplateExists(): Promise<boolean> {
  const template = await prisma.dir_notification_templates.findFirst({
    where: { template_code: "customer_verification" },
    select: { id: true, template_code: true },
  });

  if (!template) {
    logger.error(
      {},
      "Template 'customer_verification' not found in DB. Run: pnpm prisma db seed"
    );
    return false;
  }

  logger.info(
    { templateId: template.id },
    "Template 'customer_verification' found in DB"
  );
  return true;
}

async function sendTestEmails(): Promise<void> {
  logger.info(
    { email: TEST_EMAIL, locales: LOCALES },
    "Starting CustomerVerification email tests"
  );

  // Check template exists
  const templateExists = await checkTemplateExists();
  if (!templateExists) {
    process.exit(1);
  }

  const queueService = new NotificationQueueService();
  const results: TestResult[] = [];

  for (const locale of LOCALES) {
    logger.info({ locale }, "Sending CustomerVerification test email");

    // Test data matching the template variables
    const testVariables = {
      company_name:
        locale === "ar"
          ? "شركة الاختبار"
          : locale === "fr"
            ? "Test Company SARL"
            : "Test Company Ltd",
      tenant_code: "C-TEST01",
      verification_url: `https://app.fleetcore.io/${locale}/verify?token=test_token_${locale}_${Date.now()}`,
      expires_in_hours: 24,
    };

    try {
      const result = await queueService.queueNotification({
        templateCode: "customer_verification",
        recipientEmail: TEST_EMAIL,
        locale,
        variables: testVariables,
        countryCode: locale === "ar" ? "AE" : locale === "fr" ? "FR" : "US",
        idempotencyKey: `test_customer_verification_${locale}_${Date.now()}`,
        processImmediately: true, // Send immediately for testing
      });

      if (result.success) {
        logger.info(
          { locale, queueId: result.queueId },
          "Email queued and processed successfully"
        );
        results.push({ locale, success: true, queueId: result.queueId });
      } else {
        logger.error(
          { locale, error: result.error },
          "Failed to queue/send email"
        );
        results.push({ locale, success: false, error: result.error });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      logger.error({ locale, error }, "Exception during email test");
      results.push({ locale, success: false, error });
    }

    // Small delay between emails to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  logger.info(
    {
      succeeded,
      failed,
      total: LOCALES.length,
      email: TEST_EMAIL,
      results,
    },
    "CustomerVerification email tests completed"
  );

  // Exit with error code if any failed
  if (failed > 0) {
    process.exit(1);
  }
}

sendTestEmails()
  .then(() => {
    logger.info({}, "Test script completed successfully");
    process.exit(0);
  })
  .catch((err) => {
    logger.error({ err }, "Fatal error in test script");
    process.exit(1);
  });
