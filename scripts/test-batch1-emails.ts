import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test BATCH 1 - 5 Email Templates
 *
 * Templates tested:
 * 1. sales_rep_assignment
 * 2. lead_followup
 * 3. member_welcome
 * 4. member_password_reset
 * 5. vehicle_inspection_reminder
 */

async function testBatch1() {
  logger.info("📧 Testing BATCH 1 - 5 email templates...\n");

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
    process.exit(1);
  }

  const testEmail = process.env.TEST_EMAIL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (!testEmail || !appUrl) {
    throw new Error("TEST_EMAIL and NEXT_PUBLIC_APP_URL are required");
  }

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}\n`);

  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);
  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  try {
    // Template 1: Sales Rep Assignment
    logger.info("1️⃣  Sending sales_rep_assignment...");
    const result1 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "sales_rep_assignment",
      variables: {
        employee_name: "Ahmed Hassan",
        lead_name: "John Smith",
        company_name: "Test Company Ltd",
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
    results.push({
      name: "sales_rep_assignment",
      success: result1.success,
      error: result1.error,
    });
    logger.info(
      result1.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result1.error}\n`
    );

    // Template 2: Lead Followup
    logger.info("2️⃣  Sending lead_followup...");
    const result2 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_followup",
      variables: {
        first_name: "John",
        company_name: "Test Company Ltd",
        demo_link: `${appUrl}/book-demo`,
        sales_rep_name: "Ahmed Hassan",
      },
      countryCode: "US",
      fallbackLocale: "en",
    });
    results.push({
      name: "lead_followup",
      success: result2.success,
      error: result2.error,
    });
    logger.info(
      result2.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result2.error}\n`
    );

    // Template 3: Member Welcome
    logger.info("3️⃣  Sending member_welcome (UAE + English)...");
    const result3 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Mohammed",
        tenant_name: "Dubai Fleet Operations",
        email: testEmail,
        role: "Fleet Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "AE", // ✅ KEEP: UAE is correct
      locale: "en", // ✅ FIX: SELECT English (not Arabic)
      fallbackLocale: "en",
    });
    results.push({
      name: "member_welcome",
      success: result3.success,
      error: result3.error,
    });
    logger.info(
      result3.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result3.error}\n`
    );

    // Template 4: Member Password Reset
    logger.info("4️⃣  Sending member_password_reset (UAE + English)...");
    const result4 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_password_reset",
      variables: {
        first_name: "Mohammed",
        reset_link: `${appUrl}/reset-password?token=test123`,
        expiry_hours: "24",
      },
      countryCode: "AE", // ✅ KEEP
      locale: "en", // ✅ FIX
      fallbackLocale: "en",
    });
    results.push({
      name: "member_password_reset",
      success: result4.success,
      error: result4.error,
    });
    logger.info(
      result4.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result4.error}\n`
    );

    // Template 5: Vehicle Inspection Reminder
    logger.info("5️⃣  Sending vehicle_inspection_reminder (UAE + English)...");
    const result5 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "vehicle_inspection_reminder",
      variables: {
        fleet_manager_name: "Ahmed Al Maktoum",
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
        vehicle_plate: "ABC-123",
        due_date: "2025-12-15",
        days_remaining: "7",
        booking_link: `${appUrl}/inspections/book`,
      },
      countryCode: "AE", // ✅ KEEP
      locale: "en", // ✅ FIX
      fallbackLocale: "en",
    });
    results.push({
      name: "vehicle_inspection_reminder",
      success: result5.success,
      error: result5.error,
    });
    logger.info(
      result5.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result5.error}\n`
    );

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 BATCH 1 TEST SUMMARY");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Total: ${results.length}`);
    logger.info(`✅ Successful: ${successCount}`);
    logger.info(`❌ Failed: ${failureCount}\n`);

    if (failureCount > 0) {
      logger.info("Failed templates:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          logger.info(`   - ${r.name}: ${r.error}`);
        });
      logger.info("");
    }

    if (successCount === results.length) {
      logger.info(`🎉 All BATCH 1 tests passed!`);
      logger.info(`📬 Check ${testEmail} inbox for 5 HTML emails\n`);
    }

    await prisma.$disconnect();
    process.exit(successCount === results.length ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ Test script failed");
    await prisma.$disconnect();
    process.exit(1);
  }
}

void testBatch1();
