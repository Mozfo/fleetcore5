import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

async function main() {
  const template = await prisma.dir_notification_templates.findFirst({
    where: {
      template_code: "expansion_opportunity",
      channel: "email",
      deleted_at: null,
    },
    select: {
      id: true,
      template_code: true,
      template_name: true,
      channel: true,
      supported_locales: true,
      subject_translations: true,
      body_translations: true,
    },
  });

  if (!template) {
    logger.error("expansion_opportunity template NOT FOUND");
    process.exit(1);
  }

  logger.info({ template }, "Template found");

  const translations = template.subject_translations as Record<string, string>;
  const hasEs = "es" in translations;

  logger.info(
    {
      supported_locales: template.supported_locales,
      has_es_translation: hasEs,
      available_locales: Object.keys(translations),
    },
    "Locale check"
  );

  await prisma.$disconnect();
}

main().catch((error) => {
  logger.error({ error }, "Error");
  process.exit(1);
});
