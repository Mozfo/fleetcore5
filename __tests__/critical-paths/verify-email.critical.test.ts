/**
 * CRITICAL PATH TEST - V6.2.2 Email Verification
 *
 * Book Demo Wizard - Step 1 Code Verification
 *
 * Tests for POST /api/crm/leads/verify-email
 *
 * Business Impact: Users cannot complete demo booking if verification fails
 *
 * SECURITY REQUIREMENTS:
 * - Must return 400 (not 404) for non-existent leads to prevent enumeration
 * - Must not reveal lead existence in error messages
 * - Must track failed attempts for lockout
 *
 * @module __tests__/critical-paths/verify-email.critical.test
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Test constants
const TEST_API_URL = process.env.TEST_API_URL || "http://test.local:3000";
const VALID_LEAD_ID = "123e4567-e89b-12d3-a456-426614174000";
const VALID_CODE = "123456";

// Mock Prisma
const mockFindFirst = vi.fn();

const mockPrismaClient = {
  crm_leads: {
    findFirst: (...args: unknown[]) => mockFindFirst(...args),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({
  db: mockPrismaClient,
  prisma: mockPrismaClient,
}));

// Mock EmailVerificationService
const mockVerifyCode = vi.fn();
vi.mock("@/lib/services/crm/email-verification.service", () => ({
  EmailVerificationService: vi.fn().mockImplementation(() => ({
    verifyCode: mockVerifyCode,
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

describe("CRITICAL: Verify Email Code Endpoint (V6.2.2)", () => {
  const createMockRequest = (body: Record<string, unknown>) => {
    return new NextRequest(`${TEST_API_URL}/api/crm/leads/verify-email`, {
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

  beforeEach(() => {
    vi.clearAllMocks();
    mockFindFirst.mockResolvedValue(MOCK_LEAD);
  });

  // ==========================================
  // SUCCESS CASES
  // ==========================================

  describe("Success Cases", () => {
    it("should verify code successfully and return redirect URL", async () => {
      mockVerifyCode.mockResolvedValue({
        success: true,
        leadId: VALID_LEAD_ID,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.verified).toBe(true);
      expect(data.data.redirectUrl).toContain("/book-demo/step-2");
      expect(data.data.redirectUrl).toContain(`leadId=${VALID_LEAD_ID}`);
    });

    it("should return success if email is already verified", async () => {
      mockFindFirst.mockResolvedValue({
        ...MOCK_LEAD,
        email_verified: true,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.verified).toBe(true);
      expect(data.data.alreadyVerified).toBe(true);
      // verifyCode should NOT be called since already verified
      expect(mockVerifyCode).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // VALIDATION ERRORS
  // ==========================================

  describe("Validation Errors", () => {
    it("should reject invalid leadId format", async () => {
      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: "not-a-uuid",
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.leadId).toBeDefined();
    });

    it("should reject code with letters", async () => {
      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: "12345a",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
      expect(data.error.details.code).toBeDefined();
    });

    it("should reject code with wrong length", async () => {
      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: "12345", // Only 5 digits
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject missing leadId", async () => {
      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject missing code", async () => {
      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VALIDATION_ERROR");
    });
  });

  // ==========================================
  // VERIFICATION ERRORS
  // ==========================================

  describe("Verification Errors", () => {
    it("should return INVALID_CODE with attemptsRemaining", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        leadId: VALID_LEAD_ID,
        error: "invalid_code",
        attemptsRemaining: 3,
        locked: false,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: "000000",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("INVALID_CODE");
      expect(data.error.attemptsRemaining).toBe(3);
    });

    it("should return EXPIRED for expired code", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        leadId: VALID_LEAD_ID,
        error: "code_expired",
        attemptsRemaining: 5,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("EXPIRED");
      expect(data.error.message).toContain("expired");
    });

    it("should return MAX_ATTEMPTS (429) when locked", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        leadId: VALID_LEAD_ID,
        error: "invalid_code",
        attemptsRemaining: 0,
        locked: true,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: "000000",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("MAX_ATTEMPTS");
    });

    it("should return MAX_ATTEMPTS (429) for max_attempts_exceeded", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        leadId: VALID_LEAD_ID,
        error: "max_attempts_exceeded",
        attemptsRemaining: 0,
        locked: true,
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: "000000",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("MAX_ATTEMPTS");
    });

    it("should return NO_CODE_PENDING when no code exists", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        leadId: VALID_LEAD_ID,
        error: "no_code_pending",
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("NO_CODE_PENDING");
    });
  });

  // ==========================================
  // SECURITY TESTS - CRITICAL
  // ==========================================

  describe("SECURITY: Enumeration Attack Prevention", () => {
    /**
     * CRITICAL SECURITY TEST
     * Must return 400 (not 404) for non-existent lead to prevent enumeration attacks.
     * This prevents attackers from discovering valid lead IDs.
     */
    it("MUST return 400 (not 404) for non-existent lead - NEVER SKIP", async () => {
      mockFindFirst.mockResolvedValue(null);

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      // SECURITY: Must return 400, NOT 404, to prevent enumeration
      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe("VERIFICATION_FAILED");
      // Should NOT reveal that lead doesn't exist
      expect(data.error.message).not.toContain("not found");
      expect(data.error.message).not.toContain("exist");
    });

    it("should return generic error for lead_not_found from service", async () => {
      mockVerifyCode.mockResolvedValue({
        success: false,
        error: "lead_not_found",
      });

      const { POST } = await import("@/app/api/crm/leads/verify-email/route");

      const request = createMockRequest({
        leadId: VALID_LEAD_ID,
        code: VALID_CODE,
      });

      const response = await POST(request);
      const data = await response.json();

      // SECURITY: Generic error, no information leak
      expect(response.status).toBe(400);
      expect(data.error.code).toBe("VERIFICATION_FAILED");
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
        "app/api/crm/leads/verify-email/route.ts"
      );

      const routeContent = fs.readFileSync(routePath, "utf-8");

      // Check for security patterns
      expect(routeContent).toContain("SECURITY");
      expect(routeContent).toContain("enumeration");
      expect(routeContent).toContain("EmailVerificationService");
      expect(routeContent).toContain("verifyCode");
      expect(routeContent).toContain("VERIFICATION_FAILED");
    });
  });
});
