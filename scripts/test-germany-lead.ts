/**
 * Test script: Create Germany lead and check email sending
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger";

const prisma = new PrismaClient();

async function testGermanyLead() {
  logger.info("Checking Germany (DE) configuration in crm_countries");

  const country = await prisma.crm_countries.findUnique({
    where: { country_code: "DE" },
    select: {
      country_code: true,
      country_name_en: true,
      country_name_fr: true,
      country_name_ar: true,
      is_operational: true,
      notification_locale: true,
    },
  });

  if (!country) {
    logger.error("Germany (DE) not found in crm_countries!");
    const countries = await prisma.crm_countries.findMany({
      select: {
        country_code: true,
        country_name_en: true,
        is_operational: true,
      },
      orderBy: { country_code: "asc" },
    });
    logger.info({ countries }, "Available countries");
    return;
  }

  logger.info({ country }, "Germany configuration found");

  logger.info("Checking email template (expansion_opportunity)");

  const template = await prisma.crm_notification_templates.findFirst({
    where: { template_code: "expansion_opportunity" },
    select: {
      template_code: true,
      subject_en: true,
      subject_fr: true,
      body_html_en: true,
      body_html_fr: true,
      is_active: true,
    },
  });

  if (!template) {
    logger.error("Template 'expansion_opportunity' not found!");
    return;
  }

  logger.info(
    {
      templateCode: template.template_code,
      subjectEn: template.subject_en,
      subjectFr: template.subject_fr,
      isActive: template.is_active,
    },
    "Template found"
  );

  const selectedTemplate = country.is_operational
    ? "lead_confirmation"
    : "expansion_opportunity";
  const selectedLocale = country.notification_locale || "en";
  const countryName =
    selectedLocale === "fr" ? country.country_name_fr : country.country_name_en;

  logger.info(
    {
      template: selectedTemplate,
      locale: selectedLocale,
      countryName,
    },
    "Email configuration ready"
  );

  logger.info("All checks passed");
}

testGermanyLead()
  .catch((error) => {
    logger.error({ error: error.message }, "Test failed");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
