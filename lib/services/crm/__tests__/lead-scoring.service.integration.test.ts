/**
 * LeadScoringService Integration Tests
 *
 * Tests with REAL Supabase PostgreSQL database - NO MOCKS
 * Tests the actual scoring algorithms, database operations, and business rules.
 *
 * Setup: Requires Supabase database with schema and seed data
 * Run: ENABLE_LEAD_SCORING_INTEGRATION_TESTS=true pnpm exec vitest run --config vitest.config.integration.ts lib/services/crm/__tests__/lead-scoring.service.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { PrismaClient, Prisma } from "@prisma/client";
import { LeadScoringService } from "../lead-scoring.service";

// Integration tests require explicit opt-in via environment variable
const hasIntegrationEnv = Boolean(
  process.env.DATABASE_URL &&
    process.env.ENABLE_LEAD_SCORING_INTEGRATION_TESTS === "true"
);

const describeIntegration = hasIntegrationEnv ? describe : describe.skip;

// Real Prisma client - NO MOCKS
let prisma: PrismaClient;
let service: LeadScoringService;

// Test data IDs (cleanup in afterAll)
const testLeadIds: string[] = [];
let testEmployeeId: string;
let testSourceId: string;

describeIntegration("LeadScoringService Integration Tests", () => {
  beforeAll(async () => {
    if (!hasIntegrationEnv) return;

    prisma = new PrismaClient();
    service = new LeadScoringService();

    // Ensure required settings exist
    await ensureTestSettings();

    // Create test employee for assignment
    const employee = await prisma.adm_provider_employees.create({
      data: {
        email: `test-scoring-${Date.now()}@fleetcore.test`,
        first_name: "Test",
        last_name: "Employee",
        clerk_user_id: `test_clerk_${Date.now()}`,
        status: "active",
      },
    });
    testEmployeeId = employee.id;

    // Create test lead source
    const source = await prisma.crm_lead_sources.upsert({
      where: { name: "Integration Test" },
      update: {},
      create: {
        name: "Integration Test",
        is_active: true,
      },
    });
    testSourceId = source.id;
  });

  afterAll(async () => {
    if (!hasIntegrationEnv || !prisma) return;

    // Cleanup test leads (hard delete for test isolation)
    for (const leadId of testLeadIds) {
      try {
        await prisma.crm_lead_activities.deleteMany({
          where: { lead_id: leadId },
        });
        await prisma.crm_leads.delete({ where: { id: leadId } });
      } catch {
        // Ignore if already deleted
      }
    }

    // Cleanup test employee
    if (testEmployeeId) {
      try {
        await prisma.adm_provider_employees.delete({
          where: { id: testEmployeeId },
        });
      } catch {
        // Ignore
      }
    }

    // Restore score_decay to enabled state
    await prisma.crm_settings.update({
      where: { setting_key: "score_decay" },
      data: {
        setting_value: {
          enabled: true,
          inactivity_threshold_days: 30,
          decay_type: "percentage",
          decay_value: 20,
          minimum_score: 5,
        },
      },
    });

    await prisma.$disconnect();
  });

  // ===== HELPER: Create test lead with specific attributes =====
  interface TestLeadOverrides {
    fleet_size?: string;
    country_code?: string;
    message?: string;
    phone?: string;
    metadata?: Prisma.InputJsonValue;
    fit_score?: Prisma.Decimal;
    engagement_score?: Prisma.Decimal;
    qualification_score?: number;
    lead_stage?: "top_of_funnel" | "marketing_qualified" | "sales_qualified";
    last_activity_at?: Date;
  }

  async function createTestLead(overrides: TestLeadOverrides = {}) {
    const data: Prisma.crm_leadsUncheckedCreateInput = {
      email: `test-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`,
      first_name: "Test",
      last_name: "Lead",
      status: "new",
      lead_stage: "top_of_funnel",
      source_id: testSourceId,
      country_code: "FR", // Default to FR which exists
      ...overrides,
    };

    const lead = await prisma.crm_leads.create({ data });
    testLeadIds.push(lead.id);
    return lead;
  }

  // ===== HELPER: Ensure CRM settings exist (Supabase schema) =====
  async function ensureTestSettings() {
    const scoringConfig = await prisma.crm_settings.findUnique({
      where: { setting_key: "lead_scoring_config" },
    });
    if (!scoringConfig) {
      throw new Error(
        "Missing lead_scoring_config in crm_settings - run seed first"
      );
    }

    const decayConfig = await prisma.crm_settings.findUnique({
      where: { setting_key: "score_decay" },
    });
    if (!decayConfig) {
      throw new Error(
        "Missing score_decay in crm_settings - run migration SQL first"
      );
    }

    const fleetSizeConfig = await prisma.crm_settings.findUnique({
      where: { setting_key: "fleet_size_options" },
    });
    if (!fleetSizeConfig) {
      throw new Error(
        "Missing fleet_size_options in crm_settings - run seed first"
      );
    }
  }

  // ===== TEST SUITE 1: calculateLeadScores - Real Calculations =====
  describe("calculateLeadScores - Real Database", () => {
    it("should calculate SQL score for premium UAE lead with 500+ fleet", async () => {
      // Message must be 200+ chars for 30 points
      const longMessage =
        "We need comprehensive fleet management for our 600 vehicle operation across UAE. Looking for driver tracking, maintenance scheduling, and fuel management. This is a critical business need for our growing fleet operations.";

      const result = await service.calculateLeadScores({
        fleet_size: "500+",
        country_code: "AE",
        message: longMessage, // 225 chars = 30 points
        phone: "+971501234567",
        metadata: {
          page_views: 20,
          time_on_site: 900,
        },
      });

      // Fit: 40 (500+) + 20 (AE tier1) = 60
      expect(result.fit_score).toBe(60);
      // Engagement: 30 (message 200+) + 20 (phone) + 30 (pages 15+) + 20 (time 600+) = 100
      expect(result.engagement_score).toBe(100);
      // Qualification: (60*0.6) + (100*0.4) = 36 + 40 = 76
      expect(result.qualification_score).toBe(76);
      expect(result.lead_stage).toBe("sales_qualified");
    });

    it("should calculate MQL score for France lead with 101-500 fleet", async () => {
      // Message 100-199 chars for 20 points
      const mediumMessage =
        "Interested in your solution for our French fleet operations. We manage transportation across multiple regions.";

      const result = await service.calculateLeadScores({
        fleet_size: "101-500",
        country_code: "FR",
        message: mediumMessage, // ~110 chars = 20 points
        phone: "+33612345678",
        metadata: {
          page_views: 12, // 15 points (10-14 range)
          time_on_site: 400, // 15 points (300-599 range)
        },
      });

      // Fit: 35 (101-500) + 18 (FR tier2) = 53
      expect(result.fit_score).toBe(53);
      // Engagement: 20 (message 100-199) + 20 (phone) + 15 (pages 10-14) + 15 (time 300-599) = 70
      expect(result.engagement_score).toBe(70);
      // Qualification: (53*0.6) + (70*0.4) = 31.8 + 28 = 59.8 → 60
      expect(result.qualification_score).toBe(60);
      expect(result.lead_stage).toBe("marketing_qualified");
    });

    it("should calculate TOF score for minimal US lead", async () => {
      const result = await service.calculateLeadScores({
        fleet_size: "1-10",
        country_code: "US",
        message: "Hello",
        phone: null,
        metadata: {
          page_views: 1,
          time_on_site: 30,
        },
      });

      // Fit: 5 (1-10) + 5 (US tier5) = 10
      expect(result.fit_score).toBe(10);
      // Engagement: 10 (message <50) + 0 (no phone) + 0 (pages <5) + 0 (time <120) = 10
      expect(result.engagement_score).toBe(10);
      // Qualification: (10*0.6) + (10*0.4) = 6 + 4 = 10
      expect(result.qualification_score).toBe(10);
      expect(result.lead_stage).toBe("top_of_funnel");
    });
  });

  // ===== TEST SUITE 2: recalculateScores - Real DB Operations =====
  describe("recalculateScores - Real Database Operations", () => {
    it("should recalculate and persist scores in database", async () => {
      // Message 200+ chars for max engagement
      const longMessage =
        "Major fleet operation requiring comprehensive management solution with driver tracking, maintenance, fuel management, and real-time reporting. Urgent requirement for 600+ vehicles across UAE and Qatar regions.";

      // Create lead with initial low scores
      const lead = await createTestLead({
        fleet_size: "500+",
        country_code: "AE",
        message: longMessage,
        phone: "+971501234567",
        metadata: {
          page_views: 25,
          time_on_site: 1200,
        },
        fit_score: new Prisma.Decimal(10), // Initial low score
        engagement_score: new Prisma.Decimal(10),
        qualification_score: 10,
        lead_stage: "top_of_funnel",
      });

      // Recalculate scores
      const result = await service.recalculateScores(lead.id);

      // Verify result
      expect(result.leadId).toBe(lead.id);
      expect(result.previousScores.fit).toBe(10);
      expect(result.previousScores.engagement).toBe(10);
      expect(result.previousScores.qualification).toBe(10);
      expect(result.previousStage).toBe("top_of_funnel");

      // New scores should be calculated properly
      expect(result.newScores.fit).toBe(60); // 40 (500+) + 20 (AE)
      expect(result.newScores.engagement).toBe(100); // Max engagement
      expect(result.newScores.qualification).toBe(76);
      expect(result.newStage).toBe("sales_qualified");
      expect(result.stageChanged).toBe(true);

      // Verify database was actually updated
      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });

      expect(updatedLead).toBeDefined();
      if (!updatedLead) throw new Error("Lead not found");
      expect(Number(updatedLead.fit_score)).toBe(60);
      expect(Number(updatedLead.engagement_score)).toBe(100);
      expect(updatedLead.qualification_score).toBe(76);
      expect(updatedLead.lead_stage).toBe("sales_qualified");
      expect(updatedLead.scoring).not.toBeNull(); // Breakdown saved
    });

    it("should throw error for non-existent lead", async () => {
      const fakeUUID = "00000000-0000-0000-0000-000000000000";

      await expect(service.recalculateScores(fakeUUID)).rejects.toThrow(
        `Lead not found: ${fakeUUID}`
      );
    });
  });

  // ===== TEST SUITE 3: degradeInactiveScores - Real Batch Operations =====
  describe("degradeInactiveScores - Real Batch Operations", () => {
    beforeEach(async () => {
      // Ensure score_decay is enabled for these tests
      await prisma.crm_settings.update({
        where: { setting_key: "score_decay" },
        data: {
          setting_value: {
            enabled: true,
            inactivity_threshold_days: 30,
            decay_type: "percentage",
            decay_value: 20,
            minimum_score: 5,
          },
        },
      });
    });

    it("should degrade scores for leads inactive > 30 days", async () => {
      const fortyDaysAgo = new Date();
      fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);

      // Create inactive lead with high engagement
      const lead = await createTestLead({
        fleet_size: "101-500",
        country_code: "FR",
        engagement_score: new Prisma.Decimal(80),
        fit_score: new Prisma.Decimal(50),
        qualification_score: 62, // (50*0.6) + (80*0.4) = 30 + 32 = 62
        lead_stage: "marketing_qualified",
        last_activity_at: fortyDaysAgo,
      });

      // Run degradation
      const result = await service.degradeInactiveScores();

      // Should have processed our lead
      expect(result.processed).toBeGreaterThanOrEqual(1);
      expect(result.degraded).toBeGreaterThanOrEqual(1);

      // Verify lead was degraded
      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });
      if (!updatedLead) throw new Error("Lead not found");

      // Engagement: 80 - 20% = 64
      expect(Number(updatedLead.engagement_score)).toBe(64);
      // Qualification recalculated: (50*0.6) + (64*0.4) = 30 + 25.6 = 55.6 → 56
      expect(updatedLead.qualification_score).toBe(56);
    });

    it("should respect minimum_score from config (not go below 5)", async () => {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      // Create lead with very low engagement (near minimum)
      const lead = await createTestLead({
        fleet_size: "1-10",
        country_code: "US",
        engagement_score: new Prisma.Decimal(6), // 6 - 20% = 4.8 → should floor to 5
        fit_score: new Prisma.Decimal(10),
        qualification_score: 8,
        lead_stage: "top_of_funnel",
        last_activity_at: sixtyDaysAgo,
      });

      // Run degradation
      await service.degradeInactiveScores();

      // Verify minimum score respected
      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });
      if (!updatedLead) throw new Error("Lead not found");

      expect(Number(updatedLead.engagement_score)).toBe(5); // Minimum from config
    });

    it("should NOT degrade leads with recent activity", async () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

      // Create recently active lead
      const lead = await createTestLead({
        fleet_size: "500+",
        country_code: "AE",
        engagement_score: new Prisma.Decimal(90),
        fit_score: new Prisma.Decimal(60),
        qualification_score: 72,
        lead_stage: "sales_qualified",
        last_activity_at: fiveDaysAgo, // Only 5 days ago
      });

      // Run degradation
      await service.degradeInactiveScores();

      // Verify lead was NOT degraded
      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });
      if (!updatedLead) throw new Error("Lead not found");

      expect(Number(updatedLead.engagement_score)).toBe(90); // Unchanged
      expect(updatedLead.qualification_score).toBe(72); // Unchanged
    });

    it("should return empty result when decay is disabled", async () => {
      // Disable score_decay
      await prisma.crm_settings.update({
        where: { setting_key: "score_decay" },
        data: {
          setting_value: {
            enabled: false, // DISABLED
            inactivity_threshold_days: 30,
            decay_type: "percentage",
            decay_value: 20,
            minimum_score: 5,
          },
        },
      });

      const result = await service.degradeInactiveScores();

      expect(result.processed).toBe(0);
      expect(result.degraded).toBe(0);
      expect(result.stageChanges).toBe(0);
      expect(result.details).toHaveLength(0);
    });
  });

  // ===== TEST SUITE 4: Database Persistence Verification =====
  describe("Database Persistence", () => {
    it("should persist scoring breakdown as JSON in database", async () => {
      const lead = await createTestLead({
        fleet_size: "51-100",
        country_code: "KW",
        message: "Test message for scoring breakdown verification",
        phone: "+96512345678",
      });

      await service.recalculateScores(lead.id);

      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });
      if (!updatedLead) throw new Error("Lead not found");

      expect(updatedLead.scoring).not.toBeNull();
      const scoring = updatedLead.scoring as Record<string, unknown>;
      expect(scoring).toHaveProperty("fit");
      expect(scoring).toHaveProperty("engagement");
    });

    it("should update updated_at timestamp on recalculation", async () => {
      const lead = await createTestLead({
        fleet_size: "11-50",
        country_code: "FR",
      });

      const originalUpdatedAt = lead.updated_at;
      if (!originalUpdatedAt) throw new Error("Lead missing updated_at");

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 100));

      await service.recalculateScores(lead.id);

      const updatedLead = await prisma.crm_leads.findUnique({
        where: { id: lead.id },
      });
      if (!updatedLead?.updated_at)
        throw new Error("Lead not found or missing updated_at");

      expect(updatedLead.updated_at.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });
  });
});
