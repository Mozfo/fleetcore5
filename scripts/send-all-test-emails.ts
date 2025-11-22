/**
 * ENVOI DE TOUS LES EMAILS DE TEST
 *
 * Envoie tous les templates d'emails à mohamed@bluewise.io pour vérification complète
 *
 * IMPORTANT:
 * - Envoyer les valeurs RAW: phone, message (pas phone_row, message_row)
 * - Le service notification.service.ts génère automatiquement le HTML
 * - Ne JAMAIS envoyer du HTML pré-formaté dans les variables
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { NotificationService } from "@/lib/services/notification/notification.service";

const prisma = new PrismaClient();
const notificationService = new NotificationService();

const TEST_EMAIL = "mohamed@bluewise.io";

async function sendAllTestEmails() {
  logger.info("📧 ENVOI DE TOUS LES EMAILS DE TEST\n");
  logger.info(`Destinataire: ${TEST_EMAIL}\n`);
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  let successCount = 0;
  let failCount = 0;

  // 1. EXPANSION OPPORTUNITY (EN) - United Kingdom
  logger.info(
    "\n1️⃣  EXPANSION OPPORTUNITY - EN - United Kingdom (AVEC phone + message)"
  );
  try {
    const countryGB = await prisma.crm_countries.findUnique({
      where: { country_code: "GB" },
    });

    const result1 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "John",
        company_name: "UK Fleet Services Ltd",
        fleet_size: "51-100 vehicles",
        country_preposition: countryGB?.country_preposition_en || "in the",
        country_name: countryGB?.country_name_en || "United Kingdom",
        phone: "+44 20 7946 0958",
        message:
          "We are looking for a comprehensive fleet management solution for our London-based operations. Currently managing 75 vehicles across the city.",
      },
    });

    if (result1.success) {
      logger.info(`   ✅ Envoyé (ID: ${result1.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result1.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 2. EXPANSION OPPORTUNITY (EN) - United States
  logger.info(
    "\n2️⃣  EXPANSION OPPORTUNITY - EN - United States (AVEC phone + message)"
  );
  try {
    const countryUS = await prisma.crm_countries.findUnique({
      where: { country_code: "US" },
    });

    const result2 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "Michael",
        company_name: "American Transport Corporation",
        fleet_size: "101-500 vehicles",
        country_preposition: countryUS?.country_preposition_en || "in the",
        country_name: countryUS?.country_name_en || "United States",
        phone: "+1 (212) 555-0147",
        message:
          "Expanding our fleet operations to NYC and need integrated management system. Interested in demo for 250+ vehicles.",
      },
    });

    if (result2.success) {
      logger.info(`   ✅ Envoyé (ID: ${result2.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result2.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 3. EXPANSION OPPORTUNITY (EN) - Germany
  logger.info(
    "\n3️⃣  EXPANSION OPPORTUNITY - EN - Germany (AVEC phone + message)"
  );
  try {
    const countryDE = await prisma.crm_countries.findUnique({
      where: { country_code: "DE" },
    });

    const result3 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "en",
      variables: {
        first_name: "Hans",
        company_name: "Deutsche Flotte GmbH",
        fleet_size: "11-50 vehicles",
        country_preposition: countryDE?.country_preposition_en || "in",
        country_name: countryDE?.country_name_en || "Germany",
        phone: "+49 30 2093 4567",
        message:
          "Planning to establish operations in Berlin and Munich. Need fleet management solution supporting European regulations and multi-currency.",
      },
    });

    if (result3.success) {
      logger.info(`   ✅ Envoyé (ID: ${result3.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result3.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 4. EXPANSION OPPORTUNITY (FR) - Canada
  logger.info(
    "\n4️⃣  EXPANSION OPPORTUNITY - FR - Canada (AVEC téléphone + message)"
  );
  try {
    const countryCA = await prisma.crm_countries.findUnique({
      where: { country_code: "CA" },
    });

    const result4 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "fr",
      variables: {
        first_name: "Pierre",
        company_name: "Transport Québec Inc",
        fleet_size: "51-100 véhicules",
        country_preposition: countryCA?.country_preposition_fr || "au",
        country_name: countryCA?.country_name_fr || "Canada",
        phone: "+1 (514) 555-0198",
        message:
          "Nous gérons actuellement 85 véhicules à Montréal et cherchons une solution complète de gestion de flotte avec support francophone.",
      },
    });

    if (result4.success) {
      logger.info(`   ✅ Envoyé (ID: ${result4.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result4.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 5. EXPANSION OPPORTUNITY (FR) - États-Unis
  logger.info(
    "\n5️⃣  EXPANSION OPPORTUNITY - FR - États-Unis (AVEC téléphone + message)"
  );
  try {
    const countryUS = await prisma.crm_countries.findUnique({
      where: { country_code: "US" },
    });

    const result5 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "fr",
      variables: {
        first_name: "Marie",
        company_name: "Flotte Américaine SARL",
        fleet_size: "10-50 véhicules",
        country_preposition: countryUS?.country_preposition_fr || "aux",
        country_name: countryUS?.country_name_fr || "États-Unis",
        phone: "+1 (305) 555-0132",
        message:
          "Projet d'expansion de notre flotte en Floride. Besoin d'une solution intégrée pour gérer 35 véhicules avec suivi GPS et rapports en français.",
      },
    });

    if (result5.success) {
      logger.info(`   ✅ Envoyé (ID: ${result5.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result5.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 6. EXPANSION OPPORTUNITY (FR) - Allemagne
  logger.info(
    "\n6️⃣  EXPANSION OPPORTUNITY - FR - Allemagne (AVEC téléphone + message)"
  );
  try {
    const countryDE = await prisma.crm_countries.findUnique({
      where: { country_code: "DE" },
    });

    const result6 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "expansion_opportunity",
      locale: "fr",
      variables: {
        first_name: "François",
        company_name: "Transport Euro SA",
        fleet_size: "100+ véhicules",
        country_preposition: countryDE?.country_preposition_fr || "en",
        country_name: countryDE?.country_name_fr || "Allemagne",
        phone: "+33 1 42 86 82 00",
        message:
          "Projet d'expansion européenne avec hub en Allemagne. Gestion de 120+ véhicules nécessitant conformité RGPD et intégration multi-pays.",
      },
    });

    if (result6.success) {
      logger.info(`   ✅ Envoyé (ID: ${result6.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result6.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 7. LEAD CONFIRMATION (EN) - France
  logger.info("\n7️⃣  LEAD CONFIRMATION - EN - France (AVEC phone + message)");
  try {
    const countryFR = await prisma.crm_countries.findUnique({
      where: { country_code: "FR" },
    });

    const result7 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "lead_confirmation",
      locale: "en",
      variables: {
        first_name: "Sophie",
        company_name: "Paris Fleet Operations SARL",
        fleet_size: "51-100 vehicles",
        country_preposition: countryFR?.country_preposition_en || "in",
        country_name: countryFR?.country_name_en || "France",
        phone: "+33 1 53 93 65 00",
        message:
          "We operate 72 vehicles in Paris and need immediate onboarding. Ready to start implementation by next month with full team training.",
      },
    });

    if (result7.success) {
      logger.info(`   ✅ Envoyé (ID: ${result7.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result7.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 8. LEAD CONFIRMATION (FR) - France
  logger.info(
    "\n8️⃣  LEAD CONFIRMATION - FR - France (AVEC téléphone + message)"
  );
  try {
    const countryFR = await prisma.crm_countries.findUnique({
      where: { country_code: "FR" },
    });

    const result8 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "lead_confirmation",
      locale: "fr",
      variables: {
        first_name: "Jean",
        company_name: "VTC Paris Services",
        fleet_size: "51-100 véhicules",
        country_preposition: countryFR?.country_preposition_fr || "en",
        country_name: countryFR?.country_name_fr || "France",
        phone: "+33 6 07 08 09 10",
        message:
          "Flotte de 68 véhicules VTC à Paris. Besoin urgent d'une solution complète avec facturation automatique et suivi chauffeurs en temps réel.",
      },
    });

    if (result8.success) {
      logger.info(`   ✅ Envoyé (ID: ${result8.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result8.error}`);
      failCount++;
    }
  } catch (error) {
    logger.error({ error }, "   ❌ Erreur");
    failCount++;
  }

  // 9. LEAD CONFIRMATION (EN) - UAE
  logger.info("\n9️⃣  LEAD CONFIRMATION - EN - UAE (AVEC phone + message)");
  try {
    const countryAE = await prisma.crm_countries.findUnique({
      where: { country_code: "AE" },
    });

    const result9 = await notificationService.sendEmail({
      recipientEmail: TEST_EMAIL,
      templateCode: "lead_confirmation",
      locale: "en",
      variables: {
        first_name: "Ahmed",
        company_name: "Dubai Fleet Management LLC",
        fleet_size: "101-500 vehicles",
        country_preposition: countryAE?.country_preposition_en || "in the",
        country_name: countryAE?.country_name_en || "United Arab Emirates",
        phone: "+971 4 123 4567",
        message:
          "Managing 280 vehicles across Dubai and Abu Dhabi. Urgent requirement for integrated fleet solution with Careem/Uber integration and Arabic support.",
      },
    });

    if (result9.success) {
      logger.info(`   ✅ Envoyé (ID: ${result9.data?.messageId})`);
      successCount++;
    } else {
      logger.error(`   ❌ Échec: ${result9.error}`);
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

sendAllTestEmails()
  .then(() => {
    logger.info("✅ Envoi terminé");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error }, "❌ Erreur");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
