import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * Update seed.ts with Generated HTML Templates
 *
 * This script automatically updates prisma/seed.ts with the generated
 * HTML templates for all 12 email templates.
 *
 * Process:
 * 1. Read generated HTML templates (12 templates)
 * 2. Backup current seed.ts
 * 3. Update all templates with generated HTML
 *
 * Templates updated:
 * - lead_confirmation (CRM)
 * - expansion_opportunity (CRM)
 * - sales_rep_assignment (CRM)
 * - lead_followup (CRM)
 * - member_welcome (ADM)
 * - member_password_reset (ADM)
 * - vehicle_inspection_reminder (FLEET)
 * - insurance_expiry_alert (FLEET)
 * - driver_onboarding (DRIVER)
 * - maintenance_scheduled (MAINTENANCE)
 * - critical_alert (SYSTEM)
 * - webhook_test (SYSTEM)
 *
 * Usage:
 * ```bash
 * pnpm exec tsx scripts/update-seed-templates.ts
 * ```
 */

async function updateSeedTemplates() {
  logger.info("🔧 Updating prisma/seed.ts with generated templates...\n");

  const generatedDir = path.join(process.cwd(), "generated-emails");
  const seedPath = path.join(process.cwd(), "prisma", "seed.ts");

  // Read all generated HTML templates
  logger.info("📖 Reading generated HTML templates...\n");

  const templates = {
    lead_confirmation: fs
      .readFileSync(path.join(generatedDir, "lead-confirmation.html"), "utf-8")
      .trim(),
    expansion_opportunity: fs
      .readFileSync(
        path.join(generatedDir, "expansion-opportunity.html"),
        "utf-8"
      )
      .trim(),
    sales_rep_assignment: fs
      .readFileSync(
        path.join(generatedDir, "sales-rep-assignment.html"),
        "utf-8"
      )
      .trim(),
    lead_followup: fs
      .readFileSync(path.join(generatedDir, "lead-followup.html"), "utf-8")
      .trim(),
    member_welcome: fs
      .readFileSync(path.join(generatedDir, "member-welcome.html"), "utf-8")
      .trim(),
    member_password_reset: fs
      .readFileSync(
        path.join(generatedDir, "member-password-reset.html"),
        "utf-8"
      )
      .trim(),
    vehicle_inspection_reminder: fs
      .readFileSync(
        path.join(generatedDir, "vehicle-inspection-reminder.html"),
        "utf-8"
      )
      .trim(),
    insurance_expiry_alert: fs
      .readFileSync(
        path.join(generatedDir, "insurance-expiry-alert.html"),
        "utf-8"
      )
      .trim(),
    driver_onboarding: fs
      .readFileSync(path.join(generatedDir, "driver-onboarding.html"), "utf-8")
      .trim(),
    maintenance_scheduled: fs
      .readFileSync(
        path.join(generatedDir, "maintenance-scheduled.html"),
        "utf-8"
      )
      .trim(),
    critical_alert: fs
      .readFileSync(path.join(generatedDir, "critical-alert.html"), "utf-8")
      .trim(),
    webhook_test: fs
      .readFileSync(path.join(generatedDir, "webhook-test.html"), "utf-8")
      .trim(),
  };

  logger.info("✅ Read 12 HTML templates\n");

  // Backup seed.ts
  const backupPath = `${seedPath}.backup-${Date.now()}`;
  fs.copyFileSync(seedPath, backupPath);
  logger.info(`✅ Backed up seed.ts to ${path.basename(backupPath)}\n`);

  // Read current seed.ts
  let seedContent = fs.readFileSync(seedPath, "utf-8");

  logger.info("📝 Updating seed.ts with new HTML templates...\n");

  // Function to update a template
  const updateTemplate = (templateCode: string, html: string): boolean => {
    const regex = new RegExp(
      `(template_code: "${templateCode}",[\\s\\S]*?body_translations: \\{\\s*en: \`)([^\`]*?)(\`,)`,
      "m"
    );

    if (!regex.test(seedContent)) {
      logger.warn(`⚠️  Could not find ${templateCode} template in seed.ts`);
      return false;
    }

    seedContent = seedContent.replace(
      regex,
      (match, before, oldHtml, after) => {
        logger.info(`   ✅ Updated ${templateCode}`);
        return `${before}${html}${after}`;
      }
    );

    return true;
  };

  // Update all templates
  const templateNames = Object.keys(templates) as Array<keyof typeof templates>;
  let updatedCount = 0;

  for (const templateCode of templateNames) {
    if (updateTemplate(templateCode, templates[templateCode])) {
      updatedCount++;
    }
  }

  logger.info(
    `\n✅ Updated ${updatedCount}/${templateNames.length} templates\n`
  );

  // Write updated seed.ts
  fs.writeFileSync(seedPath, seedContent, "utf-8");

  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("✅ SEED.TS UPDATED SUCCESSFULLY");
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  logger.info("📋 Next steps:");
  logger.info("   1. Review changes: git diff prisma/seed.ts");
  logger.info("   2. Reseed database: pnpm prisma:seed");
  logger.info(
    "   3. Send test email: pnpm exec tsx scripts/test-email-send.ts\n"
  );

  return {
    templates,
    updatedCount,
    backupPath,
  };
}

// Execute
updateSeedTemplates()
  .then(() => {
    logger.info("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      { error: error.message, stack: error.stack },
      "❌ Script failed"
    );
    process.exit(1);
  });
