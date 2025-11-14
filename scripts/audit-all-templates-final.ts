import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

async function auditAllTemplates() {
  try {
    logger.info("🔍 AUDIT COMPLET - TOUS LES TEMPLATES - TOUTES LES LANGUES\n");

    const templates = await prisma.dir_notification_templates.findMany({
      select: {
        template_code: true,
        subject_translations: true,
        body_translations: true,
        variables: true,
        supported_locales: true,
      },
      where: {
        deleted_at: null,
      },
      orderBy: {
        template_code: "asc",
      },
    });

    logger.info(`✅ ${templates.length} templates actifs trouvés\n`);

    const problematic: Array<{
      code: string;
      locale: string;
      missing: string[];
    }> = [];

    for (const template of templates) {
      const vars = (template.variables as string[]) || [];
      const locales = template.supported_locales || ["en", "fr", "ar"];
      const bodyTranslations = template.body_translations as Record<
        string,
        string
      >;

      for (const locale of locales) {
        const body = bodyTranslations[locale] || "";
        const missing: string[] = [];

        for (const varName of vars) {
          const placeholder = `{{${varName}}}`;
          if (!body.includes(placeholder)) {
            missing.push(varName);
          }
        }

        if (missing.length > 0) {
          problematic.push({
            code: template.template_code,
            locale,
            missing,
          });
        }
      }
    }

    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 RÉSULTATS PAR TEMPLATE");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const templateCodes = [...new Set(templates.map((t) => t.template_code))];

    for (const code of templateCodes) {
      const issues = problematic.filter((p) => p.code === code);
      const status = issues.length === 0 ? "✅" : "❌";

      logger.info(`${status} ${code}`);

      if (issues.length > 0) {
        for (const issue of issues) {
          logger.info(
            `   ❌ [${issue.locale}] Variables manquantes: ${issue.missing.join(", ")}`
          );
        }
      } else {
        const template = templates.find((t) => t.template_code === code);
        const vars = (template?.variables as string[]) || [];
        logger.info(`   ✅ Toutes langues OK - Variables: ${vars.join(", ")}`);
      }
      logger.info("");
    }

    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📈 STATISTIQUES GLOBALES");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const totalTemplatesAllLangs = templates.length * 3;
    const problematicCount = problematic.length;

    logger.info(`Total templates × langues: ${totalTemplatesAllLangs}`);
    logger.info(`✅ OK: ${totalTemplatesAllLangs - problematicCount}`);
    logger.info(`❌ Problématiques: ${problematicCount}`);
    logger.info(
      `📊 Taux de réussite: ${Math.round(((totalTemplatesAllLangs - problematicCount) / totalTemplatesAllLangs) * 100)}%\n`
    );

    if (problematic.length > 0) {
      logger.info("🚨 CORRECTION NÉCESSAIRE:");
      const uniqueCodes = [...new Set(problematic.map((p) => p.code))];
      logger.info(`   ${uniqueCodes.length} templates à régénérer:`);
      uniqueCodes.forEach((code) => {
        const locales = [
          ...new Set(
            problematic.filter((p) => p.code === code).map((p) => p.locale)
          ),
        ];
        logger.info(`   - ${code} (${locales.join(", ")})`);
      });
      logger.info(
        "\n   💡 Action: Régénérer les templates depuis React Email avec {{placeholders}}"
      );
    }

    await prisma.$disconnect();
  } catch (error) {
    logger.error({ error }, "Erreur audit");
    await prisma.$disconnect();
    throw error;
  }
}

auditAllTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
