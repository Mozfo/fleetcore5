import { PrismaClient } from "@prisma/client";
import { NotificationService } from "@/lib/services/notification/notification.service";
import { logger } from "@/lib/logger";

/**
 * Test Notification Locale CASCADE (4 levels)
 *
 * Tests:
 * 1. UAE + English (params.locale) → CASCADE_3_PARAMS
 * 2. UAE + French (params.locale) → CASCADE_3_PARAMS
 * 3. No tenant, no user, no params → CASCADE_4_FALLBACK (en)
 * 4. Verify cascadeSource in metadata
 */

async function testLocaleCascade() {
  const prisma = new PrismaClient();
  const notificationService = new NotificationService(prisma);
  const testEmail = process.env.TEST_EMAIL || "test@example.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.com";

  logger.info("🧪 Testing Notification Locale CASCADE (4 levels)...\n");

  const results: Array<{
    test: string;
    success: boolean;
    cascadeSource?: string;
    error?: string;
  }> = [];

  try {
    // ==========================================
    // TEST 1: UAE + English (params.locale)
    // ==========================================
    logger.info(
      "TEST 1: countryCode=AE + locale=en → Should get English email (CASCADE_3_PARAMS)"
    );
    const result1 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Ahmed",
        tenant_name: "Dubai Fleet Operations",
        email: testEmail,
        role: "Fleet Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "AE", // UAE country
      locale: "en", // SELECT English among AE's official languages
      fallbackLocale: "en",
    });
    results.push({
      test: "UAE + English",
      success: result1.success,
      cascadeSource: result1.metadata?.cascadeSource as string,
      error: result1.error,
    });
    logger.info(
      {
        success: result1.success,
        cascadeSource: result1.metadata?.cascadeSource,
      },
      "TEST 1 Result\n"
    );

    // ==========================================
    // TEST 2: UAE + French (params.locale)
    // ==========================================
    logger.info(
      "TEST 2: countryCode=AE + locale=fr → Should get French email (CASCADE_3_PARAMS)"
    );
    const result2 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Mohammed",
        tenant_name: "Dubai Fleet Operations",
        email: testEmail,
        role: "Fleet Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "AE",
      locale: "fr", // SELECT French (even though AE primary is 'ar')
      fallbackLocale: "en",
    });
    results.push({
      test: "UAE + French",
      success: result2.success,
      cascadeSource: result2.metadata?.cascadeSource as string,
      error: result2.error,
    });
    logger.info(
      {
        success: result2.success,
        cascadeSource: result2.metadata?.cascadeSource,
      },
      "TEST 2 Result\n"
    );

    // ==========================================
    // TEST 3: No tenant, no user, no params → Fallback 'en'
    // ==========================================
    logger.info(
      'TEST 3: No tenant, no user, no params.locale → Should fallback to "en" (CASCADE_4_FALLBACK)'
    );
    const result3 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "John",
        tenant_name: "Test Fleet",
        email: testEmail,
        role: "Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      fallbackLocale: "en",
    });
    results.push({
      test: "No context → Fallback",
      success: result3.success,
      cascadeSource: result3.metadata?.cascadeSource as string,
      error: result3.error,
    });
    logger.info(
      {
        success: result3.success,
        cascadeSource: result3.metadata?.cascadeSource,
      },
      "TEST 3 Result\n"
    );

    // ==========================================
    // TEST 4: France country + No locale → Should cascade to fallback 'en'
    // ==========================================
    logger.info(
      'TEST 4: countryCode=FR + NO locale → Should fallback to "en" (no country.primary_locale cascade)'
    );
    const result4 = await notificationService.sendEmail({
      recipientEmail: testEmail,
      templateCode: "member_welcome",
      variables: {
        first_name: "Pierre",
        tenant_name: "Paris Fleet",
        email: testEmail,
        role: "Manager",
        dashboard_url: `${appUrl}/dashboard`,
      },
      countryCode: "FR", // France
      // NO locale specified → Should NOT use country.primary_locale
      fallbackLocale: "en",
    });
    results.push({
      test: "France + No locale",
      success: result4.success,
      cascadeSource: result4.metadata?.cascadeSource as string,
      error: result4.error,
    });
    logger.info(
      {
        success: result4.success,
        cascadeSource: result4.metadata?.cascadeSource,
      },
      "TEST 4 Result\n"
    );

    // ==========================================
    // Summary
    // ==========================================
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    logger.info("📊 CASCADE TEST SUMMARY");
    logger.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    logger.info(`Total: ${results.length}`);
    logger.info(`✅ Successful: ${successCount}`);
    logger.info(`❌ Failed: ${failureCount}\n`);

    results.forEach((r, i) => {
      const status = r.success ? "✅" : "❌";
      logger.info(
        `${status} ${i + 1}. ${r.test} → ${r.cascadeSource || "N/A"}`
      );
      if (!r.success) {
        logger.info(`   Error: ${r.error}`);
      }
    });
    logger.info("");

    // Validation checks
    const validationErrors: string[] = [];

    if (results[0].cascadeSource !== "CASCADE_3_PARAMS") {
      validationErrors.push(
        `TEST 1: Expected CASCADE_3_PARAMS, got ${results[0].cascadeSource}`
      );
    }
    if (results[1].cascadeSource !== "CASCADE_3_PARAMS") {
      validationErrors.push(
        `TEST 2: Expected CASCADE_3_PARAMS, got ${results[1].cascadeSource}`
      );
    }
    if (results[2].cascadeSource !== "CASCADE_4_FALLBACK") {
      validationErrors.push(
        `TEST 3: Expected CASCADE_4_FALLBACK, got ${results[2].cascadeSource}`
      );
    }
    if (results[3].cascadeSource !== "CASCADE_4_FALLBACK") {
      validationErrors.push(
        `TEST 4: Expected CASCADE_4_FALLBACK (NOT country primary_locale), got ${results[3].cascadeSource}`
      );
    }

    if (validationErrors.length > 0) {
      logger.error("⚠️  VALIDATION FAILURES:");
      validationErrors.forEach((err) => logger.error(`   - ${err}`));
      logger.error("");
    }

    if (successCount === results.length && validationErrors.length === 0) {
      logger.info(`🎉 All CASCADE tests passed!`);
      logger.info(`📬 Check ${testEmail} inbox for ${results.length} emails\n`);
    }

    await prisma.$disconnect();
    process.exit(
      successCount === results.length && validationErrors.length === 0 ? 0 : 1
    );
  } catch (error) {
    logger.error({ error }, "❌ Test script failed");
    await prisma.$disconnect();
    process.exit(1);
  }
}

void testLocaleCascade();
