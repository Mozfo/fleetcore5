/**
 * Generate CustomerVerification HTML for seed.ts
 *
 * Run: pnpm exec tsx scripts/generate-customer-verification-html.ts
 */

import { render } from "@react-email/components";
import { writeFileSync } from "fs";
import CustomerVerification from "@/emails/templates/CustomerVerification";
import { logger } from "@/lib/logger";
import type { EmailLocale } from "@/lib/i18n/email-translations";

const LOCALES: EmailLocale[] = ["en", "fr", "ar"];

async function generateTemplates(): Promise<void> {
  logger.info({}, "Generating CustomerVerification HTML templates...");

  const outputs: Record<string, string> = {};

  for (const locale of LOCALES) {
    const html = await render(
      CustomerVerification({
        locale,
        company_name: "{{company_name}}",
        tenant_code: "{{tenant_code}}",
        verification_url: "{{verification_url}}",
        expires_in_hours: 24,
      })
    );

    // Post-process: replace literal 24 with placeholder
    const processedHtml = html
      .replace(/24 hours/g, "{{expires_in_hours}} hours")
      .replace(/24 heures/g, "{{expires_in_hours}} heures")
      .replace(/24 ساعة/g, "{{expires_in_hours}} ساعة");

    outputs[locale] = processedHtml;
    logger.info(
      { locale, length: processedHtml.length },
      "Generated HTML template"
    );
  }

  // Write to JSON file for easy copy to seed.ts
  const outputPath = "generated-emails/customer-verification-templates.json";
  writeFileSync(outputPath, JSON.stringify(outputs, null, 2), "utf-8");

  logger.info({ outputPath }, "Output saved");
}

generateTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    logger.error({ err }, "Error generating templates");
    process.exit(1);
  });
