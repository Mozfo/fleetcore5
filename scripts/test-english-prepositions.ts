/**
 * Test English Prepositions in Email Templates
 *
 * This script tests the new country_preposition_en feature by simulating
 * demo lead submissions for 3 different countries:
 * - France (should use "in")
 * - United States (should use "in the")
 * - United Kingdom (should use "in the")
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/lib/logger";

const prisma = new PrismaClient();

async function testEnglishPrepositions() {
  logger.info("🧪 Testing English Prepositions in Email Templates\n");
  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  const testCases = [
    { code: "FR", expected: "in France" },
    { code: "US", expected: "in the United States" },
    { code: "GB", expected: "in the United Kingdom" },
  ];

  for (const testCase of testCases) {
    logger.info(
      `📍 Testing ${testCase.code} (Expected: "${testCase.expected}")`
    );

    try {
      const country = await prisma.crm_countries.findUnique({
        where: { country_code: testCase.code },
        select: {
          country_code: true,
          country_name_en: true,
          country_preposition_en: true,
        },
      });

      if (!country) {
        logger.error(`   ❌ Country ${testCase.code} not found in database`);
        continue;
      }

      // Construct the full country name with preposition (as the API does)
      const fullCountryName = `${country.country_preposition_en} ${country.country_name_en}`;

      // Check if it matches expected
      const isCorrect = fullCountryName === testCase.expected;

      if (isCorrect) {
        logger.info(`   ✅ PASS: "${fullCountryName}"`);
      } else {
        logger.error(
          `   ❌ FAIL: Got "${fullCountryName}", expected "${testCase.expected}"`
        );
      }

      logger.info(`   Database values:`);
      logger.info(`      - country_name_en: "${country.country_name_en}"`);
      logger.info(
        `      - country_preposition_en: "${country.country_preposition_en}"`
      );
      logger.info("");
    } catch (error) {
      logger.error({ error }, `   ❌ Error testing ${testCase.code}`);
    }
  }

  logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  logger.info("💡 Note: If column 'country_preposition_en' doesn't exist:");
  logger.info("   Run the migration SQL in Supabase SQL Editor:");
  logger.info("   migrations/add_country_preposition_en.sql\n");
}

testEnglishPrepositions()
  .then(() => {
    logger.info("✅ Test completed");
    process.exit(0);
  })
  .catch((error) => {
    logger.error({ error: error.message }, "❌ Test failed");
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
