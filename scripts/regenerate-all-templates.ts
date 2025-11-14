import { readFileSync, writeFileSync } from "fs";
import { logger } from "@/lib/logger";

/**
 * Script pour régénérer TOUS les templates avec {{placeholders}}
 *
 * Ce script met à jour seed.ts en remplaçant les valeurs hardcodées
 * par les placeholders {{variable}} dans tous les templates cassés.
 */

const TEMPLATE_FIXES = {
  lead_confirmation: {
    en: [
      {
        from: "Hello <!-- -->John<!-- -->,",
        to: "Hello <!-- -->{{first_name}}<!-- -->,",
      },
      {
        from: "<strong>Test Company Ltd</strong>",
        to: "<strong>{{company_name}}</strong>",
      },
      {
        from: "<strong>51-100 vehicles</strong>",
        to: "<strong>{{fleet_size}}</strong>",
      },
      {
        from: "<strong>United States</strong>",
        to: "<strong>{{country_name}}</strong>",
      },
    ],
    fr: [
      {
        from: "Bonjour <!-- -->Jean<!-- -->,",
        to: "Bonjour <!-- -->{{first_name}}<!-- -->,",
      },
      {
        from: "<strong>Paris VTC Services</strong>",
        to: "<strong>{{company_name}}</strong>",
      },
      {
        from: "<strong>51-100 véhicules</strong>",
        to: "<strong>{{fleet_size}}</strong>",
      },
      {
        from: "<strong>France</strong>",
        to: "<strong>{{country_name}}</strong>",
      },
    ],
    ar: [
      {
        from: "مرحباً <!-- -->محمد<!-- -->،",
        to: "مرحباً <!-- -->{{first_name}}<!-- -->،",
      },
      {
        from: "<strong>شركة الاختبار المحدودة</strong>",
        to: "<strong>{{company_name}}</strong>",
      },
      {
        from: "<strong>51-100 مركبة</strong>",
        to: "<strong>{{fleet_size}}</strong>",
      },
      {
        from: "<strong>الإمارات العربية المتحدة</strong>",
        to: "<strong>{{country_name}}</strong>",
      },
    ],
  },
  lead_followup: {
    en: [
      {
        from: "Hello <!-- -->John<!-- -->,",
        to: "Hello <!-- -->{{first_name}}<!-- -->,",
      },
      {
        from: "<strong>Our fleet management platform helps <!-- -->Test Company Ltd<!-- --> to:</strong>",
        to: "<strong>Our fleet management platform helps <!-- -->{{company_name}}<!-- --> to:</strong>",
      },
    ],
    fr: [
      {
        from: "Bonjour <!-- -->Jean<!-- -->,",
        to: "Bonjour <!-- -->{{first_name}}<!-- -->,",
      },
      {
        from: "<strong>Notre plateforme de gestion de flotte aide <!-- -->Paris VTC Services<!-- --> à :</strong>",
        to: "<strong>Notre plateforme de gestion de flotte aide <!-- -->{{company_name}}<!-- --> à :</strong>",
      },
    ],
    ar: [
      {
        from: "مرحباً <!-- -->محمد<!-- -->،",
        to: "مرحباً <!-- -->{{first_name}}<!-- -->،",
      },
      {
        from: "<strong>منصة إدارة الأسطول لدينا تساعد <!-- -->شركة الاختبار المحدودة<!-- --> على:</strong>",
        to: "<strong>منصة إدارة الأسطول لدينا تساعد <!-- -->{{company_name}}<!-- --> على:</strong>",
      },
    ],
  },
};

async function regenerateTemplates() {
  try {
    logger.info(
      "🔄 Régénération de TOUS les templates avec {{placeholders}}\n"
    );

    const seedPath = "prisma/seed.ts";
    let seedContent = readFileSync(seedPath, "utf-8");

    let totalReplacements = 0;

    // Fix lead_confirmation
    logger.info("📝 Fixing lead_confirmation...");
    for (const [locale, replacements] of Object.entries(
      TEMPLATE_FIXES.lead_confirmation
    )) {
      for (const { from, to } of replacements) {
        if (seedContent.includes(from)) {
          seedContent = seedContent.replace(
            new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            to
          );
          totalReplacements++;
          logger.info(
            `   ✅ [${locale}] ${from.substring(0, 30)}... → {{variable}}`
          );
        }
      }
    }

    // Fix lead_followup
    logger.info("\n📝 Fixing lead_followup...");
    for (const [locale, replacements] of Object.entries(
      TEMPLATE_FIXES.lead_followup
    )) {
      for (const { from, to } of replacements) {
        if (seedContent.includes(from)) {
          seedContent = seedContent.replace(
            new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            to
          );
          totalReplacements++;
          logger.info(`   ✅ [${locale}] Replaced hardcoded value`);
        }
      }
    }

    // Write updated seed.ts
    writeFileSync(seedPath, seedContent, "utf-8");

    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ RÉGÉNÉRATION TERMINÉE");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(`Total remplacements: ${totalReplacements}`);
    logger.info("\n💡 Prochaine étape: pnpm prisma db seed");
  } catch (error) {
    logger.error({ error }, "Erreur régénération");
    throw error;
  }
}

regenerateTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
