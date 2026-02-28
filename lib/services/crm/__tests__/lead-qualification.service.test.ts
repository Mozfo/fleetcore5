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
    adm_members: {
      findFirst: vi.fn(),
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

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ===== BANT FRAMEWORK CONFIG =====

const BANT_FRAMEWORK: QualificationFramework = {
  version: "7.0.0",
  framework: "BANT",
  criteria: {
    budget: {
      allowed_values: ["confirmed", "planned", "no_budget", "unknown"],
      qualifying_values: ["confirmed", "planned"],
    },
    authority: {
      allowed_values: ["decision_maker", "influencer", "user", "unknown"],
      qualifying_values: ["decision_maker", "influencer"],
    },
    need: {
      allowed_values: ["critical", "important", "nice_to_have", "none"],
      qualifying_values: ["critical", "important"],
    },
    timeline: {
      allowed_values: ["immediate", "this_quarter", "this_year", "no_timeline"],
      qualifying_values: ["immediate", "this_quarter"],
    },
  },
  fleet_size_exception_threshold: 50,
};

// ===== MOCK LEAD =====

const MOCK_LEAD = {
  id: "lead-uuid-123",
  status: "callback_requested",
  email: "test@example.com",
  tenant_id: "tenant-uuid-123",
  fleet_size: "20",
};

const MOCK_MEMBER = { id: "member-uuid-123" };

// ===== HELPERS =====

function bantInput(
  overrides: Partial<QualifyLeadInput> = {}
): QualifyLeadInput {
  return {
    bant_budget: "confirmed",
    bant_authority: "decision_maker",
    bant_need: "critical",
    bant_timeline: "immediate",
    ...overrides,
  };
}

// ===== TESTS =====

describe("LeadQualificationService (BANT V7)", () => {
  let service: LeadQualificationService;

  beforeEach(() => {
    service = new LeadQualificationService();
    vi.clearAllMocks();

    // Default mock: settings repo returns BANT framework
    vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue(
      BANT_FRAMEWORK
    );

    // Default mock: lead exists
    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(
      MOCK_LEAD as never
    );

    // Default mock: member found
    vi.mocked(prisma.adm_members.findFirst).mockResolvedValue(
      MOCK_MEMBER as never
    );

    // Default mock: status update succeeds
    vi.mocked(leadStatusService.updateStatus).mockResolvedValue({
      success: true,
      leadId: MOCK_LEAD.id,
      previousStatus: "callback_requested",
      newStatus: "qualified",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== SUITE 1: BANT Evaluation =====

  describe("evaluateBant", () => {
    it("should return 4/4 when all criteria are qualifying", async () => {
      const result = await service.evaluateBant(bantInput());
      expect(result.criteria_met).toBe(4);
      expect(result.details.budget.qualifying).toBe(true);
      expect(result.details.authority.qualifying).toBe(true);
      expect(result.details.need.qualifying).toBe(true);
      expect(result.details.timeline.qualifying).toBe(true);
    });

    it("should return 3/4 when one criterion is not qualifying", async () => {
      const result = await service.evaluateBant(
        bantInput({ bant_budget: "no_budget" })
      );
      expect(result.criteria_met).toBe(3);
      expect(result.details.budget.qualifying).toBe(false);
    });

    it("should return 2/4 when two criteria are not qualifying", async () => {
      const result = await service.evaluateBant(
        bantInput({ bant_budget: "unknown", bant_timeline: "no_timeline" })
      );
      expect(result.criteria_met).toBe(2);
    });

    it("should return 0/4 when no criteria qualify", async () => {
      const result = await service.evaluateBant({
        bant_budget: "unknown",
        bant_authority: "unknown",
        bant_need: "none",
        bant_timeline: "no_timeline",
      });
      expect(result.criteria_met).toBe(0);
    });

    it("should accept planned budget as qualifying", async () => {
      const result = await service.evaluateBant(
        bantInput({ bant_budget: "planned" })
      );
      expect(result.details.budget.qualifying).toBe(true);
      expect(result.criteria_met).toBe(4);
    });

    it("should accept influencer as qualifying for authority", async () => {
      const result = await service.evaluateBant(
        bantInput({ bant_authority: "influencer" })
      );
      expect(result.details.authority.qualifying).toBe(true);
    });
  });

  // ===== SUITE 2: Result Determination =====

  describe("determineResult", () => {
    it("should return qualified for 4/4 criteria", async () => {
      const { result } = await service.determineResult(4, "20");
      expect(result).toBe("qualified");
    });

    it("should return nurturing for 3/4 criteria", async () => {
      const { result } = await service.determineResult(3, "20");
      expect(result).toBe("nurturing");
    });

    it("should return disqualified for <=2/4 criteria with small fleet", async () => {
      const { result } = await service.determineResult(2, "20");
      expect(result).toBe("disqualified");
    });

    it("should return nurturing for <=2/4 criteria with fleet > 50 (exception)", async () => {
      const { result, fleetSizeException } = await service.determineResult(
        2,
        "100"
      );
      expect(result).toBe("nurturing");
      expect(fleetSizeException).toBe(true);
    });

    it("should return nurturing for 0/4 criteria with fleet > 50", async () => {
      const { result, fleetSizeException } = await service.determineResult(
        0,
        "500+"
      );
      expect(result).toBe("nurturing");
      expect(fleetSizeException).toBe(true);
    });

    it("should handle null fleet_size as 0", async () => {
      const { result } = await service.determineResult(1, null);
      expect(result).toBe("disqualified");
    });

    it("should handle fleet_size with + suffix", async () => {
      const { result, fleetSizeException } = await service.determineResult(
        2,
        "51+"
      );
      expect(result).toBe("nurturing");
      expect(fleetSizeException).toBe(true);
    });
  });

  // ===== SUITE 3: Full Qualification Flow =====

  describe("qualifyLead", () => {
    it("should qualify lead with 4/4 and update status", async () => {
      const result = await service.qualifyLead(
        MOCK_LEAD.id,
        bantInput(),
        "user-uuid-123"
      );

      expect(result.success).toBe(true);
      expect(result.result).toBe("qualified");
      expect(result.criteria_met).toBe(4);
      expect(result.status_updated).toBe(true);
      expect(result.qualified_date).not.toBeNull();
      expect(result.fleet_size_exception).toBe(false);
    });

    it("should return nurturing for 3/4 without auto-status update", async () => {
      const result = await service.qualifyLead(
        MOCK_LEAD.id,
        bantInput({ bant_budget: "no_budget" }),
        "user-uuid-123"
      );

      expect(result.result).toBe("nurturing");
      expect(result.criteria_met).toBe(3);
      expect(result.status_updated).toBe(false);
      expect(result.qualified_date).toBeNull();
      // Should NOT call updateStatus for nurturing
      expect(leadStatusService.updateStatus).not.toHaveBeenCalled();
    });

    it("should return disqualified for 2/4 with small fleet", async () => {
      const result = await service.qualifyLead(
        MOCK_LEAD.id,
        bantInput({ bant_budget: "unknown", bant_timeline: "no_timeline" }),
        "user-uuid-123"
      );

      expect(result.result).toBe("disqualified");
      expect(result.criteria_met).toBe(2);
      expect(result.fleet_size_exception).toBe(false);
    });

    it("should apply fleet_size exception for <=2/4 with large fleet", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...MOCK_LEAD,
        fleet_size: "100",
      } as never);

      const result = await service.qualifyLead(
        MOCK_LEAD.id,
        bantInput({ bant_budget: "unknown", bant_timeline: "no_timeline" }),
        "user-uuid-123"
      );

      expect(result.result).toBe("nurturing");
      expect(result.fleet_size_exception).toBe(true);
    });

    it("should throw for converted lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...MOCK_LEAD,
        status: "converted",
      } as never);

      await expect(
        service.qualifyLead(MOCK_LEAD.id, bantInput(), "user-uuid-123")
      ).rejects.toThrow("Cannot qualify lead with status: converted");
    });

    it("should throw for disqualified lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...MOCK_LEAD,
        status: "disqualified",
      } as never);

      await expect(
        service.qualifyLead(MOCK_LEAD.id, bantInput(), "user-uuid-123")
      ).rejects.toThrow("Cannot qualify lead with status: disqualified");
    });

    it("should throw for non-existent lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      await expect(
        service.qualifyLead("nonexistent", bantInput(), "user-uuid-123")
      ).rejects.toThrow("Lead not found: nonexistent");
    });

    it("should write BANT values to crm_leads", async () => {
      await service.qualifyLead(MOCK_LEAD.id, bantInput(), "user-uuid-123");

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bant_budget: "confirmed",
            bant_authority: "decision_maker",
            bant_need: "critical",
            bant_timeline: "immediate",
            bant_qualified_by: MOCK_MEMBER.id,
          }),
        })
      );
    });

    it("should create activity log", async () => {
      await service.qualifyLead(MOCK_LEAD.id, bantInput(), "user-uuid-123");

      expect(prisma.crm_lead_activities.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activity_type: "lead_qualified",
            lead_id: MOCK_LEAD.id,
            tenant_id: MOCK_LEAD.tenant_id,
          }),
        })
      );
    });
  });

  // ===== SUITE 4: Framework Loading =====

  describe("getFramework", () => {
    it("should load framework from crm_settings", async () => {
      const framework = await service.getFramework();
      expect(framework.framework).toBe("BANT");
      expect(framework.criteria.budget.qualifying_values).toContain(
        "confirmed"
      );
    });

    it("should cache framework after first load", async () => {
      await service.getFramework();
      await service.getFramework();

      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledTimes(1);
    });

    it("should throw if framework not found", async () => {
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue(
        null
      );

      await expect(service.getFramework()).rejects.toThrow(
        "qualification_framework not found in crm_settings"
      );
    });

    it("should throw if criteria missing", async () => {
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockResolvedValue({
        version: "7.0.0",
        framework: "BANT",
      });

      await expect(service.getFramework()).rejects.toThrow("missing criteria");
    });

    it("should clear cache on clearCache()", async () => {
      await service.getFramework();
      service.clearCache();
      await service.getFramework();

      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledTimes(2);
    });
  });
});
