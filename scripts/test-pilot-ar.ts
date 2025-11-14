import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

async function testArabicEmail() {
  logger.info("📧 Testing Arabic Member Welcome email (PILOT)...\n");

  const testEmail = process.env.TEST_EMAIL || "mohamed@bluewise.io";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io";

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}`);
  logger.info(`🇦🇪 Language: Arabic (ar) with RTL\n`);

  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);

  try {
    logger.info("Sending member_welcome in Arabic...");

    const result = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "محمد",
        tenant_name: "أسطول دبي",
        email: testEmail,
        role: "مدير الأسطول",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });

    if (result.success) {
      logger.info("✅ Arabic email sent successfully!");
      logger.info(`   Locale used: ${result.locale}`);
      logger.info(`   Message ID: ${result.messageId}\n`);
      logger.info(`📬 Check ${testEmail} inbox for Arabic RTL version`);
      logger.info("\n🔍 VALIDATION CHECKLIST:");
      logger.info("   ✓ Text flows right-to-left (RTL)");
      logger.info("   ✓ Logo is centered and clickable");
      logger.info("   ✓ Arabic translation is professional and formal");
      logger.info("   ✓ All alignments are correct");
      logger.info("   ✓ Button works (الوصول إلى لوحة التحكم)");
      logger.info("   ✓ Responsive design on mobile\n");
    } else {
      logger.error("❌ Failed to send Arabic email");
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

void testArabicEmail();
