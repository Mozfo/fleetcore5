/**
 * AUDIT: Liste tous les templates email avec colonnes AR
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

interface TemplateTranslations {
  en?: string;
  fr?: string;
  ar?: string;
}

async function auditTemplates() {
  const templates = await prisma.dir_notification_templates.findMany({
    where: {
      deleted_at: null,
    },
    select: {
      template_code: true,
      channel: true,
      status: true,
      subject_translations: true,
      body_translations: true,
    },
    orderBy: [{ template_code: "asc" }, { channel: "asc" }],
  });

  logger.info(`=== AUDIT EMAIL TEMPLATES ===`);
  logger.info(
    `Template Code                    | Channel    | Status     | Body Lengths (EN/FR/AR)`
  );
  logger.info(`-`.repeat(100));

  // Format output
  templates.forEach((template) => {
    const bodyTranslations = template.body_translations as TemplateTranslations;
    const bodyEnLength = (bodyTranslations?.en || "").length;
    const bodyFrLength = (bodyTranslations?.fr || "").length;
    const bodyArLength = (bodyTranslations?.ar || "").length;

    const row = {
      template_code: template.template_code.padEnd(30),
      channel: template.channel.padEnd(10),
      status: template.status.padEnd(10),
      body_en_length: String(bodyEnLength).padStart(6),
      body_fr_length: String(bodyFrLength).padStart(6),
      body_ar_length: String(bodyArLength).padStart(6),
    };

    logger.info(
      `${row.template_code} | ${row.channel} | ${row.status} | EN:${row.body_en_length} FR:${row.body_fr_length} AR:${row.body_ar_length}`
    );
  });

  logger.info(`\nTotal templates: ${templates.length}`);

  await prisma.$disconnect();
}

auditTemplates().catch((error) => {
  logger.error({ error }, "Audit failed");
  process.exit(1);
});
