/**
 * Email Verification Service - V6.2.2
 * Book Demo Wizard - Step 1 Email Verification
 *
 * Handles 6-digit verification code generation, hashing, validation,
 * and email sending for the Book Demo wizard flow.
 *
 * Features:
 * - 6-digit NUMERIC code (crypto.randomInt for security)
 * - bcrypt hashing (cost 10)
 * - 15 minute expiration
 * - 60 second resend cooldown
 * - Max 5 verification attempts
 *
 * @module lib/services/crm/email-verification.service
 */

import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { logger } from "@/lib/logger";

// ===== CONSTANTS =====

/** Number of digits in verification code */
const CODE_LENGTH = 6;

/** bcrypt cost factor */
const BCRYPT_COST = 10;

/** Code expiration in minutes */
const CODE_EXPIRATION_MINUTES = 15;

/** Minimum seconds between resend requests */
const RESEND_COOLDOWN_SECONDS = 60;

/** Maximum verification attempts before lockout */
const MAX_VERIFICATION_ATTEMPTS = 5;

// ===== TYPES & INTERFACES =====

/**
 * Result from sendVerificationCode
 */
export interface SendVerificationResult {
  success: boolean;
  leadId?: string;
  expiresAt?: Date;
  error?: string;
  /** Seconds until resend is allowed (if rate limited) */
  retryAfter?: number;
}

/**
 * Result from verifyCode
 */
export interface VerifyCodeResult {
  success: boolean;
  leadId?: string;
  error?: string;
  /** Number of attempts remaining */
  attemptsRemaining?: number;
  /** True if account is locked due to max attempts */
  locked?: boolean;
}

/**
 * Result from canResendCode
 */
export interface ResendCheckResult {
  canResend: boolean;
  /** Seconds until resend is allowed */
  waitSeconds?: number;
  /** Last code sent timestamp */
  lastSentAt?: Date;
}

// ===== SERVICE CLASS =====

/**
 * EmailVerificationService
 *
 * Manages email verification for the Book Demo wizard.
 * Uses bcrypt for secure code hashing and NotificationQueueService for emails.
 *
 * @example
 * ```typescript
 * import { emailVerificationService } from "@/lib/services/crm/email-verification.service";
 *
 * // Send verification code
 * const result = await emailVerificationService.sendVerificationCode({
 *   email: "user@example.com",
 *   locale: "fr",
 * });
 *
 * // Verify code
 * const verifyResult = await emailVerificationService.verifyCode({
 *   email: "user@example.com",
 *   code: "123456",
 * });
 * ```
 */
