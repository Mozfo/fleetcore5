/**
 * Email Verification Service - V6.4
 * Book Demo Wizard - Email Verification
 *
 * Handles 6-digit verification code generation, hashing, validation,
 * and email sending for the Book Demo wizard flow.
 *
 * V6.4 REFACTORING (SRP):
 * - This service NO LONGER creates leads
 * - Lead creation is handled by WizardLeadService
 * - This service focuses ONLY on verification code logic
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
import { resolveTenantByCountry } from "@/lib/helpers/tenant-routing.server";
import {
  WizardLeadService,
  wizardLeadService as defaultWizardLeadService,
} from "./wizard-lead.service";

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

/**
 * V6.4: Generated code with hash and expiration
 * Used by new flow where lead creation is separate
 */
export interface GeneratedVerificationCode {
  /** Plain text 6-digit code to send via email */
  plainCode: string;
  /** bcrypt hash to store in database */
  hashedCode: string;
  /** Expiration timestamp (NOW + 15 minutes) */
  expiresAt: Date;
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
  private wizardLeadService: WizardLeadService;

  constructor(prismaClient?: PrismaClient, wizardLeadSvc?: WizardLeadService) {
    this.prisma = prismaClient || defaultPrisma;
    this.notificationQueue = new NotificationQueueService(this.prisma);
    this.wizardLeadService = wizardLeadSvc || defaultWizardLeadService;
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

  /**
   * V6.4: Generate a verification code with hash and expiration
   *
   * This method does NOT touch the database - it only generates the code.
   * Use WizardLeadService.setVerificationCode() to store it.
   *
   * @returns Object containing plainCode, hashedCode, and expiresAt
   *
   * @example
   * ```typescript
   * const { plainCode, hashedCode, expiresAt } = await service.generateAndHashCode();
   * await wizardLeadService.setVerificationCode(leadId, { hashedCode, expiresAt });
   * // Send plainCode via email
   * ```
   */
  async generateAndHashCode(): Promise<GeneratedVerificationCode> {
    const plainCode = this.generateCode();
    const hashedCode = await this.hashCode(plainCode);

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + CODE_EXPIRATION_MINUTES);

    return {
      plainCode,
      hashedCode,
      expiresAt,
    };
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

  /**
   * V6.4: Check if a new verification code can be sent (by leadId)
   *
   * Preferred method - avoids email lookup.
   *
   * @param leadId - Lead UUID
   * @returns Resend check result with wait time if rate limited
   */
  async canResendCodeByLeadId(leadId: string): Promise<ResendCheckResult> {
    const status = await this.wizardLeadService.getVerificationStatus(leadId);

    // No lead or no code sent yet - can send
    if (!status || !status.email_verification_expires_at) {
      return { canResend: true };
    }

    // Calculate when the code was sent (expires_at - 15 min)
    const expiresAt = new Date(status.email_verification_expires_at);
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
   * V6.4: Send verification code to an existing lead
   *
   * PREFERRED METHOD - Lead must already exist (created by WizardLeadService).
   * Does NOT create leads - single responsibility.
   *
   * @param params - leadId, email (for sending), and locale
   * @returns Send result with expiration time
   *
   * @example
   * ```typescript
   * // 1. Create lead first
   * const { leadId } = await wizardLeadService.createWizardLead({...});
   *
   * // 2. Send verification code
   * const result = await emailVerificationService.sendVerificationCodeToLead({
   *   leadId,
   *   email: "user@example.com",
   *   locale: "fr",
   * });
   * ```
   */
  async sendVerificationCodeToLead(params: {
    leadId: string;
    email: string;
    locale?: string;
  }): Promise<SendVerificationResult> {
    const { leadId, email, locale = "en" } = params;

    try {
      // 1. Check resend cooldown
      const resendCheck = await this.canResendCodeByLeadId(leadId);
      if (!resendCheck.canResend) {
        return {
          success: false,
          error: "rate_limited",
          retryAfter: resendCheck.waitSeconds,
        };
      }

      // 2. Generate code and hash
      const { plainCode, hashedCode, expiresAt } =
        await this.generateAndHashCode();

      // 3. Store verification code on lead
      await this.wizardLeadService.setVerificationCode(leadId, {
        hashedCode,
        expiresAt,
      });

      // 4. Queue verification email
      await this.notificationQueue.queueNotification({
        templateCode: "email_verification_code",
        recipientEmail: email,
        locale,
        variables: {
          verification_code: plainCode,
          expires_in_minutes: CODE_EXPIRATION_MINUTES,
        },
        leadId,
        idempotencyKey: `email_verification_${leadId}_${Date.now()}`,
        processImmediately: true,
      });

      logger.info(
        { leadId, email, expiresAt },
        "[EmailVerification] Verification code sent to existing lead"
      );

      return {
        success: true,
        leadId,
        expiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { leadId, email, error: errorMessage },
        "[EmailVerification] Failed to send verification code to lead"
      );

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Generate, hash, store, and send a verification code
   *
   * @deprecated Use WizardLeadService.createWizardLead() + sendVerificationCodeToLead() instead.
   * This method will be removed in V7.0.
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
    country_code?: string;
    // V6.4: GeoIP tracking for spam detection
    ip_address?: string | null;
    detected_country_code?: string | null;
    // UTM tracking (optional)
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  }): Promise<SendVerificationResult> {
    const {
      email,
      locale = "en",
      country_code,
      ip_address,
      detected_country_code,
      utm_source,
      utm_medium,
      utm_campaign,
    } = params;

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
        // Update existing lead with verification code and country_code if provided
        await this.prisma.crm_leads.update({
          where: { id: lead.id },
          data: {
            email_verification_code: hashedCode,
            email_verification_expires_at: expiresAt,
            email_verification_attempts: 0, // Reset attempts on new code
            ...(country_code && { country_code: country_code.toUpperCase() }),
            // V6.4-3: Always update language from homepage locale
            language: locale,
            // V6.4: GeoIP tracking (update only if not already set)
            ...(ip_address && { ip_address }),
            ...(detected_country_code && { detected_country_code }),
            updated_at: new Date(),
          },
        });
      } else {
        // V7: Resolve tenant from country before creating lead
        const resolvedCountry = country_code?.toUpperCase() || "XX";
        const tenantId = await resolveTenantByCountry(resolvedCountry);

        // Create new lead with minimal data (wizard step 1)
        lead = await this.prisma.crm_leads.create({
          data: {
            email: email.toLowerCase(),
            status: "new",
            lead_stage: "top_of_funnel", // V6.4: Set initial stage
            source: "website", // Web form (must match crm_leads_source_check constraint)
            // V6.4-3: Store homepage language for email notifications
            language: locale,
            email_verified: false,
            email_verification_code: hashedCode,
            email_verification_expires_at: expiresAt,
            email_verification_attempts: 0,
            tenant_id: tenantId,
            ...(country_code && { country_code: country_code.toUpperCase() }),
            // V6.4: GeoIP tracking for spam detection
            ...(ip_address && { ip_address }),
            ...(detected_country_code && { detected_country_code }),
            // UTM tracking
            ...(utm_source && { utm_source }),
            ...(utm_medium && { utm_medium }),
            ...(utm_campaign && { utm_campaign }),
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
      // Template uses {{verification_code}} and {{expires_in_minutes}} placeholders
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
        processImmediately: true, // Always send immediately for verification codes
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

  /**
   * V6.4: Verify a code by leadId (preferred method)
   *
   * Uses WizardLeadService for state updates.
   * Avoids email lookup - more efficient.
   *
   * @param params - Lead ID and code to verify
   * @returns Verification result
   *
   * @example
   * ```typescript
   * const result = await emailVerificationService.verifyCodeByLeadId({
   *   leadId: "uuid-123",
   *   code: "123456",
   * });
   * ```
   */
  async verifyCodeByLeadId(params: {
    leadId: string;
    code: string;
  }): Promise<VerifyCodeResult> {
    const { leadId, code } = params;

    try {
      // 1. Get verification status from WizardLeadService
      const status = await this.wizardLeadService.getVerificationStatus(leadId);

      if (!status) {
        return {
          success: false,
          error: "lead_not_found",
        };
      }

      // 2. Check if already verified
      if (status.email_verified) {
        return {
          success: true,
          leadId,
        };
      }

      // 3. Check if code exists
      if (!status.email_verification_code) {
        return {
          success: false,
          leadId,
          error: "no_code_pending",
        };
      }

      // 4. Check max attempts
      const attempts = status.email_verification_attempts || 0;
      if (attempts >= MAX_VERIFICATION_ATTEMPTS) {
        return {
          success: false,
          leadId,
          error: "max_attempts_exceeded",
          attemptsRemaining: 0,
          locked: true,
        };
      }

      // 5. Check expiration
      if (
        !status.email_verification_expires_at ||
        new Date() > status.email_verification_expires_at
      ) {
        return {
          success: false,
          leadId,
          error: "code_expired",
          attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - attempts,
        };
      }

      // 6. Compare code
      const isValid = await this.compareCode(
        code,
        status.email_verification_code
      );

      if (!isValid) {
        // Increment attempts via WizardLeadService
        const newAttempts =
          await this.wizardLeadService.incrementVerificationAttempts(leadId);

        const locked = newAttempts >= MAX_VERIFICATION_ATTEMPTS;

        logger.warn(
          { leadId, attempts: newAttempts, locked },
          "[EmailVerification] Invalid code entered"
        );

        return {
          success: false,
          leadId,
          error: "invalid_code",
          attemptsRemaining: MAX_VERIFICATION_ATTEMPTS - newAttempts,
          locked,
        };
      }

      // 7. Success - mark as verified via WizardLeadService
      await this.wizardLeadService.markEmailVerified(leadId);

      logger.info(
        { leadId },
        "[EmailVerification] Email verified successfully (by leadId)"
      );

      return {
        success: true,
        leadId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(
        { leadId, error: errorMessage },
        "[EmailVerification] Verification failed (by leadId)"
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
