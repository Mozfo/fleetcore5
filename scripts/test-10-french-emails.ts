import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test 10 French Email Templates
 *
 * Sends all 10 remaining French templates (excluding member_welcome already tested)
 */

async function test10FrenchEmails() {
  logger.info("📧 Testing 10 French email templates...\n");

  const testEmail = process.env.TEST_EMAIL || "mohamed@bluewise.io";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io";

  logger.info(`📬 Target email: ${testEmail}`);
  logger.info(`🌐 App URL: ${appUrl}`);
  logger.info(`🇫🇷 Language: French (fr)\n`);

  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);

  const results: Array<{ name: string; success: boolean; error?: string }> = [];

  try {
    // 1. Lead Confirmation
    logger.info("1️⃣  Sending lead_confirmation (FR)...");
    const result1 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_confirmation",
      variables: {
        first_name: "Jean",
        company_name: "Paris VTC Services",
        fleet_size: "51-100 véhicules",
        country_name: "France",
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "lead_confirmation",
      success: result1.success,
      error: result1.error,
    });
    logger.info(
      result1.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result1.error}\n`
    );

    // 2. Sales Rep Assignment
    logger.info("2️⃣  Sending sales_rep_assignment (FR)...");
    const result2 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "sales_rep_assignment",
      variables: {
        employee_name: "Marie Dubois",
        lead_name: "Jean Dupont",
        company_name: "Paris VTC Services",
        priority: "high",
        fit_score: 55,
        qualification_score: 78,
        lead_stage: "Qualifié commercial",
        fleet_size: "101-200 véhicules",
        country_code: "FR",
        lead_detail_url: `${appUrl}/crm/leads/test-lead-fr`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "sales_rep_assignment",
      success: result2.success,
      error: result2.error,
    });
    logger.info(
      result2.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result2.error}\n`
    );

    // 3. Lead Followup
    logger.info("3️⃣  Sending lead_followup (FR)...");
    const result3 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "lead_followup",
      variables: {
        first_name: "Jean",
        company_name: "Paris VTC Services",
        demo_link: `${appUrl}/demo/reserver`,
        sales_rep_name: "Marie Dubois",
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "lead_followup",
      success: result3.success,
      error: result3.error,
    });
    logger.info(
      result3.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result3.error}\n`
    );

    // 4. Member Password Reset
    logger.info("4️⃣  Sending member_password_reset (FR)...");
    const result4 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_password_reset",
      variables: {
        first_name: "Jean",
        reset_link: `${appUrl}/reset-password?token=test-fr-123`,
        expiry_hours: "24",
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "member_password_reset",
      success: result4.success,
      error: result4.error,
    });
    logger.info(
      result4.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result4.error}\n`
    );

    // 5. Vehicle Inspection Reminder
    logger.info("5️⃣  Sending vehicle_inspection_reminder (FR)...");
    const result5 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "vehicle_inspection_reminder",
      variables: {
        fleet_manager_name: "Pierre Martin",
        vehicle_make: "Renault",
        vehicle_model: "Talisman",
        vehicle_plate: "AB-123-CD",
        due_date: "2025-12-15",
        days_remaining: "7",
        booking_link: `${appUrl}/inspections/reserver`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "vehicle_inspection_reminder",
      success: result5.success,
      error: result5.error,
    });
    logger.info(
      result5.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result5.error}\n`
    );

    // 6. Insurance Expiry Alert
    logger.info("6️⃣  Sending insurance_expiry_alert (FR)...");
    const result6 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "insurance_expiry_alert",
      variables: {
        fleet_manager_name: "Pierre Martin",
        vehicle_make: "Renault",
        vehicle_model: "Talisman",
        vehicle_plate: "AB-123-CD",
        expiry_date: "2025-12-31",
        days_remaining: "3",
        insurance_provider: "AXA Assurances",
        policy_number: "POL-FR-123456",
        insurance_details_url: `${appUrl}/assurance/details`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "insurance_expiry_alert",
      success: result6.success,
      error: result6.error,
    });
    logger.info(
      result6.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result6.error}\n`
    );

    // 7. Driver Onboarding
    logger.info("7️⃣  Sending driver_onboarding (FR)...");
    const result7 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "driver_onboarding",
      variables: {
        driver_name: "François Lefebvre",
        fleet_name: "Paris VTC Services",
        driver_id: "DRV-FR-12345",
        start_date: "2025-12-01",
        fleet_manager_name: "Pierre Martin",
        driver_portal_url: `${appUrl}/chauffeur`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "driver_onboarding",
      success: result7.success,
      error: result7.error,
    });
    logger.info(
      result7.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result7.error}\n`
    );

    // 8. Maintenance Scheduled
    logger.info("8️⃣  Sending maintenance_scheduled (FR)...");
    const result8 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "maintenance_scheduled",
      variables: {
        driver_name: "François Lefebvre",
        vehicle_make: "Renault",
        vehicle_model: "Talisman",
        vehicle_plate: "AB-123-CD",
        maintenance_date: "2025-12-15",
        maintenance_time: "10h00",
        maintenance_location: "Centre de service Paris",
        maintenance_type: "Entretien régulier",
        estimated_duration: "2 heures",
        maintenance_details_url: `${appUrl}/maintenance/details`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "maintenance_scheduled",
      success: result8.success,
      error: result8.error,
    });
    logger.info(
      result8.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result8.error}\n`
    );

    // 9. Critical Alert
    logger.info("9️⃣  Sending critical_alert (FR)...");
    const result9 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "critical_alert",
      variables: {
        alert_title: "Panne de connexion base de données",
        alert_time: "2025-11-13 10:30",
        severity: "CRITIQUE",
        affected_items: "3 tenants, 15 utilisateurs",
        alert_description:
          "La connexion à la base de données principale a été perdue. Les services fonctionnent en mode dégradé.",
        recommended_action:
          "Vérifier immédiatement l'état du serveur de base de données et la connectivité réseau.",
        alert_url: `${appUrl}/alertes/123`,
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "critical_alert",
      success: result9.success,
      error: result9.error,
    });
    logger.info(
      result9.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result9.error}\n`
    );

    // 10. Webhook Test
    logger.info("🔟 Sending webhook_test (FR)...");
    const result10 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "webhook_test",
      variables: {
        timestamp: "2025-11-13 10:30:45 UTC",
        test_id: "TEST-FR-123456",
      },
      countryCode: "FR",
      fallbackLocale: "fr",
    });
    results.push({
      name: "webhook_test",
      success: result10.success,
      error: result10.error,
    });
    logger.info(
      result10.success ? "   ✅ Envoyé\n" : `   ❌ Échec: ${result10.error}\n`
    );

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 RÉSUMÉ DES TESTS");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Total templates: ${results.length}`);
    logger.info(`✅ Envoyés avec succès: ${successCount}`);
    logger.info(`❌ Échecs: ${failureCount}\n`);

    if (failureCount > 0) {
      logger.info("Templates échoués:");
      results
        .filter((r) => !r.success)
        .forEach((r) => {
          logger.info(`   - ${r.name}: ${r.error}`);
        });
      logger.info("");
    }

    if (successCount === results.length) {
      logger.info("🎉 Tous les tests ont réussi!");
      logger.info(`📬 Vérifiez ${testEmail} pour 10 emails HTML en français\n`);
    } else {
      logger.error(
        "⚠️  Certains tests ont échoué. Vérifiez les logs ci-dessus.\n"
      );
    }

    await prisma.$disconnect();
    process.exit(successCount === results.length ? 0 : 1);
  } catch (error) {
    logger.error({ error }, "❌ Le script de test a échoué");
    await prisma.$disconnect();
    process.exit(1);
  }
}

void test10FrenchEmails();
