import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

const testEmail = process.env.TEST_EMAIL || "mohamed@bluewise.io";
const notificationService = new NotificationService();

async function testCIDLogo() {
  logger.info("🧪 Testing CID Logo Embedding...\n");
  logger.info(`📬 Target email: ${testEmail}\n`);

  try {
    const result = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Mohamed",
        tenant_name: "FleetCore Test",
        email: testEmail,
        role: "Administrator",
        dashboard_url: "https://app.fleetcore.io/dashboard",
      },
      countryCode: "AE",
      locale: "en",
      fallbackLocale: "en",
    });

    if (result.success) {
      logger.info("✅ Email sent successfully with CID logo!");
      logger.info(`📧 Message ID: ${result.messageId}`);
      logger.info(`🌍 Locale: ${result.locale}`);
      logger.info(`📊 CASCADE: ${result.metadata?.cascadeSource}\n`);
      logger.info("🔍 Check your inbox:");
      logger.info("   1. Logo should appear (no broken image)");
      logger.info("   2. NO download icon on hover");
      logger.info("   3. Logo works on mobile\n");
    } else {
      logger.error(`❌ Email failed: ${result.error}`);
      logger.error({ result }, "Full result:");
    }
  } catch (error) {
    logger.error({ error }, "❌ Test failed:");
  }
}

void testCIDLogo();
