/**
 * VerificationService - Unit Tests V6.2-8b
 *
 * Tests for customer verification after Stripe checkout.
 *
 * @module lib/services/billing/__tests__/verification.service.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { VerificationService } from "../verification.service";
import { prisma } from "@/lib/prisma";
import { authService } from "@/lib/services/auth/auth.service";
import { CGI_VERSION } from "@/lib/validators/billing/verification.validators";
import { Prisma } from "@prisma/client";

// ===== MOCKS =====

vi.mock("@/lib/prisma", () => ({
  prisma: {
    adm_tenants: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    clt_masterdata: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}));

vi.mock("@/lib/services/auth/auth.service", () => ({
  authService: {
    inviteAdmin: vi.fn(),
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// ===== TEST DATA =====

const mockToken = "abc123def456ghi789jkl012mno345pqr678stu901vwx234yz";

const mockTenantValid = {
  id: "tenant-uuid-123",
  name: "Test Company",
  tenant_code: "C-ABC123",
  verification_token: mockToken,
  verification_token_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
  verification_completed_at: null,
  auth_organization_id: "org_auth_123",
};

const mockTenantExpired = {
  ...mockTenantValid,
  verification_token_expires_at: new Date(Date.now() - 1000), // 1 second ago
};

const mockTenantAlreadyVerified = {
  ...mockTenantValid,
  verification_completed_at: new Date(), // Already verified
};

const mockVerificationInput = {
  token: mockToken,
  company_legal_name: "Test Company Legal",
  company_siret: "12345678901234",
  company_address: {
    street: "123 Main St",
    city: "Paris",
    postal_code: "75001",
    country: "FR",
  },
  admin_name: "John Doe",
  admin_email: "admin@testcompany.com",
  cgi_accepted: true as const,
};

const mockClientIp = "192.168.1.100";

// ===== TEST SUITES =====

describe("VerificationService", () => {
  let service: VerificationService;

  beforeEach(() => {
    service = VerificationService.getInstance();
    vi.clearAllMocks();

    // Reset $transaction to default behavior
    vi.mocked(prisma.$transaction).mockImplementation((fn) =>
      fn(prisma as never)
    );

    // Default mock implementations
    vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(
      mockTenantValid as never
    );
    vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue(
      mockTenantValid as never
    );
    vi.mocked(prisma.adm_tenants.update).mockResolvedValue({} as never);
    vi.mocked(prisma.clt_masterdata.updateMany).mockResolvedValue({
      count: 1,
    } as never);
    vi.mocked(authService.inviteAdmin).mockResolvedValue({
      success: true,
      invitationId: "inv_123",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // SUITE 1: Token Validation
  // ============================================

  describe("validateToken", () => {
    it("should return valid=true for a valid token", async () => {
      const result = await service.validateToken(mockToken);

      expect(result.valid).toBe(true);
      expect(result.tenantId).toBe("tenant-uuid-123");
      expect(result.tenantName).toBe("Test Company");
      expect(result.tenantCode).toBe("C-ABC123");
    });

    it("should return valid=false for non-existent token", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(null);

      const result = await service.validateToken("invalid-token");

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe("TOKEN_INVALID");
    });

    it("should return valid=false and expired=true for expired token", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(
        mockTenantExpired as never
      );

      const result = await service.validateToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.expired).toBe(true);
      expect(result.errorCode).toBe("TOKEN_EXPIRED");
    });

    it("should return valid=false and alreadyVerified=true for used token", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(
        mockTenantAlreadyVerified as never
      );

      const result = await service.validateToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.alreadyVerified).toBe(true);
      expect(result.errorCode).toBe("TOKEN_ALREADY_USED");
    });

    it("should handle database errors gracefully", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockRejectedValue(
        new Error("Database error")
      );

      const result = await service.validateToken(mockToken);

      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe("DATABASE_ERROR");
    });
  });

  // ============================================
  // SUITE 2: Verification Submission
  // ============================================

  describe("submitVerification", () => {
    it("should successfully verify and update tenant", async () => {
      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(true);
      expect(result.tenantId).toBe("tenant-uuid-123");
      expect(result.tenantCode).toBe("C-ABC123");
    });

    it("should update adm_tenants with admin info and CGI tracking", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tenant-uuid-123" },
          data: expect.objectContaining({
            admin_name: "John Doe",
            admin_email: "admin@testcompany.com",
            cgi_accepted_ip: mockClientIp,
            cgi_version: CGI_VERSION,
            verification_token: null, // Token cleared after use
          }),
        })
      );
    });

    it("should update clt_masterdata with company legal info", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.clt_masterdata.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant_id: "tenant-uuid-123" },
          data: expect.objectContaining({
            legal_name: "Test Company Legal",
            tax_id: "12345678901234",
            billing_address: mockVerificationInput.company_address,
          }),
        })
      );
    });

    it("should invite admin via AuthService", async () => {
      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(authService.inviteAdmin).toHaveBeenCalledWith({
        organizationId: "org_auth_123",
        email: "admin@testcompany.com",
        name: "John Doe",
        role: "org:provider_admin",
      });
      expect(result.adminInvitationSent).toBe(true);
    });

    it("should update admin_invited_at after successful invitation", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      // Second update call is for admin_invited_at
      expect(prisma.adm_tenants.update).toHaveBeenCalledTimes(2);
      expect(prisma.adm_tenants.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          where: { id: "tenant-uuid-123" },
          data: { admin_invited_at: expect.any(Date) },
        })
      );
    });

    it("should continue if invitation fails", async () => {
      vi.mocked(authService.inviteAdmin).mockResolvedValue({
        success: false,
        error: "Auth API error",
      });

      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(true);
      expect(result.adminInvitationSent).toBe(false);
    });

    it("should skip invitation if no organization ID", async () => {
      vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
        ...mockTenantValid,
        auth_organization_id: null,
      } as never);

      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(true);
      expect(authService.inviteAdmin).not.toHaveBeenCalled();
    });

    it("should fail if token is invalid", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(null);

      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TOKEN_INVALID");
    });

    it("should fail if token is expired", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(
        mockTenantExpired as never
      );

      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("TOKEN_EXPIRED");
    });

    it("should handle null company_address gracefully", async () => {
      const inputWithoutAddress = {
        ...mockVerificationInput,
        company_address: null as unknown as {
          street: string;
          city: string;
          postal_code: string;
          country: string;
        },
      };

      await service.submitVerification(inputWithoutAddress, mockClientIp);

      expect(prisma.clt_masterdata.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            billing_address: Prisma.JsonNull,
          }),
        })
      );
    });

    it("should handle database transaction errors", async () => {
      vi.mocked(prisma.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      );

      const result = await service.submitVerification(
        mockVerificationInput,
        mockClientIp
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe("DATABASE_ERROR");
    });
  });

  // ============================================
  // SUITE 3: Helper Methods
  // ============================================

  describe("getTenantByToken", () => {
    it("should return tenant info for valid token", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue({
        id: "tenant-uuid-123",
        name: "Test Company",
        tenant_code: "C-ABC123",
      } as never);

      const result = await service.getTenantByToken(mockToken);

      expect(result).toEqual({
        id: "tenant-uuid-123",
        name: "Test Company",
        tenantCode: "C-ABC123",
      });
    });

    it("should return null for invalid token", async () => {
      vi.mocked(prisma.adm_tenants.findFirst).mockResolvedValue(null);

      const result = await service.getTenantByToken("invalid-token");

      expect(result).toBeNull();
    });
  });

  describe("needsVerification", () => {
    it("should return true for tenant needing verification", async () => {
      vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
        verification_completed_at: null,
        verification_token: mockToken,
      } as never);

      const result = await service.needsVerification("tenant-uuid-123");

      expect(result).toBe(true);
    });

    it("should return false for already verified tenant", async () => {
      vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
        verification_completed_at: new Date(),
        verification_token: null,
      } as never);

      const result = await service.needsVerification("tenant-uuid-123");

      expect(result).toBe(false);
    });

    it("should return false for tenant without token", async () => {
      vi.mocked(prisma.adm_tenants.findUnique).mockResolvedValue({
        verification_completed_at: null,
        verification_token: null,
      } as never);

      const result = await service.needsVerification("tenant-uuid-123");

      expect(result).toBe(false);
    });
  });

  // ============================================
  // SUITE 4: CGI/CGU Tracking
  // ============================================

  describe("CGI/CGU Tracking", () => {
    it("should store CGI version correctly", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cgi_version: CGI_VERSION,
          }),
        })
      );
    });

    it("should store client IP for CGI acceptance", async () => {
      const clientIp = "203.0.113.42";
      await service.submitVerification(mockVerificationInput, clientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cgi_accepted_ip: clientIp,
          }),
        })
      );
    });

    it("should set cgi_accepted_at timestamp", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cgi_accepted_at: expect.any(Date),
          }),
        })
      );
    });
  });

  // ============================================
  // SUITE 5: Token Security
  // ============================================

  describe("Token Security", () => {
    it("should clear verification_token after successful verification", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verification_token: null,
          }),
        })
      );
    });

    it("should set verification_completed_at after successful verification", async () => {
      await service.submitVerification(mockVerificationInput, mockClientIp);

      expect(prisma.adm_tenants.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            verification_completed_at: expect.any(Date),
          }),
        })
      );
    });
  });
});
