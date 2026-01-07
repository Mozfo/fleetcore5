import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  LeadQualificationService,
  type QualificationFramework,
} from "../lead-qualification.service";
import { prisma } from "@/lib/prisma";
import { leadStatusService } from "../lead-status.service";
import type { QualifyLeadInput } from "@/lib/validators/crm/lead-status.validators";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    crm_leads: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    crm_lead_activities: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(prisma)),
  },
}));

// Mock leadStatusService
vi.mock("../lead-status.service", () => ({
  leadStatusService: {
    updateStatus: vi.fn(),
  },
}));

describe("LeadQualificationService", () => {
  let service: LeadQualificationService;

  // Mock qualification framework from crm_settings
  const mockQualificationFramework: QualificationFramework = {
    version: "6.2",
    framework: "CPT",
    questions: [
      { id: "challenges", label_en: "Challenges", label_fr: "Défis" },
      { id: "priority", label_en: "Priority", label_fr: "Priorité" },
      { id: "timing", label_en: "Timing", label_fr: "Timing" },
    ],
    disqualification_triggers: [],
    score_weights: {
      challenges: { high: 40, medium: 25, low: 10 },
      priority: { high: 30, medium: 20, low: 10 },
      timing: { hot: 30, warm: 20, cool: 10, cold: 0 },
    },
    thresholds: {
      proceed: 70,
      nurture: 40,
    },
  };

  const mockLead = {
    id: "lead-uuid-123",
    status: "new",
    email: "test@example.com",
  };

  beforeEach(() => {
    service = new LeadQualificationService();
    service.clearCache();

    // Mock settingsRepo.getSettingValue
    vi.spyOn(service["settingsRepo"], "getSettingValue").mockImplementation(
      (key: string) => {
        if (key === "qualification_framework") {
          return Promise.resolve(mockQualificationFramework);
        }
        return Promise.resolve(null);
      }
    );

    // Default mock for prisma.crm_leads.findUnique
    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_lead_activities.create).mockResolvedValue({
      id: "activity-1",
    } as never);

    // Mock leadStatusService
    vi.mocked(leadStatusService.updateStatus).mockResolvedValue({
      success: true,
      leadId: mockLead.id,
      previousStatus: "new",
      newStatus: "qualified",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== SUITE 1: Framework Loading (3 tests) =====

  describe("Framework Loading", () => {
    it("should load qualification_framework from crm_settings", async () => {
      const framework = await service.getFramework();

      expect(framework).toBeDefined();
      expect(framework.version).toBe("6.2");
      expect(framework.framework).toBe("CPT");
      expect(framework.score_weights).toBeDefined();
      expect(framework.thresholds).toBeDefined();
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledWith(
        "qualification_framework"
      );
    });

    it("should throw if qualification_framework not found", async () => {
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue(
        null
      );
      service.clearCache();

      await expect(service.getFramework()).rejects.toThrow(
        "qualification_framework not found in crm_settings"
      );
    });

    it("should cache framework after first load", async () => {
      // First call
      await service.getFramework();
      // Second call
      await service.getFramework();

      // Should only call settings repo once
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledTimes(1);
    });

    it("should throw if framework missing score_weights", async () => {
      const incompleteFramework = {
        ...mockQualificationFramework,
        score_weights: undefined,
      };
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue(
        incompleteFramework
      );
      service.clearCache();

      await expect(service.getFramework()).rejects.toThrow(
        "qualification_framework is missing score_weights or thresholds"
      );
    });
  });

  // ===== SUITE 2: Score Calculation (4 tests) =====

  describe("Score Calculation", () => {
    it("should calculate max score (100) for high/high/hot", async () => {
      const cpt: QualifyLeadInput = {
        challenges: { response: "Major pain points", score: "high" },
        priority: { response: "Budget approved", score: "high" },
        timing: { response: "ASAP", score: "hot" },
      };

      const result = await service.calculateScore(cpt);

      // high challenges (40) + high priority (30) + hot timing (30) = 100
      expect(result.total).toBe(100);
      expect(result.challengesPoints).toBe(40);
      expect(result.priorityPoints).toBe(30);
      expect(result.timingPoints).toBe(30);
    });

    it("should calculate min score for low/low/cold", async () => {
      const cpt: QualifyLeadInput = {
        challenges: { response: "No issues", score: "low" },
        priority: { response: "No budget", score: "low" },
        timing: { response: "Maybe next year", score: "cold" },
      };

      const result = await service.calculateScore(cpt);

      // low challenges (10) + low priority (10) + cold timing (0) = 20
      expect(result.total).toBe(20);
      expect(result.challengesPoints).toBe(10);
      expect(result.priorityPoints).toBe(10);
      expect(result.timingPoints).toBe(0);
    });

    it("should use score_weights from settings", async () => {
      // Modify settings to verify they are used
      const customFramework = {
        ...mockQualificationFramework,
        score_weights: {
          challenges: { high: 50, medium: 30, low: 15 },
          priority: { high: 35, medium: 25, low: 15 },
          timing: { hot: 35, warm: 25, cool: 15, cold: 5 },
        },
      };
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue(
        customFramework
      );
      service.clearCache();

      const cpt: QualifyLeadInput = {
        challenges: { response: "Test", score: "high" },
        priority: { response: "Test", score: "high" },
        timing: { response: "Test", score: "hot" },
      };

      const result = await service.calculateScore(cpt);

      // Custom weights: 50 + 35 + 35 = 120
      expect(result.total).toBe(120);
    });

    it("should return individual points per criterion", async () => {
      const cpt: QualifyLeadInput = {
        challenges: { response: "Medium pain", score: "medium" },
        priority: { response: "Some budget", score: "medium" },
        timing: { response: "Q2", score: "warm" },
      };

      const result = await service.calculateScore(cpt);

      expect(result.challengesPoints).toBe(25);
      expect(result.priorityPoints).toBe(20);
      expect(result.timingPoints).toBe(20);
      expect(result.total).toBe(65);
    });
  });

  // ===== SUITE 3: Recommendation Logic (3 tests) =====

  describe("Recommendation Logic", () => {
    it("should return 'proceed' when score >= thresholds.proceed (70)", async () => {
      const recommendation = await service.getRecommendation(70);
      expect(recommendation).toBe("proceed");

      const higherRecommendation = await service.getRecommendation(85);
      expect(higherRecommendation).toBe("proceed");

      const exactRecommendation = await service.getRecommendation(100);
      expect(exactRecommendation).toBe("proceed");
    });

    it("should return 'nurture' when score >= thresholds.nurture (40) and < proceed", async () => {
      const recommendation = await service.getRecommendation(40);
      expect(recommendation).toBe("nurture");

      const midRecommendation = await service.getRecommendation(55);
      expect(midRecommendation).toBe("nurture");

      const highNurture = await service.getRecommendation(69);
      expect(highNurture).toBe("nurture");
    });

    it("should return 'disqualify' when score < thresholds.nurture", async () => {
      const recommendation = await service.getRecommendation(39);
      expect(recommendation).toBe("disqualify");

      const lowRecommendation = await service.getRecommendation(20);
      expect(lowRecommendation).toBe("disqualify");

      const zeroRecommendation = await service.getRecommendation(0);
      expect(zeroRecommendation).toBe("disqualify");
    });
  });

  // ===== SUITE 4: Qualification Flow (6 tests) =====

  describe("Qualification Flow", () => {
    const validCpt: QualifyLeadInput = {
      challenges: { response: "Excel nightmare, 3h/week", score: "high" },
      priority: { response: "Budget approved Q1", score: "high" },
      timing: { response: "Want to start ASAP", score: "hot" },
    };

    it("should qualify lead and store qualification_notes JSON", async () => {
      const result = await service.qualifyLead(mockLead.id, validCpt, "user-1");

      expect(result.success).toBe(true);
      expect(result.leadId).toBe(mockLead.id);
      expect(result.qualification_score).toBe(100);
      expect(result.recommendation).toBe("proceed");
      expect(result.qualified_date).toBeDefined();

      // Verify update was called with qualification_notes as JSON string
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLead.id },
          data: expect.objectContaining({
            qualification_score: 100,
            qualification_notes: expect.stringContaining('"framework":"CPT"'),
          }),
        })
      );
    });

    it("should auto-update status to 'qualified' when recommendation=proceed", async () => {
      const result = await service.qualifyLead(mockLead.id, validCpt, "user-1");

      expect(result.status_updated).toBe(true);
      expect(leadStatusService.updateStatus).toHaveBeenCalledWith(
        mockLead.id,
        "qualified",
        { performedBy: "user-1" }
      );
    });

    it("should NOT auto-update status when recommendation=nurture", async () => {
      const nurtureCpt: QualifyLeadInput = {
        challenges: { response: "Some issues", score: "medium" },
        priority: { response: "Maybe budget", score: "medium" },
        timing: { response: "Q3", score: "warm" },
      };

      // Score = 25 + 20 + 20 = 65 (nurture range)
      const result = await service.qualifyLead(
        mockLead.id,
        nurtureCpt,
        "user-1"
      );

      expect(result.recommendation).toBe("nurture");
      expect(result.status_updated).toBe(false);
      expect(result.suggested_action).toBe(
        "Consider moving this lead to nurturing"
      );
      expect(leadStatusService.updateStatus).not.toHaveBeenCalled();
    });

    it("should NOT auto-update status when recommendation=disqualify", async () => {
      const disqualifyCpt: QualifyLeadInput = {
        challenges: { response: "No problems", score: "low" },
        priority: { response: "No budget", score: "low" },
        timing: { response: "Not interested", score: "cold" },
      };

      // Score = 10 + 10 + 0 = 20 (disqualify range)
      const result = await service.qualifyLead(
        mockLead.id,
        disqualifyCpt,
        "user-1"
      );

      expect(result.recommendation).toBe("disqualify");
      expect(result.status_updated).toBe(false);
      expect(result.suggested_action).toBe("Consider disqualifying this lead");
      expect(leadStatusService.updateStatus).not.toHaveBeenCalled();
    });

    it("should throw for already converted lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "converted",
      } as never);

      await expect(
        service.qualifyLead(mockLead.id, validCpt, "user-1")
      ).rejects.toThrow("Cannot qualify lead with status: converted");
    });

    it("should throw for already disqualified lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "disqualified",
      } as never);

      await expect(
        service.qualifyLead(mockLead.id, validCpt, "user-1")
      ).rejects.toThrow("Cannot qualify lead with status: disqualified");
    });

    it("should create crm_lead_activities entry", async () => {
      await service.qualifyLead(mockLead.id, validCpt, "user-1");

      expect(prisma.crm_lead_activities.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lead_id: mockLead.id,
            activity_type: "lead_qualified",
            title: expect.stringContaining("Lead qualified with CPT score"),
            performed_by: "user-1",
          }),
        })
      );
    });

    it("should throw if lead not found", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      await expect(
        service.qualifyLead("non-existent-id", validCpt, "user-1")
      ).rejects.toThrow("Lead not found: non-existent-id");
    });
  });

  // ===== SUITE 5: Score Weights & Thresholds (2 tests) =====

  describe("Score Weights & Thresholds", () => {
    it("should get score weights from framework", async () => {
      const weights = await service.getScoreWeights();

      expect(weights.challenges).toEqual({ high: 40, medium: 25, low: 10 });
      expect(weights.priority).toEqual({ high: 30, medium: 20, low: 10 });
      expect(weights.timing).toEqual({ hot: 30, warm: 20, cool: 10, cold: 0 });
    });

    it("should get thresholds from framework", async () => {
      const thresholds = await service.getThresholds();

      expect(thresholds.proceed).toBe(70);
      expect(thresholds.nurture).toBe(40);
    });
  });

  // ===== SUITE 6: Edge Cases (3 tests) =====

  describe("Edge Cases", () => {
    it("should handle status update failure gracefully", async () => {
      vi.mocked(leadStatusService.updateStatus).mockResolvedValue({
        success: false,
        leadId: mockLead.id,
        previousStatus: "new",
        newStatus: "qualified",
        error: "Invalid transition",
      });

      const cpt: QualifyLeadInput = {
        challenges: { response: "Test", score: "high" },
        priority: { response: "Test", score: "high" },
        timing: { response: "Test", score: "hot" },
      };

      const result = await service.qualifyLead(mockLead.id, cpt, "user-1");

      // Should still succeed but status_updated should be false
      expect(result.success).toBe(true);
      expect(result.status_updated).toBe(false);
    });

    it("should clear cache when clearCache() is called", async () => {
      // First load to populate cache
      await service.getFramework();
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Second load should call settings repo again
      await service.getFramework();
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledTimes(2);
    });

    it("should handle lead with null status", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: null,
      } as never);

      const cpt: QualifyLeadInput = {
        challenges: { response: "Test", score: "high" },
        priority: { response: "Test", score: "high" },
        timing: { response: "Test", score: "hot" },
      };

      // Should not throw - null status is valid for qualification
      const result = await service.qualifyLead(mockLead.id, cpt, "user-1");
      expect(result.success).toBe(true);
    });
  });
});
