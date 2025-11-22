/**
 * TEST COMPLET DE COUVERTURE - 84 EMAILS
 *
 * 7 Pays × 3 Langues × 4 Combinaisons = 84 emails
 *
 * RÈGLES CRITIQUES :
 * - ❌ ZERO hardcoding de templateCode
 * - ✅ Lecture dynamique de is_operational depuis crm_countries
 * - ✅ Si vous changez is_operational en BDD → test s'adapte automatiquement
 * - ✅ Logique : country.is_operational ? "lead_confirmation" : "expansion_opportunity"
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

const TEST_EMAIL = "mohamed@bluewise.io";

// 7 pays à tester
const COUNTRY_CODES = ["FR", "AE", "US", "GB", "BE", "DZ", "IT"];

// 3 langues pour chaque pays
const LOCALES = ["en", "fr", "ar"];

// 4 combinaisons phone/message
const COMBINATIONS = [
  { hasPhone: true, hasMessage: true, label: "Phone ✅ + Message ✅" },
  { hasPhone: false, hasMessage: true, label: "Phone ❌ + Message ✅" },
  { hasPhone: true, hasMessage: false, label: "Phone ✅ + Message ❌" },
  { hasPhone: false, hasMessage: false, label: "Phone ❌ + Message ❌" },
];

// Données de test par langue
const TEST_DATA = {
  en: {
    firstName: "John",
    companyName: "Fleet Solutions Ltd",
    fleetSize: "51-100 vehicles",
    phone: "+44 20 1234 5678",
    message:
      "We are interested in FleetCore for our London operations with real-time GPS tracking and automated invoicing.",
  },
  fr: {
    firstName: "Marie",
    companyName: "Transport Solutions SARL",
    fleetSize: "51-100 véhicules",
    phone: "+33 1 23 45 67 89",
    message:
      "Nous sommes intéressés par FleetCore pour notre flotte parisienne avec suivi GPS en temps réel et facturation automatisée.",
  },
  ar: {
    firstName: "أحمد",
    companyName: "شركة النقل المتقدم",
    fleetSize: "51-100 مركبة",
    phone: "+971 4 123 4567",
    message:
      "نحن مهتمون بـ FleetCore لإدارة أسطولنا في دبي مع تتبع GPS والفوترة الآلية.",
  },
};

async function testCompleteCoverage() {
  logger.info("🚀 TEST COMPLET DE COUVERTURE - 84 EMAILS\n");
  logger.info(`📧 Destinataire: ${TEST_EMAIL}\n`);
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let successCount = 0;
  let failCount = 0;
  let emailNumber = 0;

  for (const countryCode of COUNTRY_CODES) {
    logger.info(`\n🌍 PAYS: ${countryCode}`);
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // 🔥 LECTURE DYNAMIQUE DEPUIS LA BDD - ZERO HARDCODE
    const country = await prisma.crm_countries.findUnique({
      where: { country_code: countryCode },
      select: {
        country_code: true,
        country_name_en: true,
        country_name_fr: true,
        country_name_ar: true,
        country_preposition_en: true,
        country_preposition_fr: true,
        is_operational: true, // 🔥 CLEF DE VOUTE
        notification_locale: true,
      },
    });

    if (!country) {
      logger.error(`❌ Pays ${countryCode} introuvable`);
      continue;
    }

    // 🔥 DETERMINATION DYNAMIQUE DU TEMPLATE - ZERO HARDCODE
    const templateCode = country.is_operational
      ? "lead_confirmation"
      : "expansion_opportunity";

    logger.info(`   is_operational: ${country.is_operational}`);
    logger.info(`   → Template: ${templateCode}`);
    logger.info("");

    for (const locale of LOCALES) {
      logger.info(`   📝 LANGUE: ${locale.toUpperCase()}`);

      for (const combo of COMBINATIONS) {
        emailNumber++;

        const testData = TEST_DATA[locale as keyof typeof TEST_DATA];

        // Détermination de la préposition selon la langue
        let countryPreposition = "";
        let countryName = "";

        if (locale === "fr") {
          countryPreposition = country.country_preposition_fr || "en";
          countryName = country.country_name_fr;
        } else if (locale === "ar") {
          countryPreposition = ""; // Arabe n'utilise pas de préposition comme EN/FR
          countryName = country.country_name_ar;
        } else {
          countryPreposition = country.country_preposition_en || "in";
          countryName = country.country_name_en;
        }

        logger.info(`      ${emailNumber}/84 - ${combo.label}`);

        try {
          // 🔥 VARIABLES DE BASE (communes à tous les templates)
          const baseVariables: Record<string, string | null> = {
            first_name: testData.firstName,
            company_name: `${testData.companyName} (${countryCode}-${locale.toUpperCase()}-${combo.label})`,
            fleet_size: testData.fleetSize,
            country_name: countryName,
            phone: combo.hasPhone ? testData.phone : null,
            message: combo.hasMessage ? testData.message : null,
          };

          // 🔥 AJOUTER country_preposition UNIQUEMENT pour expansion_opportunity
          // lead_confirmation n'a PAS de phrase "available in [Country]"
          if (templateCode === "expansion_opportunity") {
            baseVariables.country_preposition = countryPreposition;
          }

          const result = await notificationService.sendEmail({
            recipientEmail: TEST_EMAIL,
            templateCode: templateCode, // 🔥 DYNAMIQUE - pas hardcodé
            locale: locale,
            variables: baseVariables,
          });

          if (result.success) {
            logger.info(
              `         ✅ Envoyé (${result.data?.messageId || "N/A"})`
            );
            successCount++;
          } else {
            logger.error(`         ❌ Échec: ${result.error}`);
            failCount++;
          }
        } catch (error) {
          logger.error({ error }, `         ❌ Erreur`);
          failCount++;
        }
      }
    }
  }

  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("\n📊 RÉSUMÉ FINAL:");
  logger.info(`   ✅ Réussis: ${successCount}`);
  logger.info(`   ❌ Échoués: ${failCount}`);
  logger.info(`   📧 Total: ${successCount + failCount}/84`);
  logger.info(`\n📬 Vérifiez ${TEST_EMAIL} - vous devez avoir 84 emails\n`);

  logger.info("\n📋 RÉPARTITION ATTENDUE:");
  logger.info(
    "   🇫🇷 FR (opérationnel) : 12 emails lead_confirmation (3 langues × 4 combos)"
  );
  logger.info(
    "   🇦🇪 AE (opérationnel) : 12 emails lead_confirmation (3 langues × 4 combos)"
  );
  logger.info("   🇺🇸 US (expansion)    : 12 emails expansion_opportunity");
  logger.info("   🇬🇧 GB (expansion)    : 12 emails expansion_opportunity");
  logger.info("   🇧🇪 BE (expansion)    : 12 emails expansion_opportunity");
  logger.info("   🇩🇿 DZ (expansion)    : 12 emails expansion_opportunity");
  logger.info("   🇮🇹 IT (expansion)    : 12 emails expansion_opportunity\n");
}

testCompleteCoverage()
  .then(() => {
    logger.info("✅ Test complet terminé");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur critique");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
