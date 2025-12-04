import { render } from "@react-email/render";
import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

// Import single template with locale support
import ExpansionOpportunity from "../emails/templates/ExpansionOpportunity";

/**
 * Generate Expansion Opportunity Email Templates (EN/FR/AR)
 *
 * This script generates HTML versions of expansion_opportunity templates
 * for leads from non-operational countries (ES, IT, DE, etc.)
 *
 * Usage:
 * ```bash
 * pnpm exec tsx scripts/generate-expansion-templates.ts
 * ```
 */

async function generateExpansionTemplates() {
  logger.info("Generating expansion_opportunity templates (EN/FR/AR)...\n");

  // Output directory
  const outputDir = path.join(process.cwd(), "generated-emails");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const templateProps = {
    first_name: "{{first_name}}",
    company_name: "{{company_name}}",
    fleet_size: "{{fleet_size}}",
    country_preposition: "{{country_preposition}}",
    country_name: "{{country_name}}",
    phone_row: "{{phone_row}}",
    message_row: "{{message_row}}",
  };

  // Template 1: Expansion Opportunity (EN)
  logger.info("1/3  Generating expansion_opportunity (EN) template...");

  const expansionOpportunityHTML = await render(
    ExpansionOpportunity({ ...templateProps, locale: "en" })
  );

  fs.writeFileSync(
    path.join(outputDir, "expansion-opportunity.html"),
    expansionOpportunityHTML
  );

  logger.info("   expansion-opportunity.html\n");

  // Template 2: Expansion Opportunity (FR)
  logger.info("2/3  Generating expansion_opportunity (FR) template...");

  const expansionOpportunityFRHTML = await render(
    ExpansionOpportunity({ ...templateProps, locale: "fr" })
  );

  fs.writeFileSync(
    path.join(outputDir, "expansion-opportunity-fr.html"),
    expansionOpportunityFRHTML
  );

  logger.info("   expansion-opportunity-fr.html\n");

  // Template 3: Expansion Opportunity (AR)
  logger.info("3/3  Generating expansion_opportunity (AR) template...");

  const expansionOpportunityARHTML = await render(
    ExpansionOpportunity({ ...templateProps, locale: "ar" })
  );

  fs.writeFileSync(
    path.join(outputDir, "expansion-opportunity-ar.html"),
    expansionOpportunityARHTML
  );

  logger.info("   expansion-opportunity-ar.html\n");

  // Summary
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  logger.info("GENERATION COMPLETE");
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  logger.info(`Output directory: ${outputDir}\n`);

  logger.info("Generated files:");
  logger.info("   - expansion-opportunity.html (EN)");
  logger.info("   - expansion-opportunity-fr.html (FR)");
  logger.info("   - expansion-opportunity-ar.html (AR with RTL)\n");

  logger.info("Verify variables:");
  logger.info("   Check that {{variable}} placeholders are present in HTML");
  logger.info(
    '   grep "{{first_name}}" generated-emails/expansion-opportunity.html\n'
  );

  logger.info("Next steps:");
  logger.info("   1. Review generated HTML files");
  logger.info("   2. Add template to prisma/seed.ts");
  logger.info("   3. Run: pnpm prisma:seed");
  logger.info("   4. Test expansion flow\n");

  return {
    en: expansionOpportunityHTML,
    fr: expansionOpportunityFRHTML,
    ar: expansionOpportunityARHTML,
  };
}

// Execute
generateExpansionTemplates()
  .then(() => {
    logger.info("Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error: error.message, stack: error.stack }, "Script failed");
    process.exit(1);
  });
