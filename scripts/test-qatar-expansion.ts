import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

/**
 * Test expansion_opportunity pour le Qatar (pays d'expansion)
 */
async function testQatarExpansion() {
  try {
    logger.info("🧪 TEST: EXPANSION OPPORTUNITY - QATAR (ARABE)\n");

    // Cleanup
    logger.info("🧹 Cleanup...");
    await prisma.crm_leads.deleteMany({
      where: {
        email: "mohamed@bluewise.io",
      },
    });
    logger.info("   ✅ Cleanup terminé\n");

    // Vérifier que Qatar est bien un pays d'expansion
    const qatar = await prisma.crm_countries.findUnique({
      where: { country_code: "QA" },
      select: {
        country_code: true,
        country_name_en: true,
        country_name_ar: true,
        is_operational: true,
        notification_locale: true,
      },
    });

    logger.info("📋 Configuration du Qatar:");
    logger.info(`   - Code: ${qatar?.country_code}`);
    logger.info(`   - Nom EN: ${qatar?.country_name_en}`);
    logger.info(`   - Nom AR: ${qatar?.country_name_ar}`);
    logger.info(`   - Opérationnel: ${qatar?.is_operational ? "OUI" : "NON"}`);
    logger.info(`   - Locale notif: ${qatar?.notification_locale}\n`);

    // Créer le lead pour Qatar
    logger.info("📧 Création du lead Qatar...");
    const leadQatar = await prisma.crm_leads.create({
      data: {
        first_name: "خالد",
        last_name: "المري",
        email: "mohamed@bluewise.io",
        demo_company_name: "الدوحة لإدارة الأساطيل",
        fleet_size: "101-200 vehicles",
        phone: "+97444123456",
        message: "مهتم بمنصة FleetCore لأسطولنا في الدوحة",
        country_code: "QA",
        status: "new",
      },
    });

    logger.info(`   ✅ Lead créé: ${leadQatar.id}\n`);

    // Envoyer l'email
    const notificationService = new NotificationService();
    const result = await notificationService.sendEmail({
      recipientEmail: leadQatar.email,
      templateCode: qatar?.is_operational
        ? "lead_confirmation"
        : "expansion_opportunity",
      variables: {
        first_name: leadQatar.first_name,
        company_name: leadQatar.demo_company_name,
        fleet_size: leadQatar.fleet_size,
        country_name: qatar?.country_name_ar || "قطر",
      },
      leadId: leadQatar.id,
      countryCode: "QA",
      fallbackLocale: "ar",
    });

    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ RÉSULTAT");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(`Statut: ${result.success ? "✅ SUCCESS" : "❌ FAILED"}`);
    logger.info(
      `Template: ${qatar?.is_operational ? "lead_confirmation" : "expansion_opportunity"}`
    );
    logger.info(`Locale: ${result.locale}`);
    logger.info(`Message ID: ${result.messageId || "N/A"}`);
    logger.info("");
    logger.info("📧 Détails du lead:");
    logger.info(`   - الاسم: ${leadQatar.first_name}`);
    logger.info(`   - الشركة: ${leadQatar.demo_company_name}`);
    logger.info(`   - حجم الأسطول: ${leadQatar.fleet_size}`);
    logger.info(`   - الدولة: ${qatar?.country_name_ar}`);
    logger.info("");
    logger.info("💡 Vérifie ta boîte mail mohamed@bluewise.io");
    logger.info("   Tu devrais recevoir un email en ARABE (RTL)");
    logger.info(
      `   Template: ${qatar?.is_operational ? "Confirmation" : "Expansion Opportunity"}`
    );
    logger.info(
      '   Contenu: "FleetCore n\'est pas encore disponible au Qatar..."'
    );

    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "❌ Test failed");
    await prisma.$disconnect();
    throw error;
  }
}

testQatarExpansion()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
