import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test All Email Templates
 *
 * This script sends all 11 email templates to a test email address
 * to validate design, responsiveness, and template rendering.
 *
 * Templates tested:
 * 1. lead_confirmation (CRM)
 * 2. sales_rep_assignment (CRM)
 * 3. lead_followup (CRM)
 * 4. member_welcome (ADM)
 * 5. member_password_reset (ADM)
 * 6. vehicle_inspection_reminder (FLEET)
 * 7. insurance_expiry_alert (FLEET)
 * 8. driver_onboarding (DRIVER)
 * 9. maintenance_scheduled (MAINTENANCE)
 * 10. critical_alert (SYSTEM)
 * 11. webhook_test (SYSTEM)
 *
 * Usage:
 * ```bash
 * TEST_EMAIL=your@email.com NEXT_PUBLIC_APP_URL=https://app.fleetcore.com pnpm exec tsx scripts/test-all-emails.ts
 * ```
 */

async function testAllEmails() {
  logger.info("📧 Testing all 11 email templates...\n");

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
    logger.info("  NEXT_PUBLIC_APP_URL=https://app.fleetcore.com \\");
    logger.info("  pnpm exec tsx scripts/test-all-emails.ts\n");
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

  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  try {
    // Template 1: Lead Confirmation
    logger.info("1️⃣  Sending lead_confirmation...");
    const result1 = await notificationService.sendEmail({
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
    results.push({
      name: "lead_confirmation",
      success: result1.success,
      error: result1.error,
    });
    logger.info(
      result1.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result1.error}\n`
    );

    // Template 2: Sales Rep Assignment
    logger.info("2️⃣  Sending sales_rep_assignment...");
    const result2 = await notificationService.sendEmail({
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
      success: result2.success,
      error: result2.error,
    });
    logger.info(
      result2.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result2.error}\n`
    );

    // Template 3: Lead Followup
    logger.info("3️⃣  Sending lead_followup...");
    const result3 = await notificationService.sendEmail({
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
      success: result3.success,
      error: result3.error,
    });
    logger.info(
      result3.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result3.error}\n`
    );

    // Template 4: Member Welcome
    logger.info("4️⃣  Sending member_welcome...");
    const result4 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Mohammed",
        tenant_name: "Dubai Fleet Operations",
        email: testEmail,
        role: "Fleet Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "member_welcome",
      success: result4.success,
      error: result4.error,
    });
    logger.info(
      result4.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result4.error}\n`
    );

    // Template 5: Member Password Reset
    logger.info("5️⃣  Sending member_password_reset...");
    const result5 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_password_reset",
      variables: {
        first_name: "Mohammed",
        reset_link: `${appUrl}/reset-password?token=test123`,
        expiry_hours: "24",
      },
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "member_password_reset",
      success: result5.success,
      error: result5.error,
    });
    logger.info(
      result5.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result5.error}\n`
    );

    // Template 6: Vehicle Inspection Reminder
    logger.info("6️⃣  Sending vehicle_inspection_reminder...");
    const result6 = await notificationService.sendEmail({
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
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "vehicle_inspection_reminder",
      success: result6.success,
      error: result6.error,
    });
    logger.info(
      result6.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result6.error}\n`
    );

    // Template 7: Insurance Expiry Alert
    logger.info("7️⃣  Sending insurance_expiry_alert...");
    const result7 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "insurance_expiry_alert",
      variables: {
        fleet_manager_name: "Ahmed Al Maktoum",
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
        vehicle_plate: "ABC-123",
        expiry_date: "2025-12-31",
        days_remaining: "3",
        insurance_provider: "AXA Insurance",
        policy_number: "POL-123456",
        insurance_details_url: `${appUrl}/insurance/details`,
      },
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "insurance_expiry_alert",
      success: result7.success,
      error: result7.error,
    });
    logger.info(
      result7.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result7.error}\n`
    );

    // Template 8: Driver Onboarding
    logger.info("8️⃣  Sending driver_onboarding...");
    const result8 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "driver_onboarding",
      variables: {
        driver_name: "Mohammed Ali",
        fleet_name: "Dubai Fleet Operations",
        driver_id: "DRV-12345",
        start_date: "2025-12-01",
        fleet_manager_name: "Ahmed Hassan",
        driver_portal_url: `${appUrl}/driver`,
      },
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "driver_onboarding",
      success: result8.success,
      error: result8.error,
    });
    logger.info(
      result8.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result8.error}\n`
    );

    // Template 9: Maintenance Scheduled
    logger.info("9️⃣  Sending maintenance_scheduled...");
    const result9 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "maintenance_scheduled",
      variables: {
        driver_name: "Mohammed Ali",
        vehicle_make: "Toyota",
        vehicle_model: "Camry",
        vehicle_plate: "ABC-123",
        maintenance_date: "2025-12-15",
        maintenance_time: "10:00 AM",
        maintenance_location: "Dubai Service Center",
        maintenance_type: "Regular Service",
        estimated_duration: "2 hours",
        maintenance_details_url: `${appUrl}/maintenance/details`,
      },
      countryCode: "AE",
      fallbackLocale: "en",
    });
    results.push({
      name: "maintenance_scheduled",
      success: result9.success,
      error: result9.error,
    });
    logger.info(
      result9.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result9.error}\n`
    );

    // Template 10: Critical Alert
    logger.info("🔟 Sending critical_alert...");
    const result10 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "critical_alert",
      variables: {
        alert_title: "Database Connection Failure",
        alert_time: "2025-11-13 10:30 AM",
        severity: "CRITICAL",
        affected_items: "3 tenants, 15 users",
        alert_description:
          "The primary database connection has been lost. Services are operating in degraded mode.",
        recommended_action:
          "Check database server status and network connectivity immediately.",
        alert_url: `${appUrl}/alerts/123`,
      },
      countryCode: "US",
      fallbackLocale: "en",
    });
    results.push({
      name: "critical_alert",
      success: result10.success,
      error: result10.error,
    });
    logger.info(
      result10.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result10.error}\n`
    );

    // Template 11: Webhook Test
    logger.info("1️⃣1️⃣ Sending webhook_test...");
    const result11 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "webhook_test",
      variables: {
        timestamp: "2025-11-13 10:30:45 UTC",
        test_id: "TEST-123456",
      },
      countryCode: "US",
      fallbackLocale: "en",
    });
    results.push({
      name: "webhook_test",
      success: result11.success,
      error: result11.error,
    });
    logger.info(
      result11.success ? "   ✅ Sent\n" : `   ❌ Failed: ${result11.error}\n`
    );

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 TEST SUMMARY");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Total templates: ${results.length}`);
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
      logger.info("🎉 All tests passed!");
      logger.info(`📬 Check ${testEmail} inbox for 11 HTML emails\n`);
      logger.info("Next steps:");
      logger.info("   1. Validate email design in inbox");
      logger.info(
        "   2. Check rendering across email clients (Gmail, Outlook, Yahoo)"
      );
      logger.info("   3. Verify all {{variables}} are properly replaced");
      logger.info("   4. Test responsive design on mobile devices\n");
    } else {
      logger.error("⚠️  Some tests failed. Check logs above for details.\n");
    }

    // Close database connection
    await prisma.$disconnect();

    process.exit(successCount === results.length ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ Test script failed with error");
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Execute
void testAllEmails();
