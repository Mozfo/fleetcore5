import fs from "fs";
import path from "path";
import { logger } from "@/lib/logger";

/**
 * Add expansion_opportunity template to seed.ts
 * Reads generated HTML files and inserts template before line 989
 */

async function addExpansionTemplate() {
  const seedPath = path.join(process.cwd(), "prisma/seed.ts");
  const htmlDir = path.join(process.cwd(), "generated-emails");

  // Read HTML files
  const enHTML = fs.readFileSync(
    path.join(htmlDir, "expansion-opportunity.html"),
    "utf-8"
  );
  const frHTML = fs.readFileSync(
    path.join(htmlDir, "expansion-opportunity-fr.html"),
    "utf-8"
  );
  const arHTML = fs.readFileSync(
    path.join(htmlDir, "expansion-opportunity-ar.html"),
    "utf-8"
  );

  // Read seed.ts
  const seedContent = fs.readFileSync(seedPath, "utf-8");
  const lines = seedContent.split("\n");

  // Find insertion point (before line 989: "  ];" - end of templates array)
  let insertIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "];" && i > 900 && i < 1000) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) {
    throw new Error("Could not find insertion point in seed.ts");
  }

  // Template entry to insert
  const templateEntry = `
    // 12. CRM: Expansion Opportunity (NEW - Sprint 1.1)
    {
      template_code: "expansion_opportunity",
      channel: "email" as const,
      template_name: "Expansion Market Interest Notification",
      subject_translations: {
        en: "Thank you for your interest in FleetCore",
        fr: "Merci pour votre intérêt pour FleetCore",
        ar: "شكراً لاهتمامك بـ FleetCore",
      },
      body_translations: {
        en: \`${enHTML}\`,
        fr: \`${frHTML}\`,
        ar: \`${arHTML}\`,
      },
      variables: [
        "first_name",
        "company_name",
        "fleet_size",
        "country_name",
      ],
      supported_countries: [
        "ES", "IT", "DE", "NL", "PT", "PL", "SE", "NO", "DK", "FI",
        "AT", "CH", "IE", "CZ", "GR", "HU", "RO", "BG", "HR", "SK",
        "SI", "LT", "LV", "EE", "LU", "MT", "CY", "IS",
      ],
      supported_locales: ["en", "fr", "ar"],
      status: "active" as const,
    },
`;

  // Insert the template entry
  lines.splice(insertIndex, 0, templateEntry);

  // Write back to seed.ts
  fs.writeFileSync(seedPath, lines.join("\n"));

  logger.info(
    `✅ Added expansion_opportunity template to seed.ts at line ${insertIndex}`
  );
  logger.info("📋 Next step: Run pnpm prisma:seed to update database");
}

addExpansionTemplate().catch((error) => {
  logger.error({ error: error.message }, "❌ Script failed");
  process.exit(1);
});
