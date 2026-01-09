/**
 * Resend Verification Code Endpoint - V6.2.2
 * Book Demo Wizard - Resend 6-digit code
 *
 * POST /api/crm/leads/resend-code
 *
 * Generates and sends a new 6-digit verification code.
 * Enforces 60-second cooldown between resends.
 *
 * @module app/api/crm/leads/resend-code/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { EmailVerificationService } from "@/lib/services/crm/email-verification.service";

// ===== ZOD SCHEMA =====

/**
 * Request body schema for resend code
 */
const ResendCodeSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID format"),
  locale: z.string().optional().default("en"),
});

// ===== TYPES =====

type ResendCodeBody = z.infer<typeof ResendCodeSchema>;

// ===== HANDLER =====

export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate request body
    const body = await request.json();

    const parseResult = ResendCodeSchema.safeParse(body);
    if (!parseResult.success) {
      const errors = parseResult.error.flatten();

      logger.warn(
        { errors: errors.fieldErrors },
        "[ResendCode] Validation failed"
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

    const { leadId, locale }: ResendCodeBody = parseResult.data;

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
      logger.warn({ leadId }, "[ResendCode] Lead not found - returning 400");

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RESEND_FAILED",
            message: "Unable to send verification code",
          },
        },
        { status: 400 }
      );
    }

    // 3. Check if already verified
    if (lead.email_verified) {
      logger.info(
        { leadId, email: lead.email },
        "[ResendCode] Already verified"
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "ALREADY_VERIFIED",
            message: "Email is already verified",
          },
        },
        { status: 400 }
      );
    }

    // 4. Check cooldown before sending
    const emailVerificationService = new EmailVerificationService(db);
    const canResend = await emailVerificationService.canResendCode(lead.email);

    if (!canResend.canResend) {
      logger.info(
        {
          leadId,
          email: lead.email,
          waitSeconds: canResend.waitSeconds,
        },
        "[ResendCode] Cooldown active"
      );

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: "Please wait before requesting a new code",
            cooldownSeconds: canResend.waitSeconds,
          },
        },
        { status: 429 }
      );
    }

    // 5. Send new verification code
    const result = await emailVerificationService.sendVerificationCode({
      email: lead.email,
      locale,
    });

    if (!result.success) {
      logger.error(
        { leadId, email: lead.email, error: result.error },
        "[ResendCode] Failed to send code"
      );

      // Handle rate limiting from service (shouldn't happen due to check above)
      if (result.error === "rate_limited" && result.retryAfter) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "RATE_LIMITED",
              message: "Please wait before requesting a new code",
              cooldownSeconds: result.retryAfter,
            },
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RESEND_FAILED",
            message: "Unable to send verification code. Please try again.",
          },
        },
        { status: 500 }
      );
    }

    logger.info(
      {
        leadId,
        email: lead.email,
        expiresAt: result.expiresAt,
      },
      "[ResendCode] New verification code sent"
    );

    return NextResponse.json({
      success: true,
      data: {
        expiresAt: result.expiresAt?.toISOString(),
      },
      message: "Verification code sent",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    logger.error({ error: errorMessage }, "[ResendCode] Unexpected error");

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
