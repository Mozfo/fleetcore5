import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import type { crm_leads } from "@prisma/client";
import {
  WizardLeadService,
  WIZARD_LEAD_CONSTANTS,
} from "../wizard-lead.service";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    crm_leads: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import mocked prisma after mocking
import { prisma } from "@/lib/prisma";

/**
 * Factory function to create a complete mock lead with all required fields
 * Ensures TypeScript compliance with crm_leads model
 */
function createMockLead(overrides: Partial<crm_leads> = {}): crm_leads {
  const now = new Date();
  return {
    // Core fields
    id: "lead-uuid-123",
    email: "test@example.com",
    phone: null,
    source: null,
    status: "new",
    message: null,
    created_at: now,
    updated_at: now,
    country_code: "FR",
    fleet_size: null,
    current_software: null,
    assigned_to: null,
    qualification_score: null,
    qualification_notes: null,
    qualified_date: null,
    converted_date: null,
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    metadata: { source: "book_demo_wizard", form_locale: "fr" },
    created_by: null,
    updated_by: null,
    deleted_at: null,
    deleted_by: null,
    deletion_reason: null,
    lead_code: "L-R7M8J6", // Format PostgreSQL trigger (L-XXXXXX)
    first_name: null,
    last_name: null,
    company_name: null,
    industry: null,
    company_size: null,
    website_url: null,
    linkedin_url: null,
    city: null,
    lead_stage: null,
    fit_score: null,
    engagement_score: null,
    scoring: null,
    gdpr_consent: null,
    consent_at: null,
    source_id: null,
    opportunity_id: null,
    next_action_date: null,
    priority: "medium",
    consent_ip: null,
    last_activity_at: null,
    // V5: Closing columns
    stage_entered_at: now,
    loss_reason_code: null,
    loss_reason_detail: null,
    competitor_name: null,
    // V6.2: Booking Cal.com
    booking_slot_at: null,
    booking_confirmed_at: null,
    booking_calcom_uid: null,
    platforms_used: [],
    // V6.2: Wizard
    wizard_completed: false,
    // V6.2: Conversion
    tenant_id: WIZARD_LEAD_CONSTANTS.DEFAULT_TENANT_ID,
    converted_at: null,
    // V6.2.1: Stripe Payment Link
    stripe_checkout_session_id: null,
    stripe_payment_link_url: null,
    payment_link_created_at: null,
    payment_link_expires_at: null,
    // V6.2.2: Email Verification
    email_verified: false,
    email_verification_code: null,
    email_verification_expires_at: null,
    email_verification_attempts: 0,
    // V6.2.6: Attendance Confirmation
    confirmation_token: null,
    attendance_confirmed: false,
    attendance_confirmed_at: null,
    j1_reminder_sent_at: null,
    // V6.3.3: Reschedule token
    reschedule_token: null,
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
    // Apply overrides
    ...overrides,
  };
}

