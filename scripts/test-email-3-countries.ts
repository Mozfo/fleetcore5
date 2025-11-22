/**
 * Test Email Sending with 3 Countries
 *
 * This script sends test emails for expansion opportunities to verify
 * that English prepositions are correctly applied in email templates.
 *
 * Tests:
 * - France: "not yet available in France"
 * - United States: "not yet available in the United States"
 * - United Kingdom: "not yet available in the United Kingdom"
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

const TEST_EMAIL = process.env.TEST_EMAIL || "mohamed@bluewise.io";

async function sendTestEmails() {
  logger.info("📧 Testing Email Templates with English Prepositions\n");
  logger.info(`Sending test emails to: ${TEST_EMAIL}\n`);
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const testCases = [
    {
      code: "FR",
      expectedText: "not yet available in France",
    },
    {
      code: "US",
      expectedText: "not yet available in the United States",
    },
    {
      code: "GB",
      expectedText: "not yet available in the United Kingdom",
    },
  ];

  for (const testCase of testCases) {
    logger.info(`\n📍 Testing ${testCase.code}`);
    logger.info(`   Expected in email: "${testCase.expectedText}"`);

    try {
      // Get country from database
      const country = await prisma.crm_countries.findUnique({
        where: { country_code: testCase.code },
      });

      if (!country) {
        logger.error(`   ❌ Country ${testCase.code} not found`);
        continue;
      }

      logger.info(
        `   Sending with preposition: "${country.country_preposition_en}"`
      );
      logger.info(`   Sending with country_name: "${country.country_name_en}"`);

      // Send email
      const result = await notificationService.sendEmail({
        recipientEmail: TEST_EMAIL,
        templateCode: "expansion_opportunity",
        locale: "en",
        variables: {
          first_name: "John",
          company_name: `Test Company ${testCase.code}`,
          fleet_size: "10-50",
          country_preposition: country.country_preposition_en,
          country_name: country.country_name_en,
          phone: "+1234567890",
          message: "Testing English prepositions",
        },
      });

      if (result.success) {
        logger.info(
          `   ✅ Email sent successfully (ID: ${result.data?.messageId || "N/A"})`
        );
        logger.info(`   📨 Check your inbox for: "${testCase.expectedText}"`);
      } else {
        logger.error({ error: result.error }, `   ❌ Failed to send email`);
      }
    } catch (error) {
      logger.error({ error }, `   ❌ Error processing ${testCase.code}`);
    }
  }

  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  logger.info("✅ All test emails queued");
  logger.info(`📬 Check ${TEST_EMAIL} inbox for 3 emails\n`);
  logger.info("Expected emails:");
  logger.info('   1. France: "...not yet available in France..."');
  logger.info('   2. USA: "...not yet available in the United States..."');
  logger.info('   3. UK: "...not yet available in the United Kingdom..."\n');
}

sendTestEmails()
  .then(() => {
    logger.info("✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      { error: error.message, stack: error.stack },
      "❌ Test failed"
    );
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
