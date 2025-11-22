import { readFileSync } from "fs";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Update lead_confirmation and expansion_opportunity templates
 * with phone_row and message_row placeholders
 */
async function updateTemplates() {
  try {
    logger.info("🔄 Updating templates with phone_row and message_row...\n");

    // Read regenerated templates
    const templatesPath = "generated-emails/regenerated-templates.json";
    const templatesData = JSON.parse(readFileSync(templatesPath, "utf-8"));

    // Update lead_confirmation
    logger.info("📝 Updating lead_confirmation template...");
    await db.dir_notification_templates.updateMany({
      where: {
        template_code: "lead_confirmation",
        channel: "email",
      },
      data: {
        body_translations: {
          en: templatesData.lead_confirmation.en,
          fr: templatesData.lead_confirmation.fr,
          ar: templatesData.lead_confirmation.ar,
        },
        variables: [
          "first_name",
          "company_name",
          "fleet_size",
          "country_name",
          "phone_row",
          "message_row",
        ],
      },
    });
    logger.info("✅ lead_confirmation updated");

    // Update expansion_opportunity
    logger.info("📝 Updating expansion_opportunity template...");
    await db.dir_notification_templates.updateMany({
      where: {
        template_code: "expansion_opportunity",
        channel: "email",
      },
      data: {
        body_translations: {
          en: templatesData.expansion_opportunity.en,
          fr: templatesData.expansion_opportunity.fr,
          ar: templatesData.expansion_opportunity.ar,
        },
        variables: [
          "first_name",
          "company_name",
          "fleet_size",
          "country_name",
          "phone_row",
          "message_row",
        ],
      },
    });
    logger.info("✅ expansion_opportunity updated");

    logger.info("\n✅ Templates updated successfully!");
    logger.info("📊 Variables now include: phone_row, message_row");
  } catch (error) {
    logger.error({ error }, "❌ Failed to update templates");
    throw error;
  } finally {
    await db.$disconnect();
  }
}

updateTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
