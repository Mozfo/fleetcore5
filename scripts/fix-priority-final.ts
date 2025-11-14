import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

async function fixPriority() {
  const template = await prisma.dir_notification_templates.findFirst({
    where: {
      template_code: "sales_rep_assignment",
      channel: "email",
    },
  });

  if (!template) {
    logger.error("Template not found");
    return;
  }

  const bodyTranslations = template.body_translations as Record<string, string>;
  let frBody = bodyTranslations.fr;

  // Replace all forms of "élevée" with {{priority}}
  frBody = frBody.replace(/ÉLEVÉE/g, "{{priority}}");
  frBody = frBody.replace(/élevée/g, "{{priority}}");

  await prisma.dir_notification_templates.update({
    where: { id: template.id },
    data: {
      body_translations: {
        ...bodyTranslations,
        fr: frBody,
      },
    },
  });

  logger.info("✅ Priority placeholder fixed in FR template");
  await prisma.$disconnect();
}

void fixPriority();
