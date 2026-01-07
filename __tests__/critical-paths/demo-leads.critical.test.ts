/**
 * CRITICAL PATH TEST - P0 Priority
 *
 * Ce test DOIT passer avant tout deploiement.
 * Si ce test echoue, le build DOIT echouer.
 *
 * Business Impact: Perte de leads = perte directe de revenus
 *
 * INCIDENT HISTORY:
 * - Session #27 (24 nov 2025): Email sending code accidentally removed during GDPR rollback
 *   Impact: 4 days without lead confirmation emails
 *   Root cause: No test coverage for email sending
 *
 * ARCHITECTURE UPDATE:
 * - Session #29 (28 nov 2025): Migrated to Transactional Outbox Pattern (queue)
 *   Now uses NotificationQueueService.queueNotification() instead of direct sendEmail()
 *   Emails are processed by cron worker (/api/cron/notifications/process)
 *
 * @see docs/incidents/SESSION_27_EMAIL_REGRESSION.md
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Test constants
const TEST_API_URL = process.env.TEST_API_URL || "http://test.local:3000";
const TEST_IP = process.env.TEST_IP || "0.0.0.0";

// Mock Prisma
const mockCreate = vi.fn();
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

const mockPrismaClient = {
  crm_leads: {
    create: (...args: unknown[]) => mockCreate(...args),
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
  crm_countries: {
    findUnique: (...args: unknown[]) => mockFindUnique(...args),
  },
};

vi.mock("@/lib/prisma", () => ({
  db: mockPrismaClient,
  prisma: mockPrismaClient, // For EmailVerificationService
}));

// Mock NotificationQueueService - CRITICAL: This mock tracks if queueNotification is called
const mockQueueNotification = vi.fn();
vi.mock("@/lib/services/notification/queue.service", () => ({
  NotificationQueueService: vi.fn().mockImplementation(() => ({
    queueNotification: mockQueueNotification,
  })),
}));

// Mock CountryService
vi.mock("@/lib/services/crm/country.service", () => ({
  CountryService: vi.fn().mockImplementation(() => ({
    isGdprCountry: vi.fn().mockResolvedValue(false),
  })),
}));

// Mock getTemplateLocale
vi.mock("@/lib/utils/locale-mapping", () => ({
  getTemplateLocale: vi.fn().mockResolvedValue("en"),
}));

// Mock EmailVerificationService (used by wizard_step1 mode)
const mockEmailVerificationService = {
  sendVerificationCode: vi.fn().mockResolvedValue({
    success: true,
    leadId: "wizard-lead-uuid",
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  }),
  verifyCode: vi.fn(),
  canResendCode: vi.fn(),
  getVerificationStatus: vi.fn(),
};

vi.mock("@/lib/services/crm/email-verification.service", () => ({
  EmailVerificationService: vi
    .fn()
    .mockImplementation(() => mockEmailVerificationService),
  emailVerificationService: mockEmailVerificationService, // Singleton export
  VERIFICATION_CONSTANTS: {
    CODE_LENGTH: 6,
    BCRYPT_COST: 10,
    CODE_EXPIRATION_MINUTES: 15,
    RESEND_COOLDOWN_SECONDS: 60,
    MAX_VERIFICATION_ATTEMPTS: 5,
  },
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock GDPR middleware
vi.mock("@/lib/middleware/gdpr.middleware", () => ({
  captureConsentIp: vi.fn().mockReturnValue(TEST_IP),
}));

describe("CRITICAL: Demo Lead Email Flow (Queue-Based)", () => {
  const OPERATIONAL_COUNTRY = {
    country_code: "AE",
    is_operational: true,
    country_gdpr: false,
    country_name_en: "United Arab Emirates",
    country_name_fr: "Emirats arabes unis",
    country_name_ar: "الإمارات العربية المتحدة",
    country_preposition_fr: "aux",
    country_preposition_en: "in",
  };

  const MOCK_LEAD = {
    id: "test-lead-uuid",
    first_name: "Test",
    last_name: "User",
    email: "test@test.local",
    company_name: "Test Company",
    fleet_size: "10-50",
    country_code: "AE",
  };

  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest(`${TEST_API_URL}/api/demo-leads`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(null); // No duplicate
    mockCreate.mockResolvedValue(MOCK_LEAD);
    mockQueueNotification.mockResolvedValue({
      success: true,
      queueId: "queue-uuid",
    });
  });

  /**
   * CRITICAL TEST: All notification requirements in one test
   *
   * This test verifies:
   * 1. queueNotification is called after lead creation
   * 2. Correct template is selected based on country
   * 3. Idempotency key is included
   * 4. All required variables are passed
   */
  it("MUST queue notification with correct template and idempotency key - NEVER SKIP", async () => {
    mockFindUnique.mockResolvedValue(OPERATIONAL_COUNTRY);

    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      first_name: "Test",
      last_name: "User",
      email: "test@test.local",
      company_name: "Test Company",
      country_code: "AE",
      fleet_size: "10-50",
    });

    const response = await POST(request);
    const data = await response.json();

    // 1. Response should be successful
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // 2. CRITICAL: queueNotification MUST be called
    expect(mockQueueNotification).toHaveBeenCalledTimes(1);

    // 3. Verify all required parameters
    const callArgs = mockQueueNotification.mock.calls[0][0];

    // Template must be lead_confirmation for operational country
    expect(callArgs.templateCode).toBe("lead_confirmation");

    // Recipient email must match
    expect(callArgs.recipientEmail).toBe("test@test.local");

    // Idempotency key must be present to prevent duplicates
    expect(callArgs.idempotencyKey).toContain("lead_");
    expect(callArgs.idempotencyKey).toContain("test-lead-uuid");

    // Lead ID must be passed for tracking
    expect(callArgs.leadId).toBe("test-lead-uuid");

    // Variables must include required fields
    expect(callArgs.variables.first_name).toBe("Test");
    expect(callArgs.variables.company_name).toBe("Test Company");
  });

  /**
   * STATIC CODE CHECK: Verify NotificationQueueService import exists in route file
   *
   * This is a meta-test that checks the actual source code to ensure
   * the notification queue code was not accidentally removed.
   */
  it("MUST have NotificationQueueService import in demo-leads route", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const routePath = path.join(process.cwd(), "app/api/demo-leads/route.ts");

    const routeContent = fs.readFileSync(routePath, "utf-8");

    // Check for critical imports and function calls (queue-based architecture)
    expect(routeContent).toContain("NotificationQueueService");
    expect(routeContent).toContain("queueNotification");
    expect(routeContent).toContain("lead_confirmation");
    expect(routeContent).toContain("expansion_opportunity");
    expect(routeContent).toContain("idempotencyKey"); // Prevents duplicates
  });
});