export class EmailVerificationService {
  private prisma: PrismaClient;
  private notificationQueue: NotificationQueueService;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || defaultPrisma;
    this.notificationQueue = new NotificationQueueService(this.prisma);
  }

  // ============================================
  // CODE GENERATION & HASHING
  // ============================================

  /**
   * Generate a cryptographically secure 6-digit numeric code
   *
   * Uses crypto.randomInt which is cryptographically secure
   * (unlike Math.random)
   *
   * @returns 6-digit string (e.g., "012345", "987654")
   */
  generateCode(): string {
    // Generate number between 0 and 999999
    const code = randomInt(0, 1000000);
    // Pad with leading zeros to ensure 6 digits
    return code.toString().padStart(CODE_LENGTH, "0");
  }

  /**
   * Hash a verification code using bcrypt
   *
   * @param code - Plain text 6-digit code
   * @returns bcrypt hash
   */
  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, BCRYPT_COST);
  }

  /**
   * Compare a plain code against its hash
   *
   * @param code - Plain text code entered by user
   * @param hash - Stored bcrypt hash
   * @returns true if match
   */
  async compareCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  // ============================================
  // RESEND COOLDOWN CHECK
  // ============================================

  /**
   * Check if a new verification code can be sent
   *
   * Enforces 60-second cooldown between sends to prevent abuse.
   *
   * @param email - Email address to check
   * @returns Resend check result with wait time if rate limited
   */
  async canResendCode(email: string): Promise<ResendCheckResult> {
    const lead = await this.prisma.crm_leads.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
      select: {
        email_verification_expires_at: true,
      },
    });

    // No existing lead or no code sent yet - can send
    if (!lead || !lead.email_verification_expires_at) {
      return { canResend: true };
    }

    // Calculate when the code was sent (expires_at - 15 min)
    const expiresAt = new Date(lead.email_verification_expires_at);
    const sentAt = new Date(
      expiresAt.getTime() - CODE_EXPIRATION_MINUTES * 60 * 1000
    );

    // Check if cooldown has passed
    const now = new Date();
    const cooldownEnds = new Date(
      sentAt.getTime() + RESEND_COOLDOWN_SECONDS * 1000
    );

    if (now < cooldownEnds) {
      const waitSeconds = Math.ceil(
        (cooldownEnds.getTime() - now.getTime()) / 1000
      );
      return {
        canResend: false,
        waitSeconds,
        lastSentAt: sentAt,
      };
    }

    return { canResend: true, lastSentAt: sentAt };
  }

  // ============================================
  // SEND VERIFICATION CODE
  // ============================================

  /**
   * Generate, hash, store, and send a verification code
   *
   * Creates a new lead if one doesn't exist for the email.
   * Resets attempt counter on new code generation.
   *
   * @param params - Email and locale for sending
   * @returns Send result with expiration time
   */
  async sendVerificationCode(params: {
    email: string;
    locale?: string;
  }): Promise<SendVerificationResult> {
    const { email, locale = "en" } = params;

    try {
      // 1. Check resend cooldown
      const resendCheck = await this.canResendCode(email);
      if (!resendCheck.canResend) {
        return {
          success: false,
          error: "rate_limited",
          retryAfter: resendCheck.waitSeconds,
        };
      }

      // 2. Generate code and hash
      const plainCode = this.generateCode();
      const hashedCode = await this.hashCode(plainCode);

      // 3. Calculate expiration
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

      // 4. Find or create lead, then update with verification data
      let lead = await this.prisma.crm_leads.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          deleted_at: null,
        },
        select: { id: true },
      });

      if (lead) {
        // Update existing lead
        await this.prisma.crm_leads.update({
          where: { id: lead.id },
          data: {
            email_verification_code: hashedCode,
            email_verification_expires_at: expiresAt,
            email_verification_attempts: 0, // Reset attempts on new code
            updated_at: new Date(),
          },
        });
      } else {
        // Create new lead with minimal data (wizard step 1)
        lead = await this.prisma.crm_leads.create({
          data: {
            email: email.toLowerCase(),
            status: "new",
            email_verified: false,
            email_verification_code: hashedCode,
            email_verification_expires_at: expiresAt,
            email_verification_attempts: 0,
            created_at: new Date(),
          },
          select: { id: true },
        });

        logger.info(
          { leadId: lead.id, email },
          "[EmailVerification] New lead created for wizard step 1"
        );
      }

      // 5. Queue verification email (V6.2.2 template: email_verification_code)
      await this.notificationQueue.queueNotification({
        templateCode: "email_verification_code",
        recipientEmail: email,
        locale,
        variables: {
          verification_code: plainCode,
          expires_in_minutes: CODE_EXPIRATION_MINUTES,
        },
        leadId: lead.id,
        idempotencyKey: `email_verification_${lead.id}_${Date.now()}`,
        processImmediately: true, // Send immediately in dev
      });

      logger.info(
        { leadId: lead.id, email, expiresAt },
        "[EmailVerification] Verification code sent"
      );

      return {
        success: true,
        leadId: lead.id,
        expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { email, error: errorMessage },
        "[EmailVerification] Failed to send verification code"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ============================================
  // VERIFY CODE
  // ============================================

  /**
   * Verify a code entered by the user
   *
   * Checks:
   * 1. Lead exists and has a pending code
   * 2. Max attempts not exceeded (5)
   * 3. Code not expired (15 min)
   * 4. Code matches (bcrypt compare)
   *
   * On success: Sets email_verified = true, clears code
   * On failure: Increments attempts counter
   *
   * @param params - Email and code to verify
   * @returns Verification result
   */
  async verifyCode(params: {
    email: string;
    code: string;
  }): Promise<VerifyCodeResult> {
    const { email, code } = params;

    try {
      // 1. Find lead
      const lead = await this.prisma.crm_leads.findFirst({
        where: {
          email: { equals: email, mode: "insensitive" },
          deleted_at: null,
        },
        select: {
          id: true,
          email_verified: true,
          email_verification_code: true,
          email_verification_expires_at: true,
          email_verification_attempts: true,
        },
      });

      if (!lead) {
        return {
          success: false,
          error: "lead_not_found",
        };
      }

      // 2. Check if already verified
      if (lead.email_verified) {
        return {
          success: true,
          leadId: lead.id,
        };
      }

      // 3. Check if code exists
      if (!lead.email_verification_code) {
        return {
          success: false,
          leadId: lead.id,
          error: "no_code_pending",
        };
      }

      // 4. Check max attempts
      const attempts = lead.email_verification_attempts || 0;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        return {
          success: false,
          leadId: lead.id,
          error: "max_attempts_exceeded",
          attemptsRemaining: 0,
          locked: true,
        };
      }

      // 5. Check expiration
      if (
        !lead.email_verification_expires_at ||
        new Date() > lead.email_verification_expires_at
      ) {
        return {
          success: false,
          leadId: lead.id,
          error: "code_expired",
          attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - attempts,
        };
      }

      // 6. Compare code
      const isValid = await this.compareCode(
        code,
        lead.email_verification_code
      );

      if (!isValid) {
        // Increment attempts
        const newAttempts = attempts + 1;
        await this.prisma.crm_leads.update({
          where: { id: lead.id },
          data: {
            email_verification_attempts: newAttempts,
            updated_at: new Date(),
          },
        });

        const locked = newAttempts >= MAX_VERIFICATION_ATTEMPTS;

        logger.warn(
          { leadId: lead.id, email, attempts: newAttempts, locked },
          "[EmailVerification] Invalid code entered"
        );

        return {
          success: false,
          leadId: lead.id,
          error: "invalid_code",
          attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - newAttempts,
          locked,
        };
      }

      // 7. Success - mark as verified and clear code
      await this.prisma.crm_leads.update({
        where: { id: lead.id },
        data: {
          email_verified: true,
          email_verification_code: null,
          email_verification_expires_at: null,
          email_verification_attempts: 0,
          updated_at: new Date(),
        },
      });

      logger.info(
        { leadId: lead.id, email },
        "[EmailVerification] Email verified successfully"
      );

      return {
        success: true,
        leadId: lead.id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { email, error: errorMessage },
        "[EmailVerification] Verification failed"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get verification status for an email
   *
   * @param email - Email to check
   * @returns Status info or null if lead doesn't exist
   */
  async getVerificationStatus(email: string): Promise<{
    exists: boolean;
    verified: boolean;
    hasPendingCode: boolean;
    attemptsRemaining: number;
    expiresAt: Date | null;
  } | null> {
    const lead = await this.prisma.crm_leads.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        deleted_at: null,
      },
      select: {
        email_verified: true,
        email_verification_code: true,
        email_verification_expires_at: true,
        email_verification_attempts: true,
      },
    });

    if (!lead) {
      return null;
    }

    const attempts = lead.email_verification_attempts || 0;
    const hasPendingCode =
      !!lead.email_verification_code &&
      !!lead.email_verification_expires_at &&
      new Date() < lead.email_verification_expires_at;

    return {
      exists: true,
      verified: lead.email_verified,
      hasPendingCode,
      attemptsRemaining: Math.max(0, MAX_VERIFICATION_ATTEMPTS - attempts),
      expiresAt: lead.email_verification_expires_at,
    };
  }

  /**
   * Clear verification state for a lead (admin use)
   *
   * @param leadId - Lead ID to clear
   */
  async clearVerificationState(leadId: string): Promise<void> {
    await this.prisma.crm_leads.update({
      where: { id: leadId },
      data: {
        email_verification_code: null,
        email_verification_expires_at: null,
        email_verification_attempts: 0,
        updated_at: new Date(),
      },
    });

    logger.info({ leadId }, "[EmailVerification] Verification state cleared");
  }
}

// ===== SINGLETON INSTANCE =====

/**
 * Default EmailVerificationService instance
 */
export const emailVerificationService = new EmailVerificationService();

// ===== EXPORT CONSTANTS FOR TESTING =====

export const VERIFICATION_CONSTANTS = {
  CODE_LENGTH,
  BCRYPT_COST,
  CODE_EXPIRATION_MINUTES,
  RESEND_COOLDOWN_SECONDS,
  MAX_VERIFICATION_ATTEMPTS,
} as const;