describe("WizardLeadService", () => {
  let service: WizardLeadService;

  // Mock lead data
  const mockLeadId = "lead-uuid-123";
  const mockEmail = "test@example.com";
  const mockCountryCode = "FR";

  beforeEach(() => {
    service = new WizardLeadService();
    vi.clearAllMocks();

    // Default: no existing lead
    vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // ============================================
  // createWizardLead
  // ============================================

  describe("createWizardLead", () => {
    it("should create a new lead when email does not exist", async () => {
      // Arrange
      const mockNewLead = createMockLead();
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.crm_leads.create).mockResolvedValue(mockNewLead);

      // Act
      const result = await service.createWizardLead({
        email: mockEmail,
        country_code: mockCountryCode,
        locale: "fr",
      });

      // Assert
      expect(result.isNew).toBe(true);
      expect(result.leadId).toBe(mockLeadId);
      expect(result.lead).toEqual(mockNewLead);

      expect(prisma.crm_leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockEmail.toLowerCase(),
          country_code: mockCountryCode,
          status: "new",
          email_verified: false,
          tenant_id: WIZARD_LEAD_CONSTANTS.DEFAULT_TENANT_ID,
          wizard_completed: false,
        }),
      });
    });

    it("should return existing lead when email already exists", async () => {
      // Arrange
      const mockExistingLead = createMockLead({
        lead_code: "L-CQDM56", // Format PostgreSQL trigger (L-XXXXXX)
        email_verified: true,
      });
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(mockExistingLead);
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockExistingLead);

      // Act
      const result = await service.createWizardLead({
        email: mockEmail,
        country_code: mockCountryCode,
        locale: "fr",
      });

      // Assert
      expect(result.isNew).toBe(false);
      expect(result.leadId).toBe(mockExistingLead.id);
      expect(prisma.crm_leads.create).not.toHaveBeenCalled();
    });

    // Note: lead_code tests removed - PostgreSQL trigger (trg_set_lead_code) handles generation
    // Format: L-XXXXXX (random alphanumeric, no sequential numbers for security)

    it("should normalize email to lowercase and country_code to uppercase", async () => {
      // Arrange
      const mockNewLead = createMockLead();
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.crm_leads.create).mockResolvedValue(mockNewLead);

      // Act
      await service.createWizardLead({
        email: "TEST@EXAMPLE.COM",
        country_code: "fr",
        locale: "fr",
      });

      // Assert
      expect(prisma.crm_leads.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "test@example.com",
          country_code: "FR",
        }),
      });
    });

    it("should update country_code if different from existing lead", async () => {
      // Arrange
      const leadWithDifferentCountry = createMockLead({ country_code: "DE" });
      const updatedLead = createMockLead({ country_code: "FR" });

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(
        leadWithDifferentCountry
      );
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(updatedLead);

      // Act
      await service.createWizardLead({
        email: mockEmail,
        country_code: "FR",
        locale: "fr",
      });

      // Assert: country_code should be updated
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: leadWithDifferentCountry.id },
        data: expect.objectContaining({
          country_code: "FR",
        }),
      });
    });
  });

  // ============================================
  // setVerificationCode
  // ============================================

  describe("setVerificationCode", () => {
    it("should store hashed code and expiration", async () => {
      // Arrange
      const hashedCode = "bcrypt_hashed_123456";
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead);

      // Act
      await service.setVerificationCode(mockLeadId, {
        hashedCode,
        expiresAt,
      });

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: {
          email_verification_code: hashedCode,
          email_verification_expires_at: expiresAt,
          email_verification_attempts: 0,
          updated_at: expect.any(Date),
        },
      });
    });

    it("should reset attempts to 0 when setting new code", async () => {
      // Arrange
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead);

      // Act
      await service.setVerificationCode(mockLeadId, {
        hashedCode: "hash",
        expiresAt: new Date(),
      });

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email_verification_attempts: 0,
          }),
        })
      );
    });
  });

  // ============================================
  // markEmailVerified
  // ============================================

  describe("markEmailVerified", () => {
    it("should set email_verified to true and clear verification fields", async () => {
      // Arrange
      const verifiedLead = createMockLead({
        email_verified: true,
        email_verification_code: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
      });
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(verifiedLead);

      // Act
      await service.markEmailVerified(mockLeadId);

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: {
          email_verified: true,
          email_verification_code: null,
          email_verification_expires_at: null,
          email_verification_attempts: 0,
          updated_at: expect.any(Date),
        },
      });
    });
  });

  // ============================================
  // completeProfile
  // ============================================

  describe("completeProfile", () => {
    it("should update all profile fields and set wizard_completed", async () => {
      // Arrange
      const completedLead = createMockLead({
        company_name: "Acme Corp",
        phone: "+33612345678",
        fleet_size: "11-20",
        wizard_completed: true,
      });
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(completedLead);

      // Act
      await service.completeProfile(mockLeadId, {
        company_name: "Acme Corp",
        phone: "+33612345678",
        fleet_size: "11-20",
      });

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: {
          company_name: "Acme Corp",
          phone: "+33612345678",
          fleet_size: "11-20",
          wizard_completed: true,
          updated_at: expect.any(Date),
        },
      });
    });

    it("should record GDPR consent with IP and timestamp", async () => {
      // Arrange
      const gdprLead = createMockLead({
        gdpr_consent: true,
        consent_at: new Date(),
        consent_ip: "192.168.1.100",
      });
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(gdprLead);

      // Act
      await service.completeProfile(mockLeadId, {
        company_name: "EU Company",
        fleet_size: "6-10",
        gdpr_consent: true,
        consent_ip: "192.168.1.100",
      });

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: expect.objectContaining({
          gdpr_consent: true,
          consent_at: expect.any(Date),
          consent_ip: "192.168.1.100",
        }),
      });
    });

    it("should not include GDPR fields when consent is false", async () => {
      // Arrange
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead);

      // Act
      await service.completeProfile(mockLeadId, {
        company_name: "Non-EU Company",
        fleet_size: "1-5",
        gdpr_consent: false,
      });

      // Assert
      const updateCall = vi.mocked(prisma.crm_leads.update).mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty("gdpr_consent");
      expect(updateCall.data).not.toHaveProperty("consent_at");
      expect(updateCall.data).not.toHaveProperty("consent_ip");
    });

    it("should trim company_name and phone", async () => {
      // Arrange
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead);

      // Act
      await service.completeProfile(mockLeadId, {
        company_name: "  Acme Corp  ",
        phone: "  +33612345678  ",
        fleet_size: "11-20",
      });

      // Assert
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: expect.objectContaining({
          company_name: "Acme Corp",
          phone: "+33612345678",
        }),
      });
    });

    it("should not include phone when not provided", async () => {
      // Arrange
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead);

      // Act
      await service.completeProfile(mockLeadId, {
        company_name: "Test Company",
        fleet_size: "1-5",
      });

      // Assert
      const updateCall = vi.mocked(prisma.crm_leads.update).mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty("phone");
    });
  });

  // ============================================
  // incrementVerificationAttempts
  // ============================================

  describe("incrementVerificationAttempts", () => {
    it("should increment attempts and return new count", async () => {
      // Arrange
      const leadWithAttempts = createMockLead({
        email_verification_attempts: 3,
      });
      vi.mocked(prisma.crm_leads.update).mockResolvedValue(leadWithAttempts);

      // Act
      const newCount = await service.incrementVerificationAttempts(mockLeadId);

      // Assert
      expect(newCount).toBe(3);
      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        data: {
          email_verification_attempts: { increment: 1 },
          updated_at: expect.any(Date),
        },
        select: { email_verification_attempts: true },
      });
    });
  });

  // ============================================
  // findByEmail
  // ============================================

  describe("findByEmail", () => {
    it("should find lead by email (case insensitive)", async () => {
      // Arrange
      const mockExistingLead = createMockLead({ email_verified: true });
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(mockExistingLead);

      // Act
      const result = await service.findByEmail("TEST@EXAMPLE.COM");

      // Assert
      expect(result).toEqual(mockExistingLead);
      expect(prisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: {
          email: { equals: "test@example.com", mode: "insensitive" },
          deleted_at: null,
        },
      });
    });

    it("should return null if lead not found", async () => {
      // Arrange
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      // Act
      const result = await service.findByEmail("nonexistent@example.com");

      // Assert
      expect(result).toBeNull();
    });

    it("should ignore soft-deleted leads", async () => {
      // Arrange
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      // Act
      await service.findByEmail(mockEmail);

      // Assert
      expect(prisma.crm_leads.findFirst).toHaveBeenCalledWith({
        where: expect.objectContaining({
          deleted_at: null,
        }),
      });
    });
  });

  // ============================================
  // getLeadById
  // ============================================

  describe("getLeadById", () => {
    it("should return lead by ID", async () => {
      // Arrange
      const mockLead = createMockLead();
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(mockLead);

      // Act
      const result = await service.getLeadById(mockLeadId);

      // Assert
      expect(result).toEqual(mockLead);
      expect(prisma.crm_leads.findUnique).toHaveBeenCalledWith({
        where: { id: mockLeadId },
      });
    });

    it("should return null if lead not found", async () => {
      // Arrange
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.getLeadById("nonexistent-uuid");

      // Assert
      expect(result).toBeNull();
    });
  });

  // ============================================
  // getVerificationStatus
  // ============================================

  describe("getVerificationStatus", () => {
    it("should return verification status fields", async () => {
      // Arrange
      const verificationData = {
        email_verified: false,
        email_verification_code: "hashed_code",
        email_verification_expires_at: new Date(),
        email_verification_attempts: 2,
      };
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(
        verificationData as crm_leads
      );

      // Act
      const result = await service.getVerificationStatus(mockLeadId);

      // Assert
      expect(result).toEqual(verificationData);
      expect(prisma.crm_leads.findUnique).toHaveBeenCalledWith({
        where: { id: mockLeadId },
        select: {
          email_verified: true,
          email_verification_code: true,
          email_verification_expires_at: true,
          email_verification_attempts: true,
        },
      });
    });

    it("should return null if lead not found", async () => {
      // Arrange
      vi.mocked(prisma.crm_leads.findUnique).mockResolvedValue(null);

      // Act
      const result = await service.getVerificationStatus("nonexistent");

      // Assert
      expect(result).toBeNull();
    });
  });
});
