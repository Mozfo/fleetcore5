import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { LeadCreationService } from "../lead-creation.service";
import { prisma } from "@/lib/prisma";
import type { CreateLeadInput } from "@/lib/validators/crm/lead.validators";
import { Prisma } from "@prisma/client";

// Note: lead_code generation removed - PostgreSQL trigger (trg_set_lead_code) handles it
// Format: L-XXXXXX (random alphanumeric, no sequential numbers for security)

describe("LeadCreationService", () => {
  let service: LeadCreationService;
  const mockTenantId = "tenant-123";
  const mockUserId = "user-456";

  const mockEmployee = {
    id: "emp-1",
    first_name: "John",
    last_name: "Senior",
    email: "john@fleetcore.com",
    title: "Senior Account Manager UAE",
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null,
    phone: "",
    auth_user_id: "auth_user_123",
    tenant_id: "provider-1", // FleetCore division
    role: "member",
    last_login_at: null,
    metadata: {},
    email_verified_at: null,
    two_factor_enabled: false,
    two_factor_secret: null,
    password_changed_at: null,
    failed_login_attempts: 0,
    locked_until: null,
    default_role_id: null,
    preferred_language: null,
    notification_preferences: null,
  };

  beforeEach(() => {
    service = new LeadCreationService();

    // Mock CountryService methods (default: non-GDPR, operational)
    vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
      false
    );
    vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
      true
    );

    // Mock settingsRepo in assignmentService for assignment rules
    vi.spyOn(
      service["assignmentService"]["settingsRepo"],
      "getSettingValue"
    ).mockImplementation((key: string) => {
      if (key === "lead_assignment_rules") {
        return Promise.resolve({
          fleet_size_priority: {
            "50+": {
              title_patterns: ["%Senior%Account%Manager%"],
              priority: 1,
            },
            "11-50": {
              title_patterns: ["%Account%Manager%"],
              exclude_patterns: ["%Senior%"],
              priority: 2,
            },
          },
          geographic_zones: {
            UAE: {
              countries: ["AE"],
              title_patterns: ["%UAE%", "%Emirates%"],
              priority: 10,
            },
            KSA: {
              countries: ["SA"],
              title_patterns: ["%KSA%", "%Saudi%"],
              priority: 11,
            },
            FRANCE: {
              countries: ["FR"],
              title_patterns: ["%France%"],
              priority: 12,
            },
          },
          fallback: {
            employee_id: null,
            title_pattern: "%Sales%Manager%",
          },
        });
      }
      return Promise.resolve(null);
    });

    // Mock prisma.adm_members.findMany
    vi.spyOn(prisma.adm_members, "findMany").mockResolvedValue([mockEmployee]);

    // Note: lead_code generation removed - PostgreSQL trigger (trg_set_lead_code) handles it
    // Format: L-XXXXXX (random alphanumeric, no sequential numbers for security)

    // Mock LeadRepository.create
    vi.spyOn(service["leadRepo"], "create").mockImplementation(
      async (
        data: Record<string, unknown>,
        createdBy: string,
        _tenantId?: string
      ) => {
        const lead = {
          id: "lead-uuid-123",
          lead_code: "L-TEST01", // PostgreSQL trigger format (L-XXXXXX)
          email: data.email as string,
          first_name: (data.first_name as string) ?? "Unknown",
          last_name: (data.last_name as string) ?? "User",
          company_name: (data.company_name as string | null) ?? null,
          phone: (data.phone as string) ?? "",
          fleet_size: (data.fleet_size as string | null) ?? null,
          country_code: (data.country_code as string | null) ?? null,
          message: (data.message as string | null) ?? null,
          source: (data.source as string | null) ?? null,
          utm_source: (data.utm_source as string | null) ?? null,
          utm_medium: (data.utm_medium as string | null) ?? null,
          utm_campaign: (data.utm_campaign as string | null) ?? null,
          assigned_to: (data.assigned_to as string | null) ?? null,
          priority:
            (data.priority as "low" | "medium" | "high" | "urgent") ?? "medium",
          status: (data.status as string) ?? "new",
          metadata: (data.metadata as Prisma.JsonValue) ?? null,
          industry: null,
          company_size: null,
          website_url: null,
          linkedin_url: null,
          city: null,
          gdpr_consent: null,
          consent_at: null,
          consent_ip: null,
          source_id: null,
          opportunity_id: null,
          next_action_date: null,
          current_software: null,
          qualified_date: null,
          converted_date: null,
          created_at: new Date("2025-01-15T10:30:00.000Z"),
          updated_at: new Date("2025-01-15T10:30:00.000Z"),
          created_by: createdBy || null,
          updated_by: null,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null,
          last_activity_at: null,
          tenant_id: _tenantId ?? "test-tenant-id",
          // V5: Closing columns (kept)
          stage_entered_at: null,
          loss_reason_code: null,
          loss_reason_detail: null,
          competitor_name: null,
          platforms_used: [],
          // V6.2: Wizard column
          wizard_completed: false,
          // V6.2: Conversion columns
          converted_at: null,
          // V6.2.1: Stripe Payment Link columns
          stripe_checkout_session_id: null,
          stripe_payment_link_url: null,
          payment_link_created_at: null,
          payment_link_expires_at: null,
          // V6.2.2: Email Verification columns
          email_verified: false,
          email_verification_code: null,
          email_verification_expires_at: null,
          email_verification_attempts: 0,
          // V6.4: GeoIP tracking
          ip_address: null,
          detected_country_code: null,
          // V6.4-3: Language from homepage
          language: "en",
          // V6.6: Callback fields
          callback_requested: false,
          callback_requested_at: null,
          callback_completed_at: null,
          callback_notes: null,
          // V6.6: Disqualification fields
          disqualified_at: null,
          disqualification_reason: null,
          disqualification_comment: null,
          disqualified_by: null,
          // V6.6: Recovery notification
          recovery_notification_sent_at: null,
          recovery_notification_clicked_at: null,
          whatsapp_number: null,
          // V7: BANT qualification
          bant_budget: null,
          bant_authority: null,
          bant_need: null,
          bant_timeline: null,
          bant_qualified_at: null,
          bant_qualified_by: null,
        };
        return lead;
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== SUITE 1: Complete Flow (5 tests) =====

  describe("Complete Lead Creation Flow", () => {
    it("should create SQL lead with all orchestration steps", async () => {
      const input: CreateLeadInput = {
        email: "ceo@bigfleet.com",
        first_name: "John",
        last_name: "Doe",
        company_name: "Big Fleet Corp",
        phone: "+971501234567",
        fleet_size: "50+",
        country_code: "AE",
        message:
          "We operate 600 vehicles and need comprehensive fleet management solution. Budget approved and ready to proceed.",
        source: "website",
        metadata: {
          page_views: 12,
          time_on_site: 720,
        },
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      // Verify lead created
      expect(result.lead.id).toBeDefined();
      expect(result.lead.lead_code).toBe("L-TEST01"); // PostgreSQL trigger format (L-XXXXXX)
      expect(result.lead.email).toBe("ceo@bigfleet.com");
      expect(result.lead.status).toBe("new");

      // Verify assignment (fleet size priority for 50+)
      expect(result.assignment.assigned_to).toBe("emp-1");
      expect(result.assignment.assignment_reason).toContain(
        "Fleet size priority"
      );

      // Verify priority
      expect(result.lead.priority).toBeDefined();
    });

    it("should create MQL lead with medium priority", async () => {
      const input: CreateLeadInput = {
        email: "manager@mediumfleet.com",
        first_name: "Test",
        last_name: "Manager",
        fleet_size: "50+",
        country_code: "FR",
        message:
          "Interested in your solution for our 75 vehicles. Can you provide pricing?",
        source: "referral",
        metadata: {
          page_views: 5,
          time_on_site: 300,
        },
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.id).toBeDefined();
      expect(result.lead.priority).toBe("medium");
    });

    it("should create TOF lead with low priority", async () => {
      const input: CreateLeadInput = {
        email: "info@smallfleet.com",
        first_name: "Test",
        last_name: "User",
        fleet_size: "2-10",
        country_code: "US",
        message: "Just looking",
        source: "cold_outreach",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.id).toBeDefined();
      expect(result.lead.priority).toBe("low");
    });

    it("should create lead with high-value inputs", async () => {
      const input: CreateLeadInput = {
        email: "urgent@vipfleet.com",
        first_name: "VIP",
        last_name: "Fleet",
        fleet_size: "50+",
        country_code: "AE",
        message:
          "We need immediate solution for 800 vehicles across UAE. Budget approved, decision maker here, ready to sign contract next week. Please contact ASAP. We have evaluated multiple providers and FleetCore is our top choice.",
        phone: "+971501234567",
        source: "event",
        metadata: {
          page_views: 20,
          time_on_site: 1200,
        },
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.id).toBeDefined();
      expect(result.lead.priority).toBeDefined();
    });

    it("should include UTM parameters in lead", async () => {
      const input: CreateLeadInput = {
        email: "campaign@fleet.com",
        first_name: "Campaign",
        last_name: "Test",
        fleet_size: "50+",
        country_code: "FR",
        message: "Saw your ad on Google",
        source: "paid_ad",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "fleet-management-2025",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.utm_source).toBe("google");
      expect(result.lead.utm_medium).toBe("cpc");
      expect(result.lead.utm_campaign).toBe("fleet-management-2025");
    });
  });

  // ===== SUITE 2: Lead Creation Result Structure (2 tests) =====

  describe("Lead Creation Result Structure", () => {
    it("should return result with lead and assignment fields", async () => {
      const input: CreateLeadInput = {
        email: "test@test.com",
        first_name: "Test",
        last_name: "User",
        fleet_size: "50+",
        country_code: "AE",
        message: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result).toHaveProperty("lead");
      expect(result).toHaveProperty("assignment");
      expect(result.lead.id).toBeDefined();
      expect(result.assignment.assigned_to).toBeDefined();
      expect(result.assignment.assignment_reason).toBeDefined();
    });

    it("should create lead with correct email and status", async () => {
      const input: CreateLeadInput = {
        email: "structure@test.com",
        first_name: "Test",
        last_name: "User",
        message: "A".repeat(250),
        phone: "+971501234567",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.email).toBe("structure@test.com");
      expect(result.lead.status).toBe("new");
    });
  });

  // ===== SUITE 3: Assignment Integration (3 tests) =====

  describe("Assignment Integration", () => {
    it("should assign based on fleet size priority", async () => {
      const input: CreateLeadInput = {
        email: "bigfleet@test.com",
        first_name: "Big",
        last_name: "Fleet",
        fleet_size: "50+",
        country_code: "US", // Generic country (no geographic zone)
        message: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.assignment.assigned_to).toBe("emp-1");
      expect(result.assignment.assignment_reason).toContain(
        "Fleet size priority"
      );
    });

    it("should assign based on geographic zone if no fleet priority", async () => {
      const input: CreateLeadInput = {
        email: "uae@test.com",
        first_name: "UAE",
        last_name: "Test",
        fleet_size: "11-50", // No specific fleet priority
        country_code: "AE",
        message: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.assignment.assigned_to).toBe("emp-1");
      expect(result.assignment.assignment_reason).toContain("Geographic zone");
    });

    it("should handle no available employees gracefully", async () => {
      // Mock empty employees
      vi.spyOn(prisma.adm_members, "findMany").mockResolvedValue([]);

      const input: CreateLeadInput = {
        email: "noassign@test.com",
        first_name: "No",
        last_name: "Assign",
        fleet_size: "50+",
        country_code: "AE",
        message: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.assignment.assigned_to).toBeNull();
      expect(result.assignment.assignment_reason).toBe(
        "No active employees available for assignment"
      );
    });
  });

  // ===== SUITE 4: GDPR Validation (4 tests) =====

  describe("GDPR Validation", () => {
    it("should reject EU lead without gdpr_consent", async () => {
      // Mock France as GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        true
      );

      const input: CreateLeadInput = {
        email: "test@france-fleet.fr",
        first_name: "Jean",
        last_name: "Dupont",
        fleet_size: "50+",
        country_code: "FR",
        message: "We need fleet management",
        source: "website",
        // Missing: gdpr_consent
      };

      await expect(
        service.createLead(input, mockTenantId, mockUserId)
      ).rejects.toThrow(
        "GDPR consent required for EU/EEA countries (country: FR)"
      );

      expect(service["countryService"].isGdprCountry).toHaveBeenCalledWith(
        "FR"
      );
    });

    it("should reject EU lead without consent_ip", async () => {
      // Mock Germany as GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        true
      );

      const input: CreateLeadInput = {
        email: "test@german-fleet.de",
        first_name: "Hans",
        last_name: "Schmidt",
        fleet_size: "50+",
        country_code: "DE",
        message: "Interested in your solution",
        source: "website",
        gdpr_consent: true,
        // Missing: consent_ip
      };

      await expect(
        service.createLead(input, mockTenantId, mockUserId)
      ).rejects.toThrow("Consent IP address required for GDPR compliance");

      expect(service["countryService"].isGdprCountry).toHaveBeenCalledWith(
        "DE"
      );
    });

    it("should accept EU lead with gdpr_consent and consent_ip", async () => {
      // Mock France as GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        true
      );
      // Mock France as operational (to avoid expansion logic)
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        true
      );

      const input: CreateLeadInput = {
        email: "valid@france-fleet.fr",
        first_name: "Marie",
        last_name: "Martin",
        fleet_size: "50+",
        country_code: "FR",
        message: "We are ready to proceed with FleetCore",
        source: "website",
        gdpr_consent: true,
        consent_ip: "192.168.1.1",
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.email).toBe("valid@france-fleet.fr");
      expect(result.lead.country_code).toBe("FR");
      expect(service["countryService"].isGdprCountry).toHaveBeenCalledWith(
        "FR"
      );
    });

    it("should accept non-EU lead without gdpr_consent", async () => {
      // Mock UAE as non-GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        false
      );
      // Mock UAE as operational
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        true
      );

      const input: CreateLeadInput = {
        email: "test@uae-fleet.ae",
        first_name: "Ahmed",
        last_name: "Al Maktoum",
        fleet_size: "50+",
        country_code: "AE",
        message: "We need fleet management for Dubai operations",
        source: "website",
        // No GDPR fields required for UAE
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.email).toBe("test@uae-fleet.ae");
      expect(result.lead.country_code).toBe("AE");
      expect(service["countryService"].isGdprCountry).toHaveBeenCalledWith(
        "AE"
      );
    });
  });

  // ===== SUITE 5: Expansion Logic (4 tests) =====

  describe("Expansion Opportunity Logic", () => {
    it("should mark non-operational country as expansion opportunity", async () => {
      // Mock Brazil as non-GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        false
      );
      // Mock Brazil as non-operational
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        false
      );

      const input: CreateLeadInput = {
        email: "ceo@brazil-fleet.br",
        first_name: "Carlos",
        last_name: "Silva",
        fleet_size: "50+",
        country_code: "BR",
        message: "Interested in FleetCore for our operations in Brazil",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.country_code).toBe("BR");
      expect(result.lead.metadata).toMatchObject({
        expansion_opportunity: true,
        expansion_country: "BR",
      });
      expect(result.lead.metadata).toHaveProperty("expansion_detected_at");
      expect(service["countryService"].isOperational).toHaveBeenCalledWith(
        "BR"
      );
    });

    it("should NOT mark operational country as expansion", async () => {
      // Mock UAE as non-GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        false
      );
      // Mock UAE as operational
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        true
      );

      const input: CreateLeadInput = {
        email: "test@operational.ae",
        first_name: "Ahmed",
        last_name: "Hassan",
        fleet_size: "50+",
        country_code: "AE",
        message: "We need FleetCore now",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.country_code).toBe("AE");
      expect(result.lead.metadata).not.toHaveProperty("expansion_opportunity");
      expect(service["countryService"].isOperational).toHaveBeenCalledWith(
        "AE"
      );
    });

    it("should preserve existing metadata when adding expansion flags", async () => {
      // Mock Qatar as non-GDPR and non-operational
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        false
      );
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        false
      );

      const input: CreateLeadInput = {
        email: "test@expansion.qa",
        first_name: "Mohammed",
        last_name: "Al Thani",
        fleet_size: "50+",
        country_code: "QA",
        message: "Interested in expansion",
        source: "event",
        metadata: {
          page_views: 10,
          time_on_site: 600,
          referrer: "linkedin",
        },
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.metadata).toMatchObject({
        page_views: 10,
        time_on_site: 600,
        referrer: "linkedin",
        expansion_opportunity: true,
        expansion_country: "QA",
      });
    });

    it("should check operational status for GDPR country too", async () => {
      // Mock Italy as GDPR country
      vi.spyOn(service["countryService"], "isGdprCountry").mockResolvedValue(
        true
      );
      // Mock Italy as non-operational (FleetCore not available yet)
      vi.spyOn(service["countryService"], "isOperational").mockResolvedValue(
        false
      );

      const input: CreateLeadInput = {
        email: "test@italy-fleet.it",
        first_name: "Marco",
        last_name: "Rossi",
        fleet_size: "50+",
        country_code: "IT",
        message: "We need FleetCore in Italy",
        source: "website",
        gdpr_consent: true,
        consent_ip: "192.168.1.100",
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.country_code).toBe("IT");
      expect(result.lead.metadata).toMatchObject({
        expansion_opportunity: true,
        expansion_country: "IT",
      });
      expect(service["countryService"].isGdprCountry).toHaveBeenCalledWith(
        "IT"
      );
      expect(service["countryService"].isOperational).toHaveBeenCalledWith(
        "IT"
      );
    });
  });

  // ===== SUITE 6: Edge Cases (4 tests) =====

  describe("Edge Cases", () => {
    it("should handle minimal input (only email)", async () => {
      const input: CreateLeadInput = {
        email: "minimal@test.com",
        first_name: "Minimal",
        last_name: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      expect(result.lead.email).toBe("minimal@test.com");
      expect(result.lead.priority).toBe("low");
    });

    // Note: lead_code generation test removed - PostgreSQL trigger (trg_set_lead_code) handles it
    // Format: L-XXXXXX (random alphanumeric, no sequential numbers for security)
    it("should receive lead_code from database (PostgreSQL trigger)", async () => {
      const input: CreateLeadInput = {
        email: "code@test.com",
        first_name: "Code",
        last_name: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId);

      // lead_code is generated by PostgreSQL trigger, mock returns "L-TEST01"
      expect(result.lead.lead_code).toBe("L-TEST01");
    });

    it("should preserve metadata in created lead", async () => {
      const metadata = {
        page_views: 8,
        time_on_site: 450,
        referrer_url: "https://google.com",
        landing_page: "https://fleetcore.com/pricing",
        custom_field: "custom_value",
      };

      const input: CreateLeadInput = {
        email: "metadata@test.com",
        first_name: "Metadata",
        last_name: "Test",
        source: "website",
        metadata,
      };

      const result = await service.createLead(input, mockTenantId);

      // Metadata should be preserved exactly as provided (priority is now a separate column)
      expect(result.lead.metadata).toEqual(metadata);
    });

    it("should include created_by when provided", async () => {
      const input: CreateLeadInput = {
        email: "audit@test.com",
        first_name: "Audit",
        last_name: "Test",
        source: "website",
      };

      const result = await service.createLead(input, mockTenantId, mockUserId);

      expect(result.lead.created_by).toBe(mockUserId);
    });
  });
});
