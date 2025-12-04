import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

/**
 * Met à jour directement la base de données avec les templates régénérés
 */
async function updateDatabase() {
  try {
    logger.info(
      "🔄 MISE À JOUR DE LA BASE DE DONNÉES AVEC LES TEMPLATES CORRIGÉS\n"
    );

    // Load regenerated templates
    const jsonPath = "generated-emails/regenerated-templates.json";
    const templatesData = JSON.parse(readFileSync(jsonPath, "utf-8")) as Record<
      string,
      Record<string, string>
    >;

    const templateCodes = Object.keys(templatesData);
    logger.info(`📋 ${templateCodes.length} templates à mettre à jour\n`);

    let updatedCount = 0;

    for (const templateCode of templateCodes) {
      logger.info(`📝 Mise à jour ${templateCode}...`);

      const template = await prisma.dir_notification_templates.findFirst({
        where: {
          template_code: templateCode,
          channel: "email",
        },
      });

      if (!template) {
        logger.warn(`   ⚠️  Template ${templateCode} introuvable dans la base`);
        continue;
      }

      const newBodyTranslations = {
        en: templatesData[templateCode].en,
        fr: templatesData[templateCode].fr,
        ar: templatesData[templateCode].ar,
      };

      await prisma.dir_notification_templates.update({
        where: { id: template.id },
        data: {
          body_translations: newBodyTranslations,
          updated_at: new Date(),
        },
      });

      updatedCount++;
      logger.info(
        `   ✅ Template mis à jour (EN: ${newBodyTranslations.en.length}, FR: ${newBodyTranslations.fr.length}, AR: ${newBodyTranslations.ar.length} chars)`
      );
    }

    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ MISE À JOUR TERMINÉE");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(
      `Templates mis à jour: ${updatedCount}/${templateCodes.length}`
    );
    logger.info("\n💡 Prochaine étape: relancer test-expansion-flow.ts");

    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "Erreur mise à jour DB");
    await prisma.$disconnect();
    throw error;
  }
}

updateDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
