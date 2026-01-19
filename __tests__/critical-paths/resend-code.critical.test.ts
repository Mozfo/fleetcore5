/**
 * CRITICAL PATH TEST - V6.2.2 Resend Verification Code
 *
 * Book Demo Wizard - Resend 6-digit code
 *
 * Tests for POST /api/crm/leads/resend-code
 *
 * Business Impact: Users cannot request new codes if resend fails
 *
 * SECURITY REQUIREMENTS:
 * - Must return 400 (not 404) for non-existent leads to prevent enumeration
 * - Must enforce 60-second cooldown between resends
 * - Must not reveal lead existence in error messages
 *
 * @module __tests__/critical-paths/resend-code.critical.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Test constants
const TEST_API_URL = process.env.TEST_API_URL || "http://test.local:3000";
const VALID_LEAD_ID = "123e4567-e89b-12d3-a456-426614174000";

// Mock Prisma
const mockFindFirst = vi.fn();

const mockPrismaClient = {
  crm_leads: {
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    update: vi.fn(),
    create: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  db: mockPrismaClient,
  prisma: mockPrismaClient,
}));

// Mock EmailVerificationService
// V6.4: Updated to use leadId-based methods
const mockCanResendCodeByLeadId = vi.fn();
const mockSendVerificationCodeToLead = vi.fn();

vi.mock("@/lib/services/crm/email-verification.service", () => ({
  EmailVerificationService: vi.fn().mockImplementation(() => ({
    canResendCodeByLeadId: mockCanResendCodeByLeadId,
    sendVerificationCodeToLead: mockSendVerificationCodeToLead,
  })),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CRITICAL: Resend Verification Code Endpoint (V6.2.2)", () => {
  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest(`${TEST_API_URL}/api/crm/leads/resend-code`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
  };

  const MOCK_LEAD = {
    id: VALID_LEAD_ID,
    email: "test@example.com",
    email_verified: false,
  };

  const FUTURE_EXPIRY = new Date(Date.now() + 15 * 60 * 1000);

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(MOCK_LEAD);
    mockCanResendCodeByLeadId.mockResolvedValue({ canResend: true });
    mockSendVerificationCodeToLead.mockResolvedValue({
      success: true,
      leadId: VALID_LEAD_ID,
      expiresAt: FUTURE_EXPIRY,
    });
  });

  // ==========================================
  // SUCCESS CASES
  // ==========================================

  describe("Success Cases", () => {
    it("should resend verification code successfully", async () => {
      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.expiresAt).toBeDefined();
      expect(data.message).toBe("Verification code sent");

      // Verify service calls (V6.4: uses leadId-based methods)
      expect(mockCanResendCodeByLeadId).toHaveBeenCalledWith(VALID_LEAD_ID);
      expect(mockSendVerificationCodeToLead).toHaveBeenCalledWith({
        leadId: VALID_LEAD_ID,
        email: "test@example.com",
        locale: "en",
      });
    });

    it("should pass locale to sendVerificationCodeToLead", async () => {
      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        locale: "fr",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // V6.4: uses leadId-based method with leadId, email, and locale
      expect(mockSendVerificationCodeToLead).toHaveBeenCalledWith({
        leadId: VALID_LEAD_ID,
        email: "test@example.com",
        locale: "fr",
      });
    });
  });

  // ==========================================
  // VALIDATION ERRORS
  // ==========================================

  describe("Validation Errors", () => {
    it("should reject invalid leadId format", async () => {
      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: "not-a-uuid",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.leadId).toBeDefined();
    });

    it("should reject missing leadId", async () => {
      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({});

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ==========================================
  // COOLDOWN / RATE LIMITING
  // ==========================================

  describe("Cooldown / Rate Limiting", () => {
    it("should return 429 with cooldownSeconds when cooldown active", async () => {
      mockCanResendCodeByLeadId.mockResolvedValue({
        canResend: false,
        waitSeconds: 45,
        lastSentAt: new Date(),
      });

      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RATE_LIMITED");
      expect(data.error.cooldownSeconds).toBe(45);

      // Should NOT call sendVerificationCodeToLead
      expect(mockSendVerificationCodeToLead).not.toHaveBeenCalled();
    });

    it("should return 429 if service returns rate_limited", async () => {
      mockSendVerificationCodeToLead.mockResolvedValue({
        success: false,
        error: "rate_limited",
        retryAfter: 30,
      });

      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RATE_LIMITED");
      expect(data.error.cooldownSeconds).toBe(30);
    });
  });

  // ==========================================
  // ALREADY VERIFIED
  // ==========================================

  describe("Already Verified", () => {
    it("should return error if email is already verified", async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_LEAD,
        email_verified: true,
      });

      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("ALREADY_VERIFIED");

      // Should NOT call canResendCodeByLeadId or sendVerificationCodeToLead
      expect(mockCanResendCodeByLeadId).not.toHaveBeenCalled();
      expect(mockSendVerificationCodeToLead).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // SECURITY TESTS - CRITICAL
  // ==========================================

  describe("SECURITY: Enumeration Attack Prevention", () => {
    /**
     * CRITICAL SECURITY TEST
     * Must return 400 (not 404) for non-existent lead to prevent enumeration attacks.
     */
    it("MUST return 400 (not 404) for non-existent lead - NEVER SKIP", async () => {
      mockFindFirst.mockResolvedValue(null);

      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      // SECURITY: Must return 400, NOT 404
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RESEND_FAILED");

      // Should NOT reveal that lead doesn't exist
      expect(data.error.message).not.toContain("not found");
      expect(data.error.message).not.toContain("exist");
    });
  });

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  describe("Error Handling", () => {
    it("should return 500 for unexpected service error", async () => {
      mockSendVerificationCodeToLead.mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const { POST } = await import("@/app/api/crm/leads/resend-code/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("RESEND_FAILED");
    });
  });

  // ==========================================
  // STATIC CODE CHECKS
  // ==========================================

  describe("Static Code Checks", () => {
    it("MUST have security measures in route file", async () => {
      const fs = await import("node:fs");
      const path = await import("node:path");

      const routePath = path.join(
        process.cwd(),
        "app/api/crm/leads/resend-code/route.ts"
      );

      const routeContent = fs.readFileSync(routePath, "utf-8");

      // Check for security patterns
      expect(routeContent).toContain("SECURITY");
      expect(routeContent).toContain("enumeration");
      expect(routeContent).toContain("EmailVerificationService");
      // V6.4: Updated to check for leadId-based method names
      expect(routeContent).toContain("canResendCodeByLeadId");
      expect(routeContent).toContain("sendVerificationCodeToLead");
      expect(routeContent).toContain("RESEND_FAILED");
      expect(routeContent).toContain("RATE_LIMITED");
      expect(routeContent).toContain("ALREADY_VERIFIED");
    });
  });
});
