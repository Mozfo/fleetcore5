/**
 * MANUAL SEED TEMPLATE UPDATE
 *
 * This script manually updates ONLY the expansion_opportunity and lead_confirmation
 * templates in seed.ts with the correct templates from regenerated-templates.json.
 *
 * REASON: We CANNOT use regex to parse TypeScript code. This script uses careful
 * string replacement with very specific unique markers.
 */

import { readFileSync, writeFileSync } from "fs";
import { logger } from "@/lib/logger";

async function manualUpdateSeedTemplates() {
  try {
    logger.info(
      "🔧 MANUAL SEED UPDATE - expansion_opportunity & lead_confirmation\n"
    );

    // Read the regenerated templates
    const regenerated = JSON.parse(
      readFileSync("generated-emails/regenerated-templates.json", "utf-8")
    );

    // Read current seed.ts
    let seedContent = readFileSync("prisma/seed.ts", "utf-8");

    // Update expansion_opportunity
    logger.info("📝 Updating expansion_opportunity...");

    // Find unique start marker for expansion_opportunity body_translations
    const expansionStart = 'template_code: "expansion_opportunity",';
    const expansionBodyStart = seedContent.indexOf(expansionStart);
    if (expansionBodyStart === -1) {
      throw new Error("Could not find expansion_opportunity template");
    }

    // Find the body_translations section for expansion_opportunity
    const expansionBodyTranslationsStart = seedContent.indexOf(
      "body_translations: {",
      expansionBodyStart
    );

    // Find the END of body_translations (look for the closing }, BEFORE variables:)
    const expansionVariablesStart = seedContent.indexOf(
      'variables: ["first_name", "company_name", "fleet_size", "country_name"]',
      expansionBodyTranslationsStart
    );

    // The body_translations block ends with:\n      },\n      variables:
    // We need to find: },\n      variables:
    const expansionBodyEnd = seedContent.lastIndexOf(
      "},",
      expansionVariablesStart
    );

    // Extract the old body_translations block
    const oldExpansionBody = seedContent.substring(
      expansionBodyTranslationsStart,
      expansionBodyEnd + 2 // Include the },
    );

    logger.info(
      `   Old template length: ${oldExpansionBody.length} characters`
    );

    // Build new body_translations
    const newExpansionBody = `body_translations: {
        en: \`${regenerated.expansion_opportunity.en}\`,
        fr: \`${regenerated.expansion_opportunity.fr}\`,
        ar: \`${regenerated.expansion_opportunity.ar}\`,
      }`;

    // Replace
    seedContent = seedContent.replace(oldExpansionBody, newExpansionBody);
    logger.info(
      `   ✅ Updated expansion_opportunity (${newExpansionBody.length} chars)`
    );

    // Update lead_confirmation
    logger.info("📝 Updating lead_confirmation...");

    const leadStart = 'template_code: "lead_confirmation",';
    const leadBodyStart = seedContent.indexOf(leadStart);
    if (leadBodyStart === -1) {
      throw new Error("Could not find lead_confirmation template");
    }

    const leadBodyTranslationsStart = seedContent.indexOf(
      "body_translations: {",
      leadBodyStart
    );

    // Find the variables: line after this body_translations
    const leadVariablesStart = seedContent.indexOf(
      'variables: ["first_name", "company_name", "fleet_size", "country_name"]',
      leadBodyTranslationsStart
    );

    const leadBodyEnd = seedContent.lastIndexOf("},", leadVariablesStart);

    const oldLeadBody = seedContent.substring(
      leadBodyTranslationsStart,
      leadBodyEnd + 2
    );

    logger.info(`   Old template length: ${oldLeadBody.length} characters`);

    const newLeadBody = `body_translations: {
        en: \`${regenerated.lead_confirmation.en}\`,
        fr: \`${regenerated.lead_confirmation.fr}\`,
        ar: \`${regenerated.lead_confirmation.ar}\`,
      }`;

    seedContent = seedContent.replace(oldLeadBody, newLeadBody);
    logger.info(
      `   ✅ Updated lead_confirmation (${newLeadBody.length} chars)`
    );

    // Also need to update the variables array to include country_preposition
    logger.info("📝 Updating variables arrays...");

    seedContent = seedContent.replace(
      /variables: \["first_name", "company_name", "fleet_size", "country_name"\]/g,
      'variables: ["first_name", "company_name", "fleet_size", "country_preposition", "country_name", "phone_row", "message_row"]'
    );

    logger.info("   ✅ Updated variables arrays");

    // Write back
    writeFileSync("prisma/seed.ts", seedContent, "utf-8");

    logger.info("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ MANUAL UPDATE COMPLETED");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("Updated templates:");
    logger.info("  - expansion_opportunity (en/fr/ar)");
    logger.info("  - lead_confirmation (en/fr/ar)");
    logger.info("\n💡 Now run: pnpm prisma db seed");
  } catch (error) {
    logger.error({ error }, "❌ Manual update failed");
    throw error;
  }
}

manualUpdateSeedTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
