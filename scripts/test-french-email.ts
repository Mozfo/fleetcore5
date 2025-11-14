import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

async function testFrenchEmail() {
  logger.info("📧 Testing French Member Welcome email...\n");

  const testEmail = process.env.TEST_EMAIL || "mohamed@bluewise.io";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io";

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}`);
  logger.info(`🇫🇷 Language: French (fr)\n`);

  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);

  try {
    logger.info("Sending member_welcome in French...");

    const result = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Mohammed",
        tenant_name: "Paris VTC Services",
        email: testEmail,
        role: "Gestionnaire de flotte",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });

    if (result.success) {
      logger.info("✅ French email sent successfully!");
      logger.info(`   Locale used: ${result.locale}`);
      logger.info(`   Message ID: ${result.messageId}\n`);
      logger.info(`📬 Check ${testEmail} inbox for French version`);
    } else {
      logger.error("❌ Failed to send French email");
      logger.error(`   Error: ${result.error}\n`);
    }

    await prisma.$disconnect();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ Test script failed");
    await prisma.$disconnect();
    process.exit(1);
  }
}

void testFrenchEmail();
