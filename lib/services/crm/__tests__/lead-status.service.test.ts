import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  LeadStatusService,
  type StatusWorkflow,
  type LossReasonsConfig,
} from "../lead-status.service";
import { prisma } from "@/lib/prisma";

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

describe("LeadStatusService", () => {
  let service: LeadStatusService;

  // Mock status workflow from crm_settings (V6.3 - 8 statuts)
  const mockStatusWorkflow: StatusWorkflow = {
    version: "6.3",
    statuses: [
      {
        value: "new",
        label_fr: "Nouveau",
        label_en: "New",
        phase: "incomplete",
        probability: 10,
        color: "gray",
        icon: "sparkles",
        description: "Newly created lead",
        allowed_transitions: ["demo", "nurturing", "disqualified"],
        auto_assign: true,
        sla_hours: 4,
      },
      {
        value: "demo",
        label_fr: "Démo",
        label_en: "Demo",
        phase: "demo",
        probability: 40,
        color: "blue",
        icon: "calendar",
        description: "Demo scheduled or in progress",
        allowed_transitions: [
          "proposal_sent",
          "nurturing",
          "lost",
          "disqualified",
        ],
        auto_assign: false,
        sla_hours: 24,
      },
      {
        value: "proposal_sent",
        label_fr: "Proposition envoyée",
        label_en: "Proposal Sent",
        phase: "proposal",
        probability: 60,
        color: "orange",
        icon: "document-text",
        description: "Proposal has been sent",
        allowed_transitions: ["payment_pending", "lost", "nurturing"],
        auto_assign: false,
        sla_hours: null,
      },
      {
        value: "payment_pending",
        label_fr: "Paiement en attente",
        label_en: "Payment Pending",
        phase: "proposal",
        probability: 80,
        color: "amber",
        icon: "credit-card",
        description: "Waiting for payment",
        allowed_transitions: ["converted", "lost"],
        auto_assign: false,
        sla_hours: null,
      },
      {
        value: "converted",
        label_fr: "Converti",
        label_en: "Converted",
        phase: "completed",
        probability: 100,
        color: "green",
        icon: "badge-check",
        description: "Lead converted to customer",
        allowed_transitions: [],
        auto_assign: false,
        sla_hours: null,
        is_terminal: true,
        is_won: true,
      },
      {
        value: "lost",
        label_fr: "Perdu",
        label_en: "Lost",
        phase: "completed",
        probability: 0,
        color: "red",
        icon: "x-circle",
        description: "Lead lost",
        allowed_transitions: ["nurturing"],
        auto_assign: false,
        sla_hours: null,
        requires_reason: true,
      },
      {
        value: "nurturing",
        label_fr: "En nurturing",
        label_en: "Nurturing",
        phase: "completed",
        probability: 15,
        color: "purple",
        icon: "clock",
        description: "Lead in nurturing program",
        allowed_transitions: ["demo", "proposal_sent", "lost"],
        auto_assign: false,
        sla_hours: null,
      },
      {
        value: "disqualified",
        label_fr: "Disqualifié",
        label_en: "Disqualified",
        phase: "completed",
        probability: 0,
        color: "gray",
        icon: "ban",
        description: "Lead disqualified",
        allowed_transitions: [],
        auto_assign: false,
        sla_hours: null,
        is_terminal: true,
        requires_reason: true,
      },
    ],
    phases: [
      {
        value: "incomplete",
        label_fr: "Incomplet",
        label_en: "Incomplete",
        order: 1,
      },
      {
        value: "demo",
        label_fr: "Démo",
        label_en: "Demo",
        order: 2,
      },
      {
        value: "proposal",
        label_fr: "Proposition",
        label_en: "Proposal",
        order: 3,
      },
      {
        value: "completed",
        label_fr: "Terminé",
        label_en: "Completed",
        order: 4,
      },
    ],
  };

  // Mock loss reasons from crm_settings
  const mockLossReasons: LossReasonsConfig = {
    version: "6.2",
    reasons: [
      {
        code: "chose_competitor",
        label_en: "Chose Competitor",
        label_fr: "A choisi un concurrent",
        category: "lost",
        requires_detail: true,
        detail_field: "competitor_name",
      },
      {
        code: "no_budget",
        label_en: "No Budget",
        label_fr: "Pas de budget",
        category: "lost",
        requires_detail: false,
      },
      {
        code: "timing_not_right",
        label_en: "Timing Not Right",
        label_fr: "Mauvais timing",
        category: "lost",
        requires_detail: false,
      },
      {
        code: "wrong_contact",
        label_en: "Wrong Contact",
        label_fr: "Mauvais contact",
        category: "disqualified",
        requires_detail: false,
      },
      {
        code: "not_qualified",
        label_en: "Not Qualified",
        label_fr: "Non qualifié",
        category: "disqualified",
        requires_detail: true,
        detail_field: "disqualification_reason",
      },
      {
        code: "duplicate",
        label_en: "Duplicate Lead",
        label_fr: "Lead dupliqué",
        category: "disqualified",
        requires_detail: false,
      },
    ],
  };

  const mockLead = {
    id: "lead-uuid-123",
    status: "new",
    email: "test@example.com",
  };

  beforeEach(() => {
    service = new LeadStatusService();
    service.clearCache();

    // Mock settingsRepo.getSettingValue
    vi.spyOn(service["settingsRepo"], "getSettingValue").mockImplementation(
      (key: string) => {
        if (key === "lead_status_workflow") {
          return Promise.resolve(mockStatusWorkflow);
        }
        if (key === "lead_loss_reasons") {
          return Promise.resolve(mockLossReasons);
        }
        return Promise.resolve(null);
      }
    );

    // Default mock for prisma
    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_lead_activities.create).mockResolvedValue({
      id: "activity-1",
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== SUITE 1: Workflow Loading (3 tests) =====

  describe("Workflow Loading", () => {
    it("should load lead_status_workflow from crm_settings", async () => {
      const workflow = await service.getWorkflow();

      expect(workflow).toBeDefined();
      expect(workflow.version).toBe("6.3");
      expect(workflow.statuses).toHaveLength(8); // V6.3: 8 statuts
      expect(workflow.phases).toHaveLength(4); // V6.3: 4 phases
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledWith(
        "lead_status_workflow"
      );
    });

    it("should throw if lead_status_workflow not found", async () => {
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockImplementation(
        (key: string) => {
          if (key === "lead_status_workflow") {
            return Promise.resolve(null);
          }
          return Promise.resolve(mockLossReasons);
        }
      );
      service.clearCache();

      await expect(service.getWorkflow()).rejects.toThrow(
        "lead_status_workflow not found in crm_settings"
      );
    });

    it("should cache workflow after first load", async () => {
      // First call
      await service.getWorkflow();
      // Second call
      await service.getWorkflow();

      // getSettingValue should only be called once for workflow
      const calls = vi.mocked(service["settingsRepo"].getSettingValue).mock
        .calls;
      const workflowCalls = calls.filter(
        (call) => call[0] === "lead_status_workflow"
      );
      expect(workflowCalls).toHaveLength(1);
    });
  });

  // ===== SUITE 2: Transition Validation (5 tests) =====

  describe("Transition Validation", () => {
    it("should allow valid transition: new → demo", async () => {
      const isValid = await service.validateTransition("new", "demo"); // V6.3: demo instead of demo
      expect(isValid).toBe(true);
    });

    it("should reject invalid transition: new → converted", async () => {
      const isValid = await service.validateTransition("new", "converted");
      expect(isValid).toBe(false);
    });

    it("should handle terminal status with no transitions", async () => {
      // converted has no allowed transitions
      const isValid = await service.validateTransition(
        "converted",
        "demo" // V6.3: demo instead of demo
      );
      expect(isValid).toBe(false);

      // disqualified has no allowed transitions
      const isValidDisqualified = await service.validateTransition(
        "disqualified",
        "new"
      );
      expect(isValidDisqualified).toBe(false);
    });

    it("should return allowed_transitions for status", async () => {
      const transitions = await service.getAllowedTransitions("new");
      expect(transitions).toEqual(["demo", "nurturing", "disqualified"]); // V6.3

      const proposalTransitions =
        await service.getAllowedTransitions("proposal_sent");
      expect(proposalTransitions).toEqual([
        "payment_pending",
        "lost",
        "nurturing",
      ]); // V6.3
    });

    it("should validate against workflow from settings (not hardcoded)", async () => {
      // Modify workflow to have different transitions
      const customWorkflow = {
        ...mockStatusWorkflow,
        statuses: mockStatusWorkflow.statuses.map((s) =>
          s.value === "new"
            ? { ...s, allowed_transitions: ["proposal_sent", "lost"] } // V6.3: custom transitions
            : s
        ),
      };
      vi.spyOn(service["settingsRepo"], "getSettingValue").mockImplementation(
        (key: string) => {
          if (key === "lead_status_workflow") {
            return Promise.resolve(customWorkflow);
          }
          return Promise.resolve(mockLossReasons);
        }
      );
      service.clearCache();

      // Should now allow new → proposal_sent (custom transition)
      const isValid = await service.validateTransition("new", "proposal_sent");
      expect(isValid).toBe(true);

      // Should now reject new → demo (removed from custom)
      const isInvalid = await service.validateTransition("new", "demo");
      expect(isInvalid).toBe(false);
    });
  });

  // ===== SUITE 3: Loss Reason Validation (4 tests) =====

  describe("Loss Reason Validation", () => {
    it("should load lead_loss_reasons from crm_settings", async () => {
      const reasons = await service.getLossReasons();

      expect(reasons).toHaveLength(6);
      expect(reasons[0].code).toBe("chose_competitor");
      expect(service["settingsRepo"].getSettingValue).toHaveBeenCalledWith(
        "lead_loss_reasons"
      );
    });

    it("should validate reason code exists", async () => {
      const validResult = await service.validateLossReason(
        "chose_competitor",
        "lost"
      );
      expect(validResult.valid).toBe(true);

      const invalidResult = await service.validateLossReason(
        "invalid_code",
        "lost"
      );
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toContain("Invalid loss reason code");
    });

    it("should validate reason category matches target status", async () => {
      // chose_competitor is for "lost" category
      const lostValid = await service.validateLossReason(
        "chose_competitor",
        "lost"
      );
      expect(lostValid.valid).toBe(true);

      // Using lost reason for disqualified should fail
      const wrongCategory = await service.validateLossReason(
        "chose_competitor",
        "disqualified"
      );
      expect(wrongCategory.valid).toBe(false);
      expect(wrongCategory.error).toContain('is for "lost" status');

      // wrong_contact is for "disqualified" category
      const disqualifiedValid = await service.validateLossReason(
        "wrong_contact",
        "disqualified"
      );
      expect(disqualifiedValid.valid).toBe(true);
    });

    it("should require detail when reason.requires_detail=true", async () => {
      // chose_competitor requires detail
      const result = await service.validateLossReason(
        "chose_competitor",
        "lost"
      );
      expect(result.valid).toBe(true);
      expect(result.requiresDetail).toBe(true);

      // no_budget does not require detail
      const noBudgetResult = await service.validateLossReason(
        "no_budget",
        "lost"
      );
      expect(noBudgetResult.valid).toBe(true);
      expect(noBudgetResult.requiresDetail).toBe(false);
    });

    it("should get loss reasons by category", async () => {
      const lostReasons = await service.getLossReasonsByCategory("lost");
      expect(lostReasons).toHaveLength(3);
      expect(lostReasons.every((r) => r.category === "lost")).toBe(true);

      const disqualifiedReasons =
        await service.getLossReasonsByCategory("disqualified");
      expect(disqualifiedReasons).toHaveLength(3);
      expect(
        disqualifiedReasons.every((r) => r.category === "disqualified")
      ).toBe(true);
    });
  });

  // ===== SUITE 4: Status Update (6 tests) =====

  describe("Status Update", () => {
    it("should update status with valid transition", async () => {
      const result = await service.updateStatus(mockLead.id, "demo", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe(mockLead.id);
      expect(result.previousStatus).toBe("new");
      expect(result.newStatus).toBe("demo");

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLead.id },
          data: expect.objectContaining({
            status: "demo",
          }),
        })
      );
    });

    it("should reject update with invalid transition", async () => {
      const result = await service.updateStatus(mockLead.id, "converted", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Invalid transition from 'new' to 'converted'"
      );
      expect(prisma.crm_leads.update).not.toHaveBeenCalled();
    });

    it("should require loss_reason_code for 'lost' status", async () => {
      // Set lead to a state that can transition to lost
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "demo",
      } as never);

      const result = await service.updateStatus(mockLead.id, "lost", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "loss_reason_code is required when status is 'lost'"
      );
    });

    it("should require loss_reason_code for 'disqualified' status", async () => {
      const result = await service.updateStatus(mockLead.id, "disqualified", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "loss_reason_code is required when status is 'disqualified'"
      );
    });

    it("should set converted_at when status='converted'", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "payment_pending", // payment_pending → converted is valid
      } as never);

      await service.updateStatus(mockLead.id, "converted", {
        performedBy: "user-1",
      });

      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "converted",
            converted_at: expect.any(Date),
          }),
        })
      );
    });

    it("should create crm_lead_activities entry", async () => {
      await service.updateStatus(mockLead.id, "demo", {
        performedBy: "user-1",
      });

      expect(prisma.crm_lead_activities.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lead_id: mockLead.id,
            activity_type: "status_change",
            title: expect.stringContaining("Status changed from new to demo"),
            performed_by: "user-1",
          }),
        })
      );
    });
  });

  // ===== SUITE 5: Loss Reason Detail Required (3 tests) =====

  describe("Loss Reason Detail Required", () => {
    it("should require loss_reason_detail when reason has requires_detail=true", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "demo",
      } as never);

      const result = await service.updateStatus(mockLead.id, "lost", {
        performedBy: "user-1",
        lossReasonCode: "chose_competitor",
        // Missing lossReasonDetail - should fail
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "loss_reason_detail is required for reason 'chose_competitor'"
      );
    });

    it("should accept status update with loss_reason_detail when required", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "demo",
      } as never);

      const result = await service.updateStatus(mockLead.id, "lost", {
        performedBy: "user-1",
        lossReasonCode: "chose_competitor",
        lossReasonDetail: "Went with Tourmo",
      });

      expect(result.success).toBe(true);
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "lost",
            loss_reason_code: "chose_competitor",
            loss_reason_detail: "Went with Tourmo",
          }),
        })
      );
    });

    it("should not require loss_reason_detail when reason has requires_detail=false", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: "demo",
      } as never);

      const result = await service.updateStatus(mockLead.id, "lost", {
        performedBy: "user-1",
        lossReasonCode: "no_budget",
        // No detail needed for no_budget
      });

      expect(result.success).toBe(true);
    });
  });

  // ===== SUITE 6: Edge Cases (4 tests) =====

  describe("Edge Cases", () => {
    it("should return not found error for non-existent lead", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      const result = await service.updateStatus("non-existent-id", "demo", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Lead not found");
    });

    it("should return empty array for unknown status transitions", async () => {
      const transitions = await service.getAllowedTransitions("unknown_status");
      expect(transitions).toEqual([]);
    });

    it("should clear both workflow and loss reasons cache", async () => {
      // Load both caches
      await service.getWorkflow();
      await service.getLossReasons();

      // Clear cache
      service.clearCache();

      // Load again
      await service.getWorkflow();
      await service.getLossReasons();

      // Each should have been loaded twice
      const calls = vi.mocked(service["settingsRepo"].getSettingValue).mock
        .calls;
      const workflowCalls = calls.filter(
        (call) => call[0] === "lead_status_workflow"
      );
      const lossReasonsCalls = calls.filter(
        (call) => call[0] === "lead_loss_reasons"
      );

      expect(workflowCalls).toHaveLength(2);
      expect(lossReasonsCalls).toHaveLength(2);
    });

    it("should handle lead with null status as 'new'", async () => {
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue({
        ...mockLead,
        status: null,
      } as never);

      const result = await service.updateStatus(mockLead.id, "demo", {
        performedBy: "user-1",
      });

      expect(result.success).toBe(true);
      expect(result.previousStatus).toBe("new");
    });

    it("should skip loss reason validation for non-terminal statuses", async () => {
      const result = await service.validateLossReason("any_code", "demo");

      expect(result.valid).toBe(true);
      expect(result.requiresDetail).toBe(false);
    });
  });

  // ===== SUITE 7: Status Config (2 tests) =====

  describe("Status Config", () => {
    it("should get status config by value", async () => {
      const config = await service.getStatusConfig("converted");

      expect(config).toBeDefined();
      expect(config?.value).toBe("converted");
      expect(config?.is_terminal).toBe(true);
      expect(config?.is_won).toBe(true);
      expect(config?.allowed_transitions).toEqual([]);
    });

    it("should return null for unknown status", async () => {
      const config = await service.getStatusConfig("unknown_status");
      expect(config).toBeNull();
    });
  });
});
