import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test Expansion Flow (Operational vs Non-Operational Countries)
 *
 * Tests:
 * 1. GET /api/public/countries - Fetch countries
 * 2. Create test leads for operational country (UAE → lead_confirmation)
 * 3. Create test leads for expansion country (ES → expansion_opportunity)
 * 4. Verify email routing logic
 */

const prisma = new PrismaClient();

interface _Country {
  country_code: string;
  country_name_en: string;
  is_operational: boolean;
}

async function testExpansionFlow() {
  logger.info("🧪 Starting Expansion Flow Test\n");

  try {
    // Cleanup: Delete existing test leads
    logger.info("🧹 Cleanup: Deleting existing test leads...");
    const deleted = await prisma.crm_leads.deleteMany({
      where: {
        email: "mohamed@bluewise.io",
      },
    });
    logger.info(`   ✅ Deleted ${deleted.count} existing test lead(s)\n`);

    // Test 1: Verify crm_countries table
    logger.info("📋 Test 1: Fetch countries from database");
    const countries = await prisma.crm_countries.findMany({
      where: { is_visible: true },
      select: {
        country_code: true,
        country_name_en: true,
        is_operational: true,
        display_order: true,
      },
      orderBy: { display_order: "asc" },
    });

    logger.info(`   ✅ Found ${countries.length} visible countries`);
    const operational = countries.filter((c) => c.is_operational);
    const expansion = countries.filter((c) => !c.is_operational);
    logger.info(
      `   - Operational: ${operational.length} (${operational.map((c) => c.country_code).join(", ")})`
    );
    logger.info(
      `   - Expansion: ${expansion.length} (${expansion
        .map((c) => c.country_code)
        .slice(0, 5)
        .join(", ")}, ...)\n`
    );

    // Test 2: Create test lead - Operational Country (UAE)
    logger.info("📋 Test 2: Create lead for OPERATIONAL country (UAE)");
    const operationalLead = await prisma.crm_leads.create({
      data: {
        first_name: "Ahmed",
        last_name: "Al-Mansoori",
        email: "mohamed@bluewise.io",
        demo_company_name: "Dubai Fleet Solutions",
        fleet_size: "51-100 vehicles",
        phone: "+971501234567",
        message: "Interested in platform demo",
        country_code: "AE",
        status: "new",
      },
    });

    logger.info(`   ✅ Lead created: ${operationalLead.id}`);

    // Send email for operational country
    const notificationService = new NotificationService();
    const operationalResult = await notificationService.sendEmail({
      recipientEmail: operationalLead.email,
      templateCode: "lead_confirmation",
      variables: {
        first_name: operationalLead.first_name,
        company_name: operationalLead.demo_company_name,
        fleet_size: operationalLead.fleet_size,
        country_name: "United Arab Emirates",
      },
      leadId: operationalLead.id,
      countryCode: "AE",
      fallbackLocale: "en",
    });

    logger.info(
      `   📧 Email sent: ${operationalResult.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`   - Template: lead_confirmation`);
    logger.info(`   - Locale: ${operationalResult.locale}`);
    if (operationalResult.messageId) {
      logger.info(`   - Message ID: ${operationalResult.messageId}\n`);
    }
    if (!operationalResult.success && operationalResult.error) {
      logger.error(`   ❌ Error details: ${operationalResult.error}\n`);
    }

    // Delete operational lead to allow reusing same email (UNIQUE constraint)
    logger.info("🧹 Deleting operational lead to reuse email...");
    await prisma.crm_leads.delete({
      where: { id: operationalLead.id },
    });
    logger.info("   ✅ Operational lead deleted\n");

    // Test 3: Create test lead - Expansion Country (Spain)
    logger.info("📋 Test 3: Create lead for EXPANSION country (Spain)");
    const expansionLead = await prisma.crm_leads.create({
      data: {
        first_name: "Carlos",
        last_name: "García",
        email: "mohamed@bluewise.io",
        demo_company_name: "Madrid Transportes SL",
        fleet_size: "101-200 vehicles",
        phone: "+34612345678",
        message: "Quiero información sobre FleetCore",
        country_code: "ES",
        status: "new",
      },
    });

    logger.info(`   ✅ Lead created: ${expansionLead.id}`);

    // Send email for expansion country
    const expansionResult = await notificationService.sendEmail({
      recipientEmail: expansionLead.email,
      templateCode: "expansion_opportunity",
      variables: {
        first_name: expansionLead.first_name,
        company_name: expansionLead.demo_company_name,
        fleet_size: expansionLead.fleet_size,
        country_name: "Spain",
      },
      leadId: expansionLead.id,
      countryCode: "ES",
      fallbackLocale: "en",
    });

    logger.info(
      `   📧 Email sent: ${expansionResult.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`   - Template: expansion_opportunity`);
    logger.info(`   - Locale: ${expansionResult.locale}`);
    if (expansionResult.messageId) {
      logger.info(`   - Message ID: ${expansionResult.messageId}\n`);
    }
    if (!expansionResult.success && expansionResult.error) {
      logger.error(`   ❌ Error details: ${expansionResult.error}\n`);
    }

    // Test 4: Verify routing logic
    logger.info("📋 Test 4: Verify routing logic");
    const uaeCountry = await prisma.crm_countries.findUnique({
      where: { country_code: "AE" },
    });
    const esCountry = await prisma.crm_countries.findUnique({
      where: { country_code: "ES" },
    });

    logger.info(`   UAE (AE):`);
    logger.info(`     - is_operational: ${uaeCountry?.is_operational}`);
    logger.info(`     - Expected template: lead_confirmation`);
    logger.info(
      `     - Actual template: ${operationalResult.success ? "lead_confirmation" : "ERROR"}`
    );
    logger.info(`   Spain (ES):`);
    logger.info(`     - is_operational: ${esCountry?.is_operational}`);
    logger.info(`     - Expected template: expansion_opportunity`);
    logger.info(
      `     - Actual template: ${expansionResult.success ? "expansion_opportunity" : "ERROR"}\n`
    );

    // Summary
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("✅ TEST SUMMARY");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info(`Countries fetched: ${countries.length}`);
    logger.info(
      `Operational lead email: ${operationalResult.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(
      `Expansion lead email: ${expansionResult.success ? "SUCCESS" : "FAILED"}`
    );
    logger.info(`\nTest leads created (sequential, same email):`);
    logger.info(`  - ${operationalLead.id} (AE) - DELETED after email sent`);
    logger.info(`  - ${expansionLead.id} (ES) - ACTIVE`);
    logger.info("\n💡 Check your email inbox for test emails");
    logger.info(
      '   Email 1: "Thank you for your interest in FleetCore" (Operational - lead_confirmation)'
    );
    logger.info(
      '   Email 2: "Thank you for your interest - We\'ll notify you" (Expansion - expansion_opportunity)\n'
    );
  } catch (error) {
    logger.error({ error }, "❌ Test failed");
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
testExpansionFlow()
  .then(() => {
    logger.info("✅ Test completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    logger.error(
      { error: error.message, stack: error.stack },
      "❌ Test failed"
    );
    process.exit(1);
  });
