/**
 * Verify Email Code Endpoint - V6.2.2
 * Book Demo Wizard - Step 1 Code Verification
 *
 * POST /api/crm/leads/verify-email
 *
 * Validates the 6-digit verification code entered by the user.
 *
 * @module app/api/crm/leads/verify-email/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { EmailVerificationService } from "@/lib/services/crm/email-verification.service";

// ===== ZOD SCHEMA =====

/**
 * Request body schema for email verification
 */
const VerifyEmailSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID format"),
  code: z
    .string()
    .length(6, "Code must be exactly 6 digits")
    .regex(/^\d{6}$/, "Code must be 6 digits"),
});

// ===== TYPES =====

type VerifyEmailBody = z.infer<typeof VerifyEmailSchema>;

// ===== HANDLER =====

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();

    const parseResult = VerifyEmailSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();

      logger.warn(
        { errors: errors.fieldErrors },
        "[VerifyEmail] Validation failed"
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: errors.fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { leadId, code }: VerifyEmailBody = parseResult.data;

    // 2. Find lead by ID to get email
    // SECURITY: We lookup by ID, not email, to prevent enumeration
    const lead = await db.crm_leads.findFirst({
      where: {
        id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        email: true,
        email_verified: true,
      },
    });

    // SECURITY: Return generic error to prevent enumeration attacks
    // Don't reveal if lead exists or not
    if (!lead) {
      logger.warn({ leadId }, "[VerifyEmail] Lead not found - returning 400");

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VERIFICATION_FAILED",
            message: "Verification failed. Please request a new code.",
          },
        },
        { status: 400 }
      );
    }

    // 3. If already verified, return success
    if (lead.email_verified) {
      logger.info(
        { leadId, email: lead.email },
        "[VerifyEmail] Already verified"
      );

      return NextResponse.json({
        success: true,
        data: {
          leadId: leadId,
          verified: true,
          alreadyVerified: true,
          redirectUrl: `/book-demo/step-2?leadId=${leadId}`,
        },
      });
    }

    // 4. Verify the code
    const emailVerificationService = new EmailVerificationService(db);
    const result = await emailVerificationService.verifyCode({
      email: lead.email,
      code,
    });

    // 5. Handle verification result
    if (result.success) {
      logger.info(
        { leadId, email: lead.email },
        "[VerifyEmail] Code verified successfully"
      );

      return NextResponse.json({
        success: true,
        data: {
          leadId: leadId,
          verified: true,
          redirectUrl: `/book-demo/step-2?leadId=${leadId}`,
        },
      });
    }

    // Handle specific error cases
    switch (result.error) {
      case "invalid_code":
        logger.warn(
          {
            leadId,
            email: lead.email,
            attemptsRemaining: result.attemptsRemaining,
            locked: result.locked,
          },
          "[VerifyEmail] Invalid code entered"
        );

        // Check if max attempts reached (locked)
        if (result.locked) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "MAX_ATTEMPTS",
                message: "Too many attempts. Please request a new code.",
              },
            },
            { status: 429 }
          );
        }

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "INVALID_CODE",
              message: "Invalid verification code",
              attemptsRemaining: result.attemptsRemaining,
            },
          },
          { status: 400 }
        );

      case "code_expired":
        logger.info(
          { leadId, email: lead.email },
          "[VerifyEmail] Code expired"
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "EXPIRED",
              message: "Code expired. Please request a new one.",
            },
          },
          { status: 400 }
        );

      case "max_attempts_exceeded":
        logger.warn(
          { leadId, email: lead.email },
          "[VerifyEmail] Max attempts exceeded"
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "MAX_ATTEMPTS",
              message: "Too many attempts. Please request a new code.",
            },
          },
          { status: 429 }
        );

      case "no_code_pending":
        logger.info(
          { leadId, email: lead.email },
          "[VerifyEmail] No code pending"
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NO_CODE_PENDING",
              message:
                "No verification code pending. Please request a new one.",
            },
          },
          { status: 400 }
        );

      case "lead_not_found":
        // SECURITY: Don't reveal if lead exists
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERIFICATION_FAILED",
              message: "Verification failed. Please request a new code.",
            },
          },
          { status: 400 }
        );

      default:
        logger.error(
          { leadId, email: lead.email, error: result.error },
          "[VerifyEmail] Unexpected verification error"
        );

        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VERIFICATION_FAILED",
              message: "Verification failed. Please try again.",
            },
          },
          { status: 500 }
        );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error({ error: errorMessage }, "[VerifyEmail] Unexpected error");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
