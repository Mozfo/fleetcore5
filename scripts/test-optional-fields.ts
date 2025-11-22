/**
 * TEST DES CHAMPS OPTIONNELS
 *
 * Envoie 3 emails pour tester les combinaisons de phone/message:
 * 1. Phone VIDE + Message REMPLI
 * 2. Phone REMPLI + Message VIDE
 * 3. Phone VIDE + Message VIDE
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

const TEST_EMAIL = "mohamed@bluewise.io";

async function testOptionalFields() {
  logger.info("📧 TEST DES CHAMPS OPTIONNELS (phone/message)\n");
  logger.info(`Destinataire: ${TEST_EMAIL}\n`);
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let successCount = 0;
  let failCount = 0;

  // Get France for testing
  const countryFR = await prisma.crm_countries.findUnique({
    where: { country_code: "FR" },
  });

  // 1. Phone VIDE + Message REMPLI
  logger.info("\n1️⃣  TEST: Phone VIDE + Message REMPLI");
  try {
    const result1 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "Test1",
        company_name: "No Phone Company",
        fleet_size: "10-50 vehicles",
        country_preposition: countryFR?.country_preposition_en || "in",
        country_name: countryFR?.country_name_en || "France",
        phone: null,
        message:
          "This lead submitted WITHOUT phone number but WITH a detailed message about their fleet management needs.",
      },
    });

    if (result1.success) {
      logger.info(`   ✅ Envoyé (ID: ${result1.data?.messageId || "N/A"})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result1.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 2. Phone REMPLI + Message VIDE
  logger.info("\n2️⃣  TEST: Phone REMPLI + Message VIDE");
  try {
    const result2 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "Test2",
        company_name: "No Message Company",
        fleet_size: "51-100 vehicles",
        country_preposition: countryFR?.country_preposition_en || "in",
        country_name: countryFR?.country_name_en || "France",
        phone: "+33 1 23 45 67 89",
        message: null,
      },
    });

    if (result2.success) {
      logger.info(`   ✅ Envoyé (ID: ${result2.data?.messageId || "N/A"})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result2.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 3. Phone VIDE + Message VIDE
  logger.info("\n3️⃣  TEST: Phone VIDE + Message VIDE");
  try {
    const result3 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "Test3",
        company_name: "Minimal Info Company",
        fleet_size: "101-500 vehicles",
        country_preposition: countryFR?.country_preposition_en || "in",
        country_name: countryFR?.country_name_en || "France",
        phone: null,
        message: null,
      },
    });

    if (result3.success) {
      logger.info(`   ✅ Envoyé (ID: ${result3.data?.messageId || "N/A"})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result3.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info(`\n📊 RÉSUMÉ:`);
  logger.info(`   ✅ Réussis: ${successCount}`);
  logger.info(`   ❌ Échoués: ${failCount}`);
  logger.info(`   📧 Total: ${successCount + failCount}`);
  logger.info(`\n📬 Vérifiez ${TEST_EMAIL}\n`);
}

testOptionalFields()
  .then(() => {
    logger.info("✅ Test terminé");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
