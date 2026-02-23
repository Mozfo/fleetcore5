/**
 * Verification Service - V6.2-8b
 *
 * Handles customer verification after Stripe checkout.
 * This service validates verification tokens and completes the onboarding process.
 *
 * Flow:
 * 1. Customer receives email with verification link after payment
 * 2. Customer fills verification form (company details, admin designation, CGI/CGU)
 * 3. This service validates token and updates tenant/masterdata
 * 4. AuthService sends admin invitation
 *
 * @module lib/services/billing/verification.service
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { logger } from "@/lib/logger";
import { authService } from "@/lib/services/auth/auth.service";
import {
  type VerificationSubmitInput,
  type VerificationResult,
  type TokenValidationResult,
  CGI_VERSION,
} from "@/lib/validators/billing/verification.validators";

// ===== SERVICE CLASS =====

export class VerificationService {
  private static instance: VerificationService;

  private constructor() {}

  public static getInstance(): VerificationService {
    if (!VerificationService.instance) {
      VerificationService.instance = new VerificationService();
    }
    return VerificationService.instance;
  }

  // =========================================================================
  // TOKEN VALIDATION (for initial page load)
  // =========================================================================

  /**
   * Validate a verification token without processing
   * Used when loading the verification page to check if token is valid
   */
  async validateToken(token: string): Promise<TokenValidationResult> {
    logger.info(
      { tokenLength: token.length },
      "[Verification] Validating token"
    );

    try {
      const tenant = await prisma.adm_tenants.findFirst({
        where: { verification_token: token },
        select: {
          id: true,
          name: true,
          tenant_code: true,
          country_code: true,
          verification_token_expires_at: true,
          verification_completed_at: true,
        },
      });

      if (!tenant) {
        logger.warn(
          { token: token.slice(0, 8) },
          "[Verification] Token not found"
        );
        return {
          valid: false,
          error: "Invalid verification token",
          errorCode: "TOKEN_INVALID",
        };
      }

      // Check if already verified
      if (tenant.verification_completed_at) {
        logger.info(
          { tenantId: tenant.id },
          "[Verification] Token already used"
        );
        return {
          valid: false,
          tenantId: tenant.id,
          tenantCode: tenant.tenant_code || undefined,
          alreadyVerified: true,
          error: "This verification link has already been used",
          errorCode: "TOKEN_ALREADY_USED",
        };
      }

      // Check expiry
      if (
        tenant.verification_token_expires_at &&
        new Date() > tenant.verification_token_expires_at
      ) {
        logger.warn(
          {
            tenantId: tenant.id,
            expiredAt: tenant.verification_token_expires_at,
          },
          "[Verification] Token expired"
        );
        return {
          valid: false,
          tenantId: tenant.id,
          expired: true,
          error: "This verification link has expired",
          errorCode: "TOKEN_EXPIRED",
        };
      }

      logger.info(
        { tenantId: tenant.id, tenantCode: tenant.tenant_code },
        "[Verification] Token valid"
      );

      return {
        valid: true,
        tenantId: tenant.id,
        tenantName: tenant.name,
        tenantCode: tenant.tenant_code || undefined,
        countryCode: tenant.country_code,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage },
        "[Verification] Token validation failed"
      );
      return {
        valid: false,
        error: "An error occurred while validating the token",
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  // =========================================================================
  // VERIFICATION SUBMISSION
  // =========================================================================

  /**
   * Process verification form submission
   *
   * Steps:
   * 1. Validate token (not expired, not already used)
   * 2. Update adm_tenants with admin info and CGI tracking
   * 3. Update clt_masterdata with company legal info
   * 4. Invite admin via AuthService
   * 5. Mark verification as completed
   */
  async submitVerification(
    input: VerificationSubmitInput,
    clientIp: string
  ): Promise<VerificationResult> {
    const { token } = input;

    logger.info(
      {
        tokenLength: token.length,
        adminEmail: input.admin_email,
        hasAddress: !!input.company_address,
      },
      "[Verification] Processing verification submission"
    );

    try {
      // Step 1: Validate token
      const tokenResult = await this.validateToken(token);

      if (!tokenResult.valid || !tokenResult.tenantId) {
        return {
          success: false,
          error: tokenResult.error || "Invalid token",
          errorCode: tokenResult.errorCode,
        };
      }

      const tenantId = tokenResult.tenantId;

      // Step 2: Execute atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // 2a. Update adm_tenants with admin info and CGI tracking
        const now = new Date();

        await tx.adm_tenants.update({
          where: { id: tenantId },
          data: {
            admin_name: input.admin_name,
            admin_email: input.admin_email,
            cgi_accepted_at: now,
            cgi_accepted_ip: clientIp,
            cgi_version: CGI_VERSION,
            verification_completed_at: now,
            // Clear token after use for security
            verification_token: null,
          },
        });

        // 2b. Update clt_masterdata with company legal info
        await tx.clt_masterdata.updateMany({
          where: { tenant_id: tenantId },
          data: {
            legal_name: input.company_legal_name,
            tax_id: input.company_siret || null,
            billing_address: input.company_address
              ? (input.company_address as Prisma.InputJsonValue)
              : Prisma.JsonNull,
            updated_at: now,
          },
        });

        logger.info(
          { tenantId },
          "[Verification] Tenant and masterdata updated"
        );

        return { tenantId };
      });

      // Step 3: Get tenant details for invitation
      // Shared-ID pattern: adm_tenants.id = auth_organization.id
      const tenant = await prisma.adm_tenants.findUnique({
        where: { id: result.tenantId },
        select: {
          id: true,
          tenant_code: true,
        },
      });

      if (!tenant) {
        logger.error(
          { tenantId: result.tenantId },
          "[Verification] Tenant not found after update"
        );
        return {
          success: false,
          error: "Tenant not found",
          errorCode: "TENANT_NOT_FOUND",
        };
      }

      // Step 4: Invite admin via AuthService
      let adminInvitationSent = false;

      // Shared-ID pattern: tenant.id = auth_organization.id
      if (tenant.id) {
        try {
          const inviteResult = await authService.inviteAdmin({
            organizationId: tenant.id,
            email: input.admin_email,
            name: input.admin_name,
            role: "org:provider_admin",
          });

          if (inviteResult.success) {
            adminInvitationSent = true;

            // Update admin_invited_at
            await prisma.adm_tenants.update({
              where: { id: tenant.id },
              data: { admin_invited_at: new Date() },
            });

            logger.info(
              {
                tenantId: tenant.id,
                adminEmail: input.admin_email,
                invitationId: inviteResult.invitationId,
              },
              "[Verification] Admin invitation sent"
            );
          } else {
            logger.warn(
              {
                tenantId: tenant.id,
                adminEmail: input.admin_email,
                error: inviteResult.error,
              },
              "[Verification] Admin invitation failed - will retry later"
            );
          }
        } catch (inviteError) {
          logger.error(
            {
              tenantId: tenant.id,
              error:
                inviteError instanceof Error ? inviteError.message : "Unknown",
            },
            "[Verification] Invitation error - non-fatal"
          );
        }
      } else {
        logger.warn(
          { tenantId: tenant.id },
          "[Verification] No auth organization - skipping invitation"
        );
      }

      logger.info(
        {
          tenantId: tenant.id,
          tenantCode: tenant.tenant_code,
          adminInvitationSent,
        },
        "[Verification] Verification completed successfully"
      );

      return {
        success: true,
        tenantId: tenant.id,
        tenantCode: tenant.tenant_code || undefined,
        adminInvitationSent,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, adminEmail: input.admin_email },
        "[Verification] Verification submission failed"
      );

      return {
        success: false,
        error: `Verification failed: ${errorMessage}`,
        errorCode: "DATABASE_ERROR",
      };
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get tenant by verification token (public, for page rendering)
   */
  async getTenantByToken(
    token: string
  ): Promise<{ id: string; name: string; tenantCode: string | null } | null> {
    const tenant = await prisma.adm_tenants.findFirst({
      where: {
        verification_token: token,
        verification_completed_at: null, // Not yet verified
      },
      select: {
        id: true,
        name: true,
        tenant_code: true,
      },
    });

    if (!tenant) {
      return null;
    }

    return {
      id: tenant.id,
      name: tenant.name,
      tenantCode: tenant.tenant_code,
    };
  }

  /**
   * Check if a tenant needs verification
   */
  async needsVerification(tenantId: string): Promise<boolean> {
    const tenant = await prisma.adm_tenants.findUnique({
      where: { id: tenantId },
      select: {
        verification_completed_at: true,
        verification_token: true,
      },
    });

    return !!(
      tenant &&
      !tenant.verification_completed_at &&
      tenant.verification_token
    );
  }

  /**
   * Resend verification email (creates new token with fresh expiry)
   * To be implemented when email service is ready
   */
  async resendVerificationEmail(tenantId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    // TODO: Implement when notification service has verification email template
    logger.info(
      { tenantId },
      "[Verification] Resend verification email - not implemented"
    );
    return {
      success: false,
      error: "Email resend not yet implemented",
    };
  }
}

// Export singleton
export const verificationService = VerificationService.getInstance();
