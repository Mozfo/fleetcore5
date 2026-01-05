import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeadRepository, type LeadWithRelations } from "../lead.repository";
import type { PrismaClient } from "@prisma/client";
import type { PrismaTransaction } from "@/lib/core/types";

describe("LeadRepository", () => {
  let repository: LeadRepository;
  let mockPrisma: {
    crm_leads: {
      findFirst: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      crm_leads: {
        findFirst: vi.fn(),
        count: vi.fn(),
      },
    };

    repository = new LeadRepository(mockPrisma as unknown as PrismaClient);
  });

  describe("findByEmail", () => {
    it("should find lead by email with relations", async () => {
      // Using 'as unknown as' to handle potential Prisma type generation inconsistencies
      const mockLead = {
        id: "lead-1",
        lead_code: "LEAD-001",
        email: "contact@example.com",
        phone: "+33612345678",
        first_name: "Jean",
        last_name: "Dupont",
        company_name: "Example Corp",
        industry: null,
        company_size: null,
        website_url: null,
        linkedin_url: null,
        city: null,
        fleet_size: "11-50",
        current_software: null,
        status: "new",
        lead_stage: "top_of_funnel",
        priority: "medium",
        qualification_score: null,
        qualification_notes: null,
        qualified_date: null,
        converted_date: null,
        next_action_date: null,
        fit_score: null,
        engagement_score: null,
        scoring: null,
        source: null,
        source_id: "source-1",
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        gdpr_consent: true,
        consent_at: null,
        consent_ip: "192.168.1.1",
        assigned_to: "emp-1",
        opportunity_id: null,
        created_at: new Date(),
        created_by: null,
        updated_at: new Date(),
        updated_by: null,
        deleted_at: null,
        deleted_by: null,
        last_activity_at: null,
        deletion_reason: null,
        message: null,
        metadata: {},
        country_code: "FR",
        provider_id: "7ad8173c-68c5-41d3-9918-686e4e941cc0",
        // V5: Closing columns
        expected_value: null,
        expected_close_date: null,
        probability_percent: null,
        forecast_value: null,
        stage_entered_at: null,
        won_date: null,
        lost_date: null,
        loss_reason_code: null,
        loss_reason_detail: null,
        competitor_name: null,
        // V5: Tracking columns
        callback_requested_at: null,
        callback_scheduled_at: null,
        callback_mode: null,
        demo_requested_at: null,
        demo_scheduled_at: null,
        demo_viewed_at: null,
        demo_view_percent: null,
        checkout_started_at: null,
        checkout_abandoned_at: null,
        // V5: Escalation columns
        escalated_at: null,
        escalation_expires_at: null,
        // V6.2: Booking Cal.com columns
        booking_slot_at: null,
        booking_confirmed_at: null,
        booking_calcom_uid: null,
        platforms_used: [],
        // V6.2: Wizard column
        wizard_completed: false,
        // V6.2: Conversion columns
        tenant_id: null,
        converted_at: null,
        eu1f9qh: {
          id: "emp-1",
          first_name: "Marie",
          last_name: "Martin",
          email: "marie.martin@fleetcore.com",
        },
        crm_lead_sources: {
          id: "source-1",
          name_translations: { en: "Organic", fr: "Organique", ar: "عضوي" },
        },
      } as unknown as LeadWithRelations;

      mockPrisma.crm_leads.findFirst.mockResolvedValue(mockLead);

      const result = await repository.findByEmail("contact@example.com");

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: "contact@example.com",
            mode: "insensitive",
          },
          deleted_at: null,
        },
        include: {
          eu1f9qh: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          crm_lead_sources: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      expect(result).toEqual(mockLead);
      expect(result?.email).toBe("contact@example.com");
    });

    it("should return null when email does not exist", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue(null);

      const result = await repository.findByEmail("nonexistent@example.com");

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: "nonexistent@example.com",
            mode: "insensitive",
          },
          deleted_at: null,
        },
        include: expect.any(Object),
      });

      expect(result).toBeNull();
    });

    it("should find lead regardless of email case (case insensitive)", async () => {
      const mockLead: Partial<LeadWithRelations> = {
        id: "lead-1",
        email: "contact@example.com",
        first_name: "Jean",
        last_name: "Dupont",
        deleted_at: null,
      };

      mockPrisma.crm_leads.findFirst.mockResolvedValue(mockLead);

      await repository.findByEmail("CONTACT@EXAMPLE.COM");

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          email: {
            equals: "CONTACT@EXAMPLE.COM",
            mode: "insensitive", // This ensures case insensitive search
          },
          deleted_at: null,
        },
        include: expect.any(Object),
      });
    });

    it("should return null for soft-deleted leads", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue(null);

      await repository.findByEmail("deleted@example.com");

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          email: expect.any(Object),
          deleted_at: null, // Explicitly filters out deleted leads
        },
        include: expect.any(Object),
      });
    });

    it("should include assigned employee and source relations", async () => {
      const mockLead: Partial<LeadWithRelations> = {
        id: "lead-1",
        email: "test@example.com",
        eu1f9qh: {
          id: "emp-1",
          first_name: "Marie",
          last_name: "Martin",
          email: "marie@fleetcore.com",
        },
        crm_lead_sources: {
          id: "source-1",
          name_translations: {
            en: "Paid Search",
            fr: "Recherche payante",
            ar: "البحث المدفوع",
          },
        },
      };

      mockPrisma.crm_leads.findFirst.mockResolvedValue(mockLead);

      const result = await repository.findByEmail("test@example.com");

      expect(result?.eu1f9qh).toBeDefined();
      expect(result?.eu1f9qh?.first_name).toBe("Marie");
      expect(result?.crm_lead_sources).toBeDefined();
      expect(result?.crm_lead_sources?.name_translations?.en).toBe(
        "Paid Search"
      );
    });
  });

  describe("countActiveLeads", () => {
    it("should count leads with status 'new', 'working', or 'qualified'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(3);

      const result = await repository.countActiveLeads("emp-1");

      expect(mockPrisma.crm_leads.count).toHaveBeenCalledWith({
        where: {
          assigned_to: "emp-1",
          status: {
            in: ["new", "working", "qualified"],
          },
          deleted_at: null,
        },
      });

      expect(result).toBe(3);
    });

    it("should count leads with status 'working'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(1);

      await repository.countActiveLeads("emp-1");

      expect(mockPrisma.crm_leads.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: {
            in: expect.arrayContaining(["working"]),
          },
        }),
      });
    });

    it("should NOT count leads with status 'converted'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(0);

      await repository.countActiveLeads("emp-1");

      const callArgs = mockPrisma.crm_leads.count.mock.calls[0][0];
      const statusFilter = callArgs?.where?.status?.in;

      expect(statusFilter).not.toContain("converted");
      expect(statusFilter).toEqual(["new", "working", "qualified"]);
    });

    it("should NOT count leads with status 'lost'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(0);

      await repository.countActiveLeads("emp-1");

      const callArgs = mockPrisma.crm_leads.count.mock.calls[0][0];
      const statusFilter = callArgs?.where?.status?.in;

      expect(statusFilter).not.toContain("lost");
      expect(statusFilter).toEqual(["new", "working", "qualified"]);
    });
  });

  describe("generateLeadCode", () => {
    it("should generate first lead code of the year (LEAD-2025-00001)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue(null);

      const result = await repository.generateLeadCode(2025);

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          lead_code: { startsWith: "LEAD-2025-" },
          deleted_at: null,
        },
        orderBy: { lead_code: "desc" },
        select: { lead_code: true },
      });

      expect(result).toBe("LEAD-2025-00001");
    });

    it("should increment sequence number correctly (00042 → 00043)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-00042",
      });

      const result = await repository.generateLeadCode(2025);

      expect(result).toBe("LEAD-2025-00043");
    });

    it("should maintain 5-digit padding (00009 → 00010)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-00009",
      });

      const result = await repository.generateLeadCode(2025);

      expect(result).toBe("LEAD-2025-00010");
    });

    it("should handle large sequence numbers (99999 → 100000)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-99999",
      });

      const result = await repository.generateLeadCode(2025);

      expect(result).toBe("LEAD-2025-100000");
    });

    it("should reset sequence for new year (LEAD-2026-00001)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue(null);

      const result = await repository.generateLeadCode(2026);

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          lead_code: { startsWith: "LEAD-2026-" },
          deleted_at: null,
        },
        orderBy: { lead_code: "desc" },
        select: { lead_code: true },
      });

      expect(result).toBe("LEAD-2026-00001");
    });

    it("should exclude soft-deleted leads from sequence calculation", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-00050",
      });

      await repository.generateLeadCode(2025);

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deleted_at: null,
        }),
        orderBy: expect.any(Object),
        select: expect.any(Object),
      });
    });

    it("should handle invalid format by restarting at 00001", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-INVALID",
      });

      const result = await repository.generateLeadCode(2025);

      expect(result).toBe("LEAD-2025-00001");
    });

    it("should support transaction context", async () => {
      const mockTx = {
        crm_leads: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      };

      const result = await repository.generateLeadCode(
        2025,
        mockTx as unknown as PrismaTransaction
      );

      expect(mockTx.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          lead_code: { startsWith: "LEAD-2025-" },
          deleted_at: null,
        },
        orderBy: { lead_code: "desc" },
        select: { lead_code: true },
      });

      expect(result).toBe("LEAD-2025-00001");
      expect(mockPrisma.crm_leads.findFirst).not.toHaveBeenCalled();
    });

    it("should use descending order to find last lead code (alphabetical = numerical)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025-00100",
      });

      await repository.generateLeadCode(2025);

      expect(mockPrisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { lead_code: "desc" },
        select: { lead_code: true },
      });
    });

    it("should handle edge case with malformed lead_code (2 parts)", async () => {
      mockPrisma.crm_leads.findFirst.mockResolvedValue({
        lead_code: "LEAD-2025",
      });

      const result = await repository.generateLeadCode(2025);

      expect(result).toBe("LEAD-2025-00001");
    });
  });
});
