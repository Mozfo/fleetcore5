import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test Email Send Script
 *
 * This script tests the newly created HTML email templates by sending
 * a real email via Resend to validate the design and template rendering.
 *
 * Templates tested:
 * 1. lead_confirmation - Sent to prospect after demo request
 * 2. sales_rep_assignment - Sent to sales rep when lead is assigned
 *
 * Usage:
 * ```bash
 * TEST_EMAIL=your@email.com pnpm exec tsx scripts/test-email-send.ts
 * ```
 *
 * Environment Requirements:
 * - DATABASE_URL: PostgreSQL connection string
 * - RESEND_API_KEY: Resend API key for sending emails
 * - NEXT_PUBLIC_APP_URL: Base URL for lead detail links
 * - TEST_EMAIL: Target email address for testing
 */

async function testEmailSend() {
  logger.info("📧 Starting email template test...\n");

  // Check required environment variables
  const requiredEnvVars = [
    "DATABASE_URL",
    "RESEND_API_KEY",
    "TEST_EMAIL",
    "NEXT_PUBLIC_APP_URL",
  ];
  const missing = requiredEnvVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    logger.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    );
    logger.info("\n💡 Usage:");
    logger.info("  TEST_EMAIL=your@email.com \\");
    logger.info("  NEXT_PUBLIC_APP_URL=https://yourapp.com \\");
    logger.info("  pnpm exec tsx scripts/test-email-send.ts\n");
    process.exit(1);
  }

  const testEmail = process.env.TEST_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!testEmail || !appUrl) {
    throw new Error("TEST_EMAIL and NEXT_PUBLIC_APP_URL are required");
  }

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}\n`);

  // Initialize services
  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);

  try {
    // Test 1: Lead Confirmation Email
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("Test 1: Lead Confirmation Email (HTML Template)");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    logger.info("Sending lead_confirmation template...");

    const leadConfirmationResult = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_confirmation",
      variables: {
        first_name: "John",
        email: testEmail,
        tenant_name: "Test Company Ltd",
        role: "Fleet Manager",
        dashboard_url: `${appUrl}/dashboard`,
        company_name: "Test Company Ltd",
        fleet_size: "51-100 vehicles",
        country_name: "United States",
      },
      countryCode: "US",
      fallbackLocale: "en",
    });

    if (leadConfirmationResult.success) {
      logger.info("✅ Lead confirmation email sent successfully!");
      logger.info(`   Locale: ${leadConfirmationResult.locale}`);
      logger.info(`   Message ID: ${leadConfirmationResult.messageId}\n`);
    } else {
      logger.error("❌ Failed to send lead confirmation email");
      logger.error(`   Error: ${leadConfirmationResult.error}\n`);
    }

    // Test 2: Sales Rep Assignment Email
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("Test 2: Sales Rep Assignment Email (NEW Template)");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    logger.info("Sending sales_rep_assignment template...");

    const salesRepResult = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "sales_rep_assignment",
      variables: {
        employee_name: "Sales Rep",
        lead_name: "Test Lead",
        company_name: "Test Lead Company",
        priority: "high",
        fit_score: 50,
        qualification_score: 72,
        lead_stage: "Sales Qualified",
        fleet_size: "101-200 vehicles",
        country_code: "US",
        lead_detail_url: `${appUrl}/crm/leads/test-lead-123`,
      },
      countryCode: "US",
      fallbackLocale: "en",
    });

    if (salesRepResult.success) {
      logger.info("✅ Sales rep assignment email sent successfully!");
      logger.info(`   Locale: ${salesRepResult.locale}`);
      logger.info(`   Message ID: ${salesRepResult.messageId}\n`);
    } else {
      logger.error("❌ Failed to send sales rep assignment email");
      logger.error(`   Error: ${salesRepResult.error}\n`);
    }

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 TEST SUMMARY");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const totalTests = 2;
    const successCount =
      (leadConfirmationResult.success ? 1 : 0) +
      (salesRepResult.success ? 1 : 0);
    const failureCount = totalTests - successCount;

    logger.info(`Total tests: ${totalTests}`);
    logger.info(`✅ Successful: ${successCount}`);
    logger.info(`❌ Failed: ${failureCount}\n`);

    if (successCount === totalTests) {
      logger.info("🎉 All tests passed!");
      logger.info(`📬 Check ${testEmail} inbox for 2 HTML emails\n`);
      logger.info("Next steps:");
      logger.info("   1. Validate email design in inbox");
      logger.info(
        "   2. Check rendering across email clients (Gmail, Outlook)"
      );
      logger.info("   3. Verify all {{variables}} are properly replaced");
      logger.info(
        "   4. If approved → proceed to Phase 2 (8 remaining templates)\n"
      );
    } else {
      logger.error("⚠️  Some tests failed. Check logs above for details.\n");
    }

    // Close database connection
    await prisma.$disconnect();

    process.exit(successCount === totalTests ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ Test script failed with error");
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Execute
void testEmailSend();
