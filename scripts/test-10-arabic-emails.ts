import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test 10 Arabic Email Templates with RTL
 *
 * Sends all 10 remaining Arabic templates (excluding member_welcome already tested)
 */

async function test10ArabicEmails() {
  logger.info("📧 Testing 10 Arabic email templates with RTL...\n");

  const testEmail = process.env.TEST_EMAIL || "mohamed@bluewise.io";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io";

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}`);
  logger.info(`🇦🇪 Language: Arabic (ar) with RTL\n`);

  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);

  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  try {
    // 1. Lead Confirmation
    logger.info("1️⃣  Sending lead_confirmation (AR)...");
    const result1 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_confirmation",
      variables: {
        first_name: "محمد",
        company_name: "أسطول دبي",
        fleet_size: "51-100 مركبة",
        country_name: "الإمارات العربية المتحدة",
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "lead_confirmation",
      success: result1.success,
      error: result1.error,
    });
    logger.info(
      result1.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result1.error}\n`
    );

    // 2. Sales Rep Assignment
    logger.info("2️⃣  Sending sales_rep_assignment (AR)...");
    const result2 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "sales_rep_assignment",
      variables: {
        employee_name: "أحمد حسن",
        lead_name: "محمد علي",
        company_name: "أسطول دبي",
        priority: "high",
        fit_score: 55,
        qualification_score: 78,
        lead_stage: "مؤهل تجاريا",
        fleet_size: "101-200 مركبة",
        country_code: "AE",
        lead_detail_url: `${appUrl}/crm/leads/test-lead-ar`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "sales_rep_assignment",
      success: result2.success,
      error: result2.error,
    });
    logger.info(
      result2.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result2.error}\n`
    );

    // 3. Lead Followup
    logger.info("3️⃣  Sending lead_followup (AR)...");
    const result3 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_followup",
      variables: {
        first_name: "محمد",
        company_name: "أسطول دبي",
        demo_link: `${appUrl}/demo/حجز`,
        sales_rep_name: "أحمد حسن",
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "lead_followup",
      success: result3.success,
      error: result3.error,
    });
    logger.info(
      result3.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result3.error}\n`
    );

    // 4. Member Password Reset
    logger.info("4️⃣  Sending member_password_reset (AR)...");
    const result4 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_password_reset",
      variables: {
        first_name: "محمد",
        reset_link: `${appUrl}/reset-password?token=test-ar-123`,
        expiry_hours: "24",
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "member_password_reset",
      success: result4.success,
      error: result4.error,
    });
    logger.info(
      result4.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result4.error}\n`
    );

    // 5. Vehicle Inspection Reminder
    logger.info("5️⃣  Sending vehicle_inspection_reminder (AR)...");
    const result5 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "vehicle_inspection_reminder",
      variables: {
        fleet_manager_name: "أحمد المكتوم",
        vehicle_make: "تويوتا",
        vehicle_model: "كامري",
        vehicle_plate: "أ-12345",
        due_date: "2025-12-15",
        days_remaining: "7",
        booking_link: `${appUrl}/فحوصات/حجز`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "vehicle_inspection_reminder",
      success: result5.success,
      error: result5.error,
    });
    logger.info(
      result5.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result5.error}\n`
    );

    // 6. Insurance Expiry Alert
    logger.info("6️⃣  Sending insurance_expiry_alert (AR)...");
    const result6 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "insurance_expiry_alert",
      variables: {
        fleet_manager_name: "أحمد المكتوم",
        vehicle_make: "تويوتا",
        vehicle_model: "كامري",
        vehicle_plate: "أ-12345",
        expiry_date: "2025-12-31",
        days_remaining: "3",
        insurance_provider: "شركة التأمين الوطنية",
        policy_number: "POL-AR-123456",
        insurance_details_url: `${appUrl}/تأمين/تفاصيل`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "insurance_expiry_alert",
      success: result6.success,
      error: result6.error,
    });
    logger.info(
      result6.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result6.error}\n`
    );

    // 7. Driver Onboarding
    logger.info("7️⃣  Sending driver_onboarding (AR)...");
    const result7 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "driver_onboarding",
      variables: {
        driver_name: "محمد علي",
        fleet_name: "أسطول دبي",
        driver_id: "DRV-AR-12345",
        start_date: "2025-12-01",
        fleet_manager_name: "أحمد حسن",
        driver_portal_url: `${appUrl}/سائق`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "driver_onboarding",
      success: result7.success,
      error: result7.error,
    });
    logger.info(
      result7.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result7.error}\n`
    );

    // 8. Maintenance Scheduled
    logger.info("8️⃣  Sending maintenance_scheduled (AR)...");
    const result8 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "maintenance_scheduled",
      variables: {
        driver_name: "محمد علي",
        vehicle_make: "تويوتا",
        vehicle_model: "كامري",
        vehicle_plate: "أ-12345",
        maintenance_date: "2025-12-15",
        maintenance_time: "10:00 صباحاً",
        maintenance_location: "مركز خدمة دبي",
        maintenance_type: "صيانة دورية",
        estimated_duration: "ساعتان",
        maintenance_details_url: `${appUrl}/صيانة/تفاصيل`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "maintenance_scheduled",
      success: result8.success,
      error: result8.error,
    });
    logger.info(
      result8.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result8.error}\n`
    );

    // 9. Critical Alert
    logger.info("9️⃣  Sending critical_alert (AR)...");
    const result9 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "critical_alert",
      variables: {
        alert_title: "فشل الاتصال بقاعدة البيانات",
        alert_time: "2025-11-13 10:30",
        severity: "حرج",
        affected_items: "3 مستأجرين، 15 مستخدم",
        alert_description:
          "فُقد الاتصال بقاعدة البيانات الرئيسية. تعمل الخدمات في وضع محدود.",
        recommended_action:
          "تحقق فوراً من حالة خادم قاعدة البيانات واتصال الشبكة.",
        alert_url: `${appUrl}/تنبيهات/123`,
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "critical_alert",
      success: result9.success,
      error: result9.error,
    });
    logger.info(
      result9.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result9.error}\n`
    );

    // 10. Webhook Test
    logger.info("🔟 Sending webhook_test (AR)...");
    const result10 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "webhook_test",
      variables: {
        timestamp: "2025-11-13 10:30:45 UTC",
        test_id: "TEST-AR-123456",
      },
      countryCode: "AE",
      fallbackLocale: "ar",
    });
    results.push({
      name: "webhook_test",
      success: result10.success,
      error: result10.error,
    });
    logger.info(
      result10.success ? "   ✅ أُرسل\n" : `   ❌ فشل: ${result10.error}\n`
    );

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 ملخص الاختبارات");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`إجمالي القوالب: ${results.length}`);
    logger.info(`✅ تم الإرسال بنجاح: ${successCount}`);
    logger.info(`❌ فشل: ${failureCount}\n`);

    if (failureCount > 0) {
      logger.info("القوالب الفاشلة:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          logger.info(`   - ${r.name}: ${r.error}`);
        });
      logger.info("");
    }

    if (successCount === results.length) {
      logger.info("🎉 نجحت جميع الاختبارات!");
      logger.info(`📬 تحقق من ${testEmail} لـ 10 رسائل HTML بالعربية مع RTL\n`);
      logger.info("🔍 VALIDATION CHECKLIST:");
      logger.info("   ✓ Text flows right-to-left (RTL)");
      logger.info("   ✓ Logos centered and clickable");
      logger.info("   ✓ Arabic translations professional");
      logger.info("   ✓ All alignments correct");
      logger.info("   ✓ All buttons functional\n");
    } else {
      logger.error("⚠️  بعض الاختبارات فشلت. تحقق من السجلات أعلاه.\n");
    }

    await prisma.$disconnect();
    process.exit(successCount === results.length ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ فشل سكريبت الاختبار");
    await prisma.$disconnect();
    process.exit(1);
  }
}

void test10ArabicEmails();
