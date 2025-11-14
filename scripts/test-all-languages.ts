import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

/**
 * Test des emails en FRANÇAIS et ARABE
 */
async function testAllLanguages() {
  try {
    logger.info("🧪 TEST EMAILS - FRANÇAIS & ARABE\n");

    // Cleanup
    logger.info("🧹 Cleanup...");
    await prisma.crm_leads.deleteMany({
      where: {
        email: "mohamed@bluewise.io",
      },
    });
    logger.info("   ✅ Cleanup terminé\n");

    const notificationService = new NotificationService();

    // ==================== TEST 1: EMAIL FRANÇAIS (France - Opérationnel) ====================
    logger.info("📧 TEST 1: Email FRANÇAIS (lead_confirmation)");

    const leadFR = await prisma.crm_leads.create({
      data: {
        first_name: "Pierre",
        last_name: "Dubois",
        email: "mohamed@bluewise.io",
        demo_company_name: "Paris VTC Premium",
        fleet_size: "201-500 vehicles",
        phone: "+33612345678",
        message: "Demande de démonstration pour notre flotte parisienne",
        country_code: "FR",
        status: "new",
      },
    });

    const resultFR = await notificationService.sendEmail({
      recipientEmail: leadFR.email,
      templateCode: "lead_confirmation",
      variables: {
        first_name: leadFR.first_name,
        company_name: leadFR.demo_company_name,
        fleet_size: leadFR.fleet_size,
        country_name: "France",
      },
      leadId: leadFR.id,
      countryCode: "FR",
      fallbackLocale: "fr",
    });

    logger.info(
      `   ✅ Email FR envoyé: ${resultFR.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`   - Locale: ${resultFR.locale}`);
    logger.info(`   - Message ID: ${resultFR.messageId || "N/A"}\n`);

    // Delete pour réutiliser l'email
    await prisma.crm_leads.delete({ where: { id: leadFR.id } });
    logger.info("   🧹 Lead FR supprimé\n");

    // ==================== TEST 2: EMAIL ARABE (UAE - Opérationnel) ====================
    logger.info("📧 TEST 2: Email ARABE (lead_confirmation)");

    const leadAR = await prisma.crm_leads.create({
      data: {
        first_name: "محمد",
        last_name: "الأحمد",
        email: "mohamed@bluewise.io",
        demo_company_name: "دبي للنقل الذكي",
        fleet_size: "101-200 vehicles",
        phone: "+971501234567",
        message: "طلب عرض توضيحي للمنصة",
        country_code: "AE",
        status: "new",
      },
    });

    const resultAR = await notificationService.sendEmail({
      recipientEmail: leadAR.email,
      templateCode: "lead_confirmation",
      variables: {
        first_name: leadAR.first_name,
        company_name: leadAR.demo_company_name,
        fleet_size: leadAR.fleet_size,
        country_name: "الإمارات العربية المتحدة",
      },
      leadId: leadAR.id,
      countryCode: "AE",
      fallbackLocale: "ar",
    });

    logger.info(
      `   ✅ Email AR envoyé: ${resultAR.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`   - Locale: ${resultAR.locale}`);
    logger.info(`   - Message ID: ${resultAR.messageId || "N/A"}\n`);

    // Delete pour réutiliser l'email
    await prisma.crm_leads.delete({ where: { id: leadAR.id } });
    logger.info("   🧹 Lead AR supprimé\n");

    // ==================== TEST 3: EXPANSION FR (Espagne) ====================
    logger.info(
      "📧 TEST 3: Email FRANÇAIS - EXPANSION (expansion_opportunity)"
    );

    const leadExpansionFR = await prisma.crm_leads.create({
      data: {
        first_name: "Carlos",
        last_name: "García",
        email: "mohamed@bluewise.io",
        demo_company_name: "Madrid Transportes SL",
        fleet_size: "51-100 vehicles",
        phone: "+34612345678",
        message: "Intéressé par FleetCore pour notre flotte à Madrid",
        country_code: "ES",
        status: "new",
      },
    });

    const resultExpansionFR = await notificationService.sendEmail({
      recipientEmail: leadExpansionFR.email,
      templateCode: "expansion_opportunity",
      variables: {
        first_name: leadExpansionFR.first_name,
        company_name: leadExpansionFR.demo_company_name,
        fleet_size: leadExpansionFR.fleet_size,
        country_name: "Espagne",
      },
      leadId: leadExpansionFR.id,
      countryCode: "ES",
      fallbackLocale: "fr",
    });

    logger.info(
      `   ✅ Email Expansion FR envoyé: ${resultExpansionFR.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`   - Locale: ${resultExpansionFR.locale}`);
    logger.info(`   - Message ID: ${resultExpansionFR.messageId || "N/A"}\n`);

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ RÉSUMÉ DES ENVOIS");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(
      `1. FRANÇAIS (lead_confirmation): ${resultFR.success ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    logger.info(`   - Prénom: Pierre`);
    logger.info(`   - Entreprise: Paris VTC Premium`);
    logger.info(`   - Pays: France`);
    logger.info("");
    logger.info(
      `2. ARABE (lead_confirmation): ${resultAR.success ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    logger.info(`   - الاسم: محمد`);
    logger.info(`   - الشركة: دبي للنقل الذكي`);
    logger.info(`   - الدولة: الإمارات العربية المتحدة`);
    logger.info("");
    logger.info(
      `3. FRANÇAIS EXPANSION (expansion_opportunity): ${resultExpansionFR.success ? "✅ SUCCESS" : "❌ FAILED"}`
    );
    logger.info(`   - Prénom: Carlos`);
    logger.info(`   - Entreprise: Madrid Transportes SL`);
    logger.info(`   - Pays: Espagne`);
    logger.info("");
    logger.info("💡 Vérifie ta boîte mail mohamed@bluewise.io");
    logger.info("   Tu devrais avoir 3 emails avec les VRAIES valeurs:");
    logger.info(
      '   - Email 1 en FRANÇAIS avec "Pierre" et "Paris VTC Premium"'
    );
    logger.info('   - Email 2 en ARABE (RTL) avec "محمد" et "دبي للنقل الذكي"');
    logger.info(
      '   - Email 3 en FRANÇAIS (expansion) avec "Carlos" et "Madrid Transportes SL"'
    );

    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "❌ Test failed");
    await prisma.$disconnect();
    throw error;
  }
}

testAllLanguages()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
