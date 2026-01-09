import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  EmailVerificationService,
  VERIFICATION_CONSTANTS,
} from "../email-verification.service";
import { prisma } from "@/lib/prisma";

// Hoisted mocks for modules
const {
  mockRandomInt,
  mockQueueNotification,
  mockBcryptHash,
  mockBcryptCompare,
} = vi.hoisted(() => {
  const queueNotificationFn = vi.fn().mockResolvedValue({
    success: true,
    queueId: "queue-uuid-1",
  });

  return {
    mockRandomInt: vi.fn().mockReturnValue(123456),
    mockQueueNotification: queueNotificationFn,
    mockBcryptHash: vi.fn().mockResolvedValue("hashed_code_123456"),
    mockBcryptCompare: vi.fn(),
  };
});

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    crm_leads: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    adm_notification_queue: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock NotificationQueueService - must use function syntax for class constructor
vi.mock("@/lib/services/notification/queue.service", () => {
  return {
    NotificationQueueService: function () {
      return {
        queueNotification: mockQueueNotification,
      };
    },
  };
});

// Mock crypto
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomInt: mockRandomInt,
  };
});

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: mockBcryptHash,
    compare: mockBcryptCompare,
  },
}));

describe("EmailVerificationService", () => {
  let service: EmailVerificationService;

  const mockLead = {
    id: "lead-uuid-123",
    email: "test@example.com",
    status: "new",
    email_verified: false,
    email_verification_code: null,
    email_verification_expires_at: null,
    email_verification_attempts: 0,
    // V6.2.6: Attendance Confirmation columns
    confirmation_token: null,
    attendance_confirmed: false,
    attendance_confirmed_at: null,
  };

  const mockLeadWithCode = {
    ...mockLead,
    email_verification_code: "hashed_code_123456",
    email_verification_expires_at: new Date(Date.now() + 15 * 60 * 1000), // 15 min in future
    email_verification_attempts: 0,
  };

  beforeEach(() => {
    service = new EmailVerificationService();

    // Reset all mocks
    vi.clearAllMocks();

    // Reset hoisted mocks to default values
    mockRandomInt.mockReturnValue(123456);
    mockBcryptHash.mockResolvedValue("hashed_code_123456");
    mockBcryptCompare.mockResolvedValue(false);
    mockQueueNotification.mockResolvedValue({
      success: true,
      queueId: "queue-uuid-1",
    });

    // Default mock implementations for prisma
    vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.crm_leads.create).mockResolvedValue(mockLead as never);
    vi.mocked(prisma.crm_leads.update).mockResolvedValue(mockLead as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===== SUITE 1: Constants (1 test) =====

  describe("Constants", () => {
    it("should export verification constants", () => {
      expect(VERIFICATION_CONSTANTS.CODE_LENGTH).toBe(6);
      expect(VERIFICATION_CONSTANTS.BCRYPT_COST).toBe(10);
      expect(VERIFICATION_CONSTANTS.CODE_EXPIRATION_MINUTES).toBe(15);
      expect(VERIFICATION_CONSTANTS.RESEND_COOLDOWN_SECONDS).toBe(60);
      expect(VERIFICATION_CONSTANTS.MAX_VERIFICATION_ATTEMPTS).toBe(5);
    });
  });

  // ===== SUITE 2: Code Generation (4 tests) =====

  describe("Code Generation", () => {
    it("should generate a 6-digit code", () => {
      const code = service.generateCode();

      expect(code).toHaveLength(6);
      expect(mockRandomInt).toHaveBeenCalledWith(0, 1000000);
    });

    it("should pad code with leading zeros", () => {
      mockRandomInt.mockReturnValueOnce(42);

      const code = service.generateCode();

      expect(code).toBe("000042");
      expect(code).toHaveLength(6);
    });

    it("should generate different codes on each call", () => {
      mockRandomInt
        .mockReturnValueOnce(111111)
        .mockReturnValueOnce(222222)
        .mockReturnValueOnce(333333);

      const code1 = service.generateCode();
      const code2 = service.generateCode();
      const code3 = service.generateCode();

      expect(code1).toBe("111111");
      expect(code2).toBe("222222");
      expect(code3).toBe("333333");
    });

    it("should use crypto.randomInt for security (not Math.random)", () => {
      service.generateCode();

      expect(mockRandomInt).toHaveBeenCalled();
    });
  });

  // ===== SUITE 3: Code Hashing (3 tests) =====

  describe("Code Hashing", () => {
    it("should hash code with bcrypt cost 10", async () => {
      const hash = await service.hashCode("123456");

      expect(mockBcryptHash).toHaveBeenCalledWith("123456", 10);
      expect(hash).toBe("hashed_code_123456");
    });

    it("should compare code against hash", async () => {
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.compareCode("123456", "hashed_code_123456");

      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "123456",
        "hashed_code_123456"
      );
      expect(result).toBe(true);
    });

    it("should return false for invalid code comparison", async () => {
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.compareCode("000000", "hashed_code_123456");

      expect(result).toBe(false);
    });
  });

  // ===== SUITE 4: Resend Cooldown (4 tests) =====

  describe("Resend Cooldown", () => {
    it("should allow resend if no lead exists", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const result = await service.canResendCode("new@example.com");

      expect(result.canResend).toBe(true);
      expect(result.waitSeconds).toBeUndefined();
    });

    it("should allow resend if no code was sent", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        email_verification_expires_at: null,
      } as never);

      const result = await service.canResendCode("test@example.com");

      expect(result.canResend).toBe(true);
    });

    it("should block resend within 60 second cooldown", async () => {
      // Code was sent 30 seconds ago (expires in 14.5 minutes)
      const sentAt = new Date(Date.now() - 30 * 1000);
      const expiresAt = new Date(sentAt.getTime() + 15 * 60 * 1000);

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        email_verification_expires_at: expiresAt,
      } as never);

      const result = await service.canResendCode("test@example.com");

      expect(result.canResend).toBe(false);
      expect(result.waitSeconds).toBeGreaterThan(0);
      expect(result.waitSeconds).toBeLessThanOrEqual(30);
    });

    it("should allow resend after 60 second cooldown", async () => {
      // Code was sent 90 seconds ago (expires in 13.5 minutes)
      const sentAt = new Date(Date.now() - 90 * 1000);
      const expiresAt = new Date(sentAt.getTime() + 15 * 60 * 1000);

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        email_verification_expires_at: expiresAt,
      } as never);

      const result = await service.canResendCode("test@example.com");

      expect(result.canResend).toBe(true);
      expect(result.lastSentAt).toBeDefined();
    });
  });

  // ===== SUITE 5: Send Verification Code (6 tests) =====

  describe("Send Verification Code", () => {
    it("should create new lead if none exists", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const result = await service.sendVerificationCode({
        email: "new@example.com",
        locale: "fr",
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBeDefined();
      expect(prisma.crm_leads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new@example.com",
            status: "new",
            email_verified: false,
            email_verification_code: "hashed_code_123456",
            email_verification_attempts: 0,
          }),
        })
      );
    });

    it("should update existing lead with new code", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(
        mockLead as never
      );

      const result = await service.sendVerificationCode({
        email: "test@example.com",
      });

      expect(result.success).toBe(true);
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockLead.id },
          data: expect.objectContaining({
            email_verification_code: "hashed_code_123456",
            email_verification_attempts: 0, // Reset attempts
          }),
        })
      );
    });

    it("should return rate_limited error if cooldown not passed", async () => {
      // Code was sent 10 seconds ago
      const sentAt = new Date(Date.now() - 10 * 1000);
      const expiresAt = new Date(sentAt.getTime() + 15 * 60 * 1000);

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLead,
        email_verification_expires_at: expiresAt,
      } as never);

      const result = await service.sendVerificationCode({
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("rate_limited");
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it("should queue email notification", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      await service.sendVerificationCode({
        email: "test@example.com",
        locale: "fr",
      });

      expect(mockQueueNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          templateCode: "email_verification_code",
          recipientEmail: "test@example.com",
          locale: "fr",
          variables: expect.objectContaining({
            verification_code: "123456",
            expires_in_minutes: 15,
          }),
        })
      );
    });

    it("should set expiration 15 minutes from now", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const beforeCall = Date.now();
      const result = await service.sendVerificationCode({
        email: "test@example.com",
      });
      const afterCall = Date.now();

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();

      if (result.expiresAt) {
        const expiresTime = result.expiresAt.getTime();
        const expectedMin = beforeCall + 15 * 60 * 1000;
        const expectedMax = afterCall + 15 * 60 * 1000;

        expect(expiresTime).toBeGreaterThanOrEqual(expectedMin);
        expect(expiresTime).toBeLessThanOrEqual(expectedMax);
      }
    });

    it("should default locale to 'en'", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      await service.sendVerificationCode({
        email: "test@example.com",
        // No locale specified
      });

      expect(mockQueueNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          locale: "en",
        })
      );
    });
  });

  // ===== SUITE 6: Verify Code (8 tests) =====

  describe("Verify Code", () => {
    it("should return lead_not_found for unknown email", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const result = await service.verifyCode({
        email: "unknown@example.com",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("lead_not_found");
    });

    it("should return success if already verified", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLead,
        email_verified: true,
      } as never);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe(mockLead.id);
    });

    it("should return no_code_pending if no code exists", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLead,
        email_verification_code: null,
      } as never);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("no_code_pending");
    });

    it("should return max_attempts_exceeded after 5 failed attempts", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLeadWithCode,
        email_verification_attempts: 5,
      } as never);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("max_attempts_exceeded");
      expect(result.attemptsRemaining).toBe(0);
      expect(result.locked).toBe(true);
    });

    it("should return code_expired if code has expired", async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLeadWithCode,
        email_verification_expires_at: expiredDate,
      } as never);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("code_expired");
    });

    it("should increment attempts on invalid code", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(
        mockLeadWithCode as never
      );
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "000000", // Wrong code
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_code");
      expect(result.attemptsRemaining).toBe(4); // 5 - 1
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email_verification_attempts: 1,
          }),
        })
      );
    });

    it("should verify email and clear code on success", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(
        mockLeadWithCode as never
      );
      mockBcryptCompare.mockResolvedValue(true);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(true);
      expect(result.leadId).toBe(mockLead.id);
      expect(prisma.crm_leads.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email_verified: true,
            email_verification_code: null,
            email_verification_expires_at: null,
            email_verification_attempts: 0,
          }),
        })
      );
    });

    it("should lock account after 5th failed attempt", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        ...mockLeadWithCode,
        email_verification_attempts: 4, // One more attempt will lock
      } as never);
      mockBcryptCompare.mockResolvedValue(false);

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "000000",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("invalid_code");
      expect(result.attemptsRemaining).toBe(0);
      expect(result.locked).toBe(true);
    });
  });

  // ===== SUITE 7: Verification Status (3 tests) =====

  describe("Verification Status", () => {
    it("should return null for non-existent lead", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      const status = await service.getVerificationStatus("unknown@example.com");

      expect(status).toBeNull();
    });

    it("should return verified status", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        email_verified: true,
        email_verification_code: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
      } as never);

      const status = await service.getVerificationStatus("test@example.com");

      expect(status?.exists).toBe(true);
      expect(status?.verified).toBe(true);
      expect(status?.hasPendingCode).toBe(false);
    });

    it("should return pending code status", async () => {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min in future

      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue({
        email_verified: false,
        email_verification_code: "hashed",
        email_verification_expires_at: expiresAt,
        email_verification_attempts: 2,
      } as never);

      const status = await service.getVerificationStatus("test@example.com");

      expect(status?.exists).toBe(true);
      expect(status?.verified).toBe(false);
      expect(status?.hasPendingCode).toBe(true);
      expect(status?.attemptsRemaining).toBe(3); // 5 - 2
      expect(status?.expiresAt).toEqual(expiresAt);
    });
  });

  // ===== SUITE 8: Clear Verification State (2 tests) =====

  describe("Clear Verification State", () => {
    it("should clear all verification fields", async () => {
      await service.clearVerificationState("lead-uuid-123");

      expect(prisma.crm_leads.update).toHaveBeenCalledWith({
        where: { id: "lead-uuid-123" },
        data: {
          email_verification_code: null,
          email_verification_expires_at: null,
          email_verification_attempts: 0,
          updated_at: expect.any(Date),
        },
      });
    });

    it("should be used for admin reset functionality", async () => {
      // Simulate admin clearing a locked account
      await service.clearVerificationState("lead-uuid-123");

      // Lead can now request a new code
      expect(prisma.crm_leads.update).toHaveBeenCalled();
    });
  });

  // ===== SUITE 9: Email Case Insensitivity (2 tests) =====

  describe("Email Case Insensitivity", () => {
    it("should find lead with case insensitive email", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(
        mockLead as never
      );

      await service.sendVerificationCode({
        email: "TEST@EXAMPLE.COM",
      });

      expect(prisma.crm_leads.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            email: { equals: "TEST@EXAMPLE.COM", mode: "insensitive" },
          }),
        })
      );
    });

    it("should normalize email to lowercase on create", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockResolvedValue(null);

      await service.sendVerificationCode({
        email: "NEW@EXAMPLE.COM",
      });

      expect(prisma.crm_leads.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "new@example.com", // Normalized
          }),
        })
      );
    });
  });

  // ===== SUITE 10: Error Handling (2 tests) =====

  describe("Error Handling", () => {
    it("should handle database errors in sendVerificationCode", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await service.sendVerificationCode({
        email: "test@example.com",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
    });

    it("should handle database errors in verifyCode", async () => {
      vi.mocked(prisma.crm_leads.findFirst).mockRejectedValue(
        new Error("Query timeout")
      );

      const result = await service.verifyCode({
        email: "test@example.com",
        code: "123456",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Query timeout");
    });
  });
});
