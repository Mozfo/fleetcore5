/**
 * NotificationService Integration Tests
 * Tests with real PostgreSQL database (CASCADE algorithm, JSONB, arrays)
 *
 * Setup: Requires test database with schema and seed data
 * Run: DATABASE_URL="postgresql://..." RESEND_API_KEY="re_test" pnpm exec vitest run lib/services/notification/__tests__/notification.service.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NotificationService } from "../notification.service";
import type {
  dir_notification_templates,
  dir_country_locales,
} from "@prisma/client";

// Check if integration test environment is configured
// Requirements:
// 1. DATABASE_URL must be set
// 2. RESEND_API_KEY must be set
// 3. Must NOT be a pooled Supabase connection (production DB)
// 4. OR must explicitly enable with ENABLE_NOTIFICATION_INTEGRATION_TESTS=true
const isPooledSupabase = process.env.DATABASE_URL?.includes(
  "pooler.supabase.com"
);
const hasIntegrationEnv = Boolean(
  process.env.DATABASE_URL &&
    process.env.RESEND_API_KEY &&
    (process.env.ENABLE_NOTIFICATION_INTEGRATION_TESTS === "true" ||
      !isPooledSupabase)
);

// Skip integration tests if environment not configured
// Note: Using describe.todo to completely skip file when env not set
const describeIntegration = hasIntegrationEnv ? describe : describe.todo;

// Real Prisma client for integration testing (only if env configured)
let prisma: PrismaClient;
let service: NotificationService;

// Test data IDs (will be created in beforeAll)
let testTenantId: string;
let testUserId: string;
let testLeadId: string;
let testTemplateId: string;
let _testCountryFR: dir_country_locales;
let _testCountryAE: dir_country_locales;
let testTemplate: dir_notification_templates;

describeIntegration("NotificationService Integration Tests", () => {
  beforeAll(async () => {
    // Skip setup if environment not configured
    if (!hasIntegrationEnv) return;

    // Initialize Prisma client and service
    prisma = new PrismaClient();
    service = new NotificationService(prisma);

    // Create test countries (DIR domain - reference data)
    _testCountryFR = await prisma.dir_country_locales.upsert({
      where: { country_code: "FR" },
      update: {},
      create: {
        country_code: "FR",
        country_name: "France",
        primary_locale: "fr",
        fallback_locale: "en",
        supported_locales: ["fr", "en"],
        timezone: "Europe/Paris",
        currency: "EUR",
        date_format: "DD/MM/YYYY",
        time_format: "HH:mm",
        rtl_enabled: false,
        status: "active",
      },
    });

    _testCountryAE = await prisma.dir_country_locales.upsert({
      where: { country_code: "AE" },
      update: {},
      create: {
        country_code: "AE",
        country_name: "United Arab Emirates",
        primary_locale: "ar",
        fallback_locale: "en",
        supported_locales: ["ar", "en"],
        timezone: "Asia/Dubai",
        currency: "AED",
        date_format: "DD/MM/YYYY",
        time_format: "HH:mm",
        rtl_enabled: true,
        status: "active",
      },
    });

    // Create test notification template (DIR domain)
    testTemplate = await prisma.dir_notification_templates.upsert({
      where: {
        template_code_channel: {
          template_code: "integration_test_template",
          channel: "email",
        },
      },
      update: {},
      create: {
        template_code: "integration_test_template",
        channel: "email",
        template_name: "Integration Test Template",
        subject_translations: {
          en: "Test Subject EN",
          fr: "Sujet de test FR",
          ar: "موضوع الاختبار AR",
        },
        body_translations: {
          en: "Hello {{user_name}}, welcome to {{tenant_name}}!",
          fr: "Bonjour {{user_name}}, bienvenue chez {{tenant_name}}!",
          ar: "مرحبا {{user_name}}، مرحبا بك في {{tenant_name}}!",
        },
        variables: ["user_name", "tenant_name"],
        supported_countries: ["FR", "AE", "GB", "US"],
        supported_locales: ["en", "fr", "ar"],
        status: "active",
      },
    });
    testTemplateId = testTemplate.id;

    // Create test tenant (ADM domain)
    const tenant = await prisma.adm_tenants.create({
      data: {
        name: "Integration Test Tenant",
        country_code: "FR",
        status: "active",
        timezone: "Europe/Paris",
      },
    });
    testTenantId = tenant.id;

    // Create test user/member (ADM domain)
    const member = await prisma.adm_members.create({
      data: {
        tenant_id: testTenantId,
        email: "integration-test@fleetcore.app",
        auth_user_id: "test_auth_user_integration",
        phone: "+33600000001",
        first_name: "Integration",
        last_name: "Test",
        preferred_language: "fr",
        status: "active",
        role: "member",
      },
    });
    testUserId = member.id;

    // Create test lead (CRM domain)
    const lead = await prisma.crm_leads.create({
      data: {
        email: "lead-test@example.com",
        first_name: "Lead",
        last_name: "Test",
        phone: "+971500000001",
        country_code: "AE",
        tenant_id: testTenantId, // V7: tenant_id required
        status: "new",
        source: "website",
      },
    });
    testLeadId = lead.id;
  });

  afterAll(async () => {
    // Skip cleanup if environment not configured or setup never ran
    if (!hasIntegrationEnv || !prisma) return;

    // Cleanup test data (soft-delete) - only if IDs were created
    if (testLeadId) {
      await prisma.crm_leads.update({
        where: { id: testLeadId },
        data: { deleted_at: new Date(), deleted_by: null },
      });
    }

    if (testUserId) {
      await prisma.adm_members.update({
        where: { id: testUserId },
        data: { deleted_at: new Date(), deleted_by: null },
      });
    }

    if (testTenantId) {
      await prisma.adm_tenants.update({
        where: { id: testTenantId },
        data: { deleted_at: new Date() },
      });
    }

    if (testTemplateId) {
      await prisma.dir_notification_templates.update({
        where: { id: testTemplateId },
        data: { deleted_at: new Date(), deleted_by: null },
      });
    }

    // Note: Keep dir_country_locales as reference data (don't delete)

    await prisma.$disconnect();
  });

  describe("CASCADE Level 1: User preferred_language (adm_members)", () => {
    it("should select FR locale from user preferred_language", async () => {
      const result = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        userId: testUserId, // Has preferred_language = "fr"
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("fr");
      expect(result.subject).toBe("Sujet de test FR");
      expect(result.body).toContain("Bonjour {{user_name}}");
    });
  });

  describe("CASCADE Level 3: Tenant country primary_locale (adm_tenants → dir_country_locales)", () => {
    it("should select FR locale from tenant country when no user preferred_language", async () => {
      // Create member without preferred_language
      const memberNoLang = await prisma.adm_members.create({
        data: {
          tenant_id: testTenantId,
          email: "no-lang@test.com",
          auth_user_id: "test_auth_user_no_lang",
          phone: "+33600000002",
          first_name: "No",
          last_name: "Lang",
          preferred_language: null,
          status: "active",
          role: "member",
        },
      });

      const result = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        userId: memberNoLang.id,
        tenantId: testTenantId, // FR tenant → fr locale
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("fr");
      expect(result.subject).toBe("Sujet de test FR");

      // Cleanup
      await prisma.adm_members.update({
        where: { id: memberNoLang.id },
        data: { deleted_at: new Date(), deleted_by: null },
      });
    });
  });

  describe("CASCADE Level 4: Lead country primary_locale (crm_leads → dir_country_locales)", () => {
    it("should select AR locale from lead country", async () => {
      const result = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        leadId: testLeadId, // AE lead → ar locale
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("ar");
      expect(result.subject).toBe("موضوع الاختبار AR");
      expect(result.body).toContain("مرحبا {{user_name}}");
    });
  });

  describe("CASCADE Level 5: Direct countryCode parameter", () => {
    it("should select locale from direct countryCode parameter", async () => {
      const result = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        countryCode: "AE",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("ar");
      expect(result.subject).toBe("موضوع الاختبار AR");
    });
  });

  describe("CASCADE Level 6: Fallback locale", () => {
    it("should use fallback locale when no cascade matches", async () => {
      const result = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        fallbackLocale: "en",
      });

      expect(result.locale).toBe("en");
      expect(result.subject).toBe("Test Subject EN");
      expect(result.body).toContain("Hello {{user_name}}");
    });
  });

  describe("Template Variable Rendering", () => {
    it("should replace {{variables}} with actual values", async () => {
      const selected = await service.selectTemplate({
        templateCode: "integration_test_template",
        channel: "email",
        fallbackLocale: "en",
      });

      const rendered = await service.renderTemplate(selected, {
        user_name: "John Doe",
        tenant_name: "FleetCore",
      });

      expect(rendered.subject).toBe("Test Subject EN");
      expect(rendered.body).toBe("Hello John Doe, welcome to FleetCore!");
    });
  });

  describe("PostgreSQL Array Query: supported_locales", () => {
    it("should query templates by supported_locales array (GIN index)", async () => {
      // Direct repository test for PostgreSQL array operator
      const templates = await prisma.dir_notification_templates.findMany({
        where: {
          supported_locales: {
            has: "ar", // PostgreSQL: 'ar' = ANY(supported_locales)
          },
          deleted_at: null,
        },
      });

      expect(templates.length).toBeGreaterThan(0);
      expect(
        templates.some((t) => t.template_code === "integration_test_template")
      ).toBe(true);
    });
  });

  describe("JSONB Extraction: subject_translations / body_translations", () => {
    it("should extract French translation from JSONB field", async () => {
      const template = await prisma.dir_notification_templates.findUnique({
        where: { id: testTemplateId },
      });

      expect(template).not.toBeNull();
      if (template) {
        const subjectTranslations = template.subject_translations as Record<
          string,
          string
        >;
        const bodyTranslations = template.body_translations as Record<
          string,
          string
        >;

        expect(subjectTranslations.fr).toBe("Sujet de test FR");
        expect(subjectTranslations.ar).toBe("موضوع الاختبار AR");
        expect(bodyTranslations.en).toContain("Hello {{user_name}}");
      }
    });
  });
});
