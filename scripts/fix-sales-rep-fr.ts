import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";
import { readFileSync } from "fs";

const prisma = new PrismaClient();

async function fixSalesRepFR() {
  try {
    const jsonData = JSON.parse(
      readFileSync("generated-emails/regenerated-templates.json", "utf-8")
    );

    const frHtml = jsonData.sales_rep_assignment.fr;

    // Vérifier si {{priority}} est présent
    if (frHtml.includes("{{priority}}")) {
      logger.info("✅ {{priority}} déjà présent");
    } else {
      logger.info("⚠️  {{priority}} manquant, correction nécessaire");

      // Template lookup
      const template = await prisma.dir_notification_templates.findFirst({
        where: {
          template_code: "sales_rep_assignment",
          channel: "email",
        },
      });

      if (template) {
        const bodyTranslations = template.body_translations as Record<
          string,
          string
        >;

        // Get current FR body
        let frBody = bodyTranslations.fr;

        // Replace "haute" with {{priority}}
        frBody = frBody.replace(/haute/g, "{{priority}}");

        // Update DB
        await prisma.dir_notification_templates.update({
          where: { id: template.id },
          data: {
            body_translations: {
              ...bodyTranslations,
              fr: frBody,
            },
          },
        });

        logger.info("✅ Template sales_rep_assignment (FR) corrigé!");
      }
    }

    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "Erreur");
    await prisma.$disconnect();
    throw error;
  }
}

void fixSalesRepFR();