/**
 * V6.2.2: Book Demo Wizard - Step 1 Email Verification
 *
 * Tests for the wizard_step1 mode which:
 * - Accepts email only
 * - Creates minimal lead
 * - Sends 6-digit verification code
 */
describe("V6.2.2: Book Demo Wizard - wizard_step1 mode", () => {
  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest(
      `${process.env.TEST_API_URL || "http://test.local:3000"}/api/demo-leads`,
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should send verification code for new email", async () => {
    // No existing lead
    mockFindFirst.mockResolvedValue(null);

    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      mode: "wizard_step1",
      email: "newuser@test.local",
      locale: "en",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.leadId).toBe("wizard-lead-uuid");
    expect(data.requiresVerification).toBe(true);
    expect(data.expiresAt).toBeDefined();
  });

  it("should return alreadyVerified for verified email", async () => {
    // Existing lead with verified email
    mockFindFirst.mockResolvedValue({
      id: "existing-lead-uuid",
      email_verified: true,
      status: "qualified",
    });

    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      mode: "wizard_step1",
      email: "verified@test.local",
      locale: "en",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.alreadyVerified).toBe(true);
    expect(data.leadId).toBe("existing-lead-uuid");
  });

  it("should reject converted lead", async () => {
    // Existing lead that is converted
    mockFindFirst.mockResolvedValue({
      id: "converted-lead-uuid",
      email_verified: true,
      status: "converted",
    });

    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      mode: "wizard_step1",
      email: "converted@test.local",
      locale: "en",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("ALREADY_CONVERTED");
  });

  it("should reject invalid email format", async () => {
    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      mode: "wizard_step1",
      email: "not-an-email",
      locale: "en",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  it("should reject wizard_step1 without email", async () => {
    const { POST } = await import("@/app/api/demo-leads/route");

    const request = createMockRequest({
      mode: "wizard_step1",
      // Missing email
      locale: "en",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });

  /**
   * STATIC CODE CHECK: Verify wizard_step1 mode exists in route file
   */
  it("MUST have wizard_step1 handler in demo-leads route", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");

    const routePath = path.join(process.cwd(), "app/api/demo-leads/route.ts");
    const routeContent = fs.readFileSync(routePath, "utf-8");

    // Check for wizard_step1 mode handling
    expect(routeContent).toContain("wizard_step1");
    expect(routeContent).toContain("EmailVerificationService");
    expect(routeContent).toContain("sendVerificationCode");
    expect(routeContent).toContain("requiresVerification");
    expect(routeContent).toContain("ALREADY_CONVERTED");
    expect(routeContent).toContain("RATE_LIMITED");
  });
});
