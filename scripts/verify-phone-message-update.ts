import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function verifyUpdate() {
  try {
    logger.info("🔍 Verifying template updates...\n");

    const templates = await db.dir_notification_templates.findMany({
      where: {
        template_code: { in: ["lead_confirmation", "expansion_opportunity"] },
        channel: "email",
      },
      select: {
        template_code: true,
        variables: true,
        body_translations: true,
      },
    });

    for (const template of templates) {
      logger.info(`\n📧 ${template.template_code}:`);
      logger.info(`  Variables: ${JSON.stringify(template.variables)}`);

      // Check for placeholders in each language
      const bodyTranslations = template.body_translations as {
        en?: string;
        fr?: string;
        ar?: string;
      };

      for (const [lang, html] of Object.entries(bodyTranslations)) {
        if (html) {
          const hasPhoneRow = html.includes("{{phone_row}}");
          const hasMessageRow = html.includes("{{message_row}}");
          logger.info(
            `  [${lang}] phone_row: ${hasPhoneRow ? "✅" : "❌"}, message_row: ${hasMessageRow ? "✅" : "❌"}`
          );
        }
      }
    }

    logger.info("\n✅ Verification complete!");
  } catch (error) {
    logger.error({ error }, "❌ Verification failed");
    throw error;
  } finally {
    await db.$disconnect();
  }
}

verifyUpdate()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
