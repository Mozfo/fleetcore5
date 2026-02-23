import { describe, it, expect, vi, beforeEach } from "vitest";
import { LeadRepository, type LeadWithRelations } from "../lead.repository";
import type { PrismaClient } from "@prisma/client";

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
        tenant_id: "7ad8173c-68c5-41d3-9918-686e4e941cc0",
        // V5: Closing columns (kept)
        stage_entered_at: null,
        loss_reason_code: null,
        loss_reason_detail: null,
        competitor_name: null,
        // V6.2: Booking Cal.com columns
        booking_slot_at: null,
        booking_confirmed_at: null,
        booking_calcom_uid: null,
        platforms_used: [],
        // V6.2: Wizard column
        wizard_completed: false,
        // V6.2: Conversion columns
        converted_at: null,
        assigned_member: {
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
          assigned_member: {
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
        assigned_member: {
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

      expect(result?.assigned_member).toBeDefined();
      expect(result?.assigned_member?.first_name).toBe("Marie");
      expect(result?.crm_lead_sources).toBeDefined();
      expect(result?.crm_lead_sources?.name_translations?.en).toBe(
        "Paid Search"
      );
    });
  });

  // V6.3: 8 statuts - new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified
  describe("countActiveLeads", () => {
    it("should count leads with active statuses (V6.3: new, demo, proposal_sent, payment_pending)", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(3);

      const result = await repository.countActiveLeads("emp-1");

      expect(mockPrisma.crm_leads.count).toHaveBeenCalledWith({
        where: {
          assigned_to: "emp-1",
          status: {
            in: ["new", "demo", "proposal_sent", "payment_pending"],
          },
          deleted_at: null,
        },
      });

      expect(result).toBe(3);
    });

    it("should count leads with status 'demo'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(1);

      await repository.countActiveLeads("emp-1");

      expect(mockPrisma.crm_leads.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: {
            in: expect.arrayContaining(["demo"]),
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
      expect(statusFilter).toEqual([
        "new",
        "demo",
        "proposal_sent",
        "payment_pending",
      ]);
    });

    it("should NOT count leads with status 'lost'", async () => {
      mockPrisma.crm_leads.count.mockResolvedValue(0);

      await repository.countActiveLeads("emp-1");

      const callArgs = mockPrisma.crm_leads.count.mock.calls[0][0];
      const statusFilter = callArgs?.where?.status?.in;

      expect(statusFilter).not.toContain("lost");
      expect(statusFilter).toEqual([
        "new",
        "demo",
        "proposal_sent",
        "payment_pending",
      ]);
    });
  });

  // Note: generateLeadCode tests removed - PostgreSQL trigger (trg_set_lead_code) handles generation
  // Format: L-XXXXXX (random alphanumeric, no sequential numbers for security)
});
