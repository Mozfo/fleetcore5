/**
 * Customer Verification API - V6.2-8b
 *
 * Public endpoints for customer verification after Stripe checkout.
 * No authentication required - token-based verification.
 *
 * GET /api/public/verify?token=xxx
 *   - Validates verification token
 *   - Returns tenant info if valid
 *   - Used by frontend to check token before showing form
 *
 * POST /api/public/verify
 *   - Processes verification form submission
 *   - Updates tenant with company details and admin info
 *   - Sends admin invitation via Clerk
 *   - Tracks CGI/CGU acceptance
 *
 * @module app/api/public/verify/route
 */

import { NextRequest, NextResponse } from "next/server";
import { verificationService } from "@/lib/services/billing/verification.service";
import {
  verificationSubmitSchema,
  verificationTokenSchema,
} from "@/lib/validators/billing/verification.validators";
import { logger } from "@/lib/logger";
import { ZodError } from "zod";

// ===== GET: Validate Token =====

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    logger.info(
      { hasToken: !!token },
      "[API] GET /api/public/verify - Token validation request"
    );

    // Validate token parameter
    const parseResult = verificationTokenSchema.safeParse({ token });

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or missing token",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    // Validate token with service
    const result = await verificationService.validateToken(
      parseResult.data.token
    );

    const duration = Date.now() - startTime;

    if (!result.valid) {
      logger.warn(
        { errorCode: result.errorCode, duration },
        "[API] GET /api/public/verify - Token validation failed"
      );

      // Different status codes based on error type
      const statusCode =
        result.errorCode === "TOKEN_EXPIRED"
          ? 410 // Gone
          : result.errorCode === "TOKEN_ALREADY_USED"
            ? 409 // Conflict
            : 404; // Not Found

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          expired: result.expired,
          alreadyVerified: result.alreadyVerified,
        },
        { status: statusCode }
      );
    }

    logger.info(
      { tenantId: result.tenantId, duration },
      "[API] GET /api/public/verify - Token valid"
    );

    return NextResponse.json({
      success: true,
      data: {
        tenantId: result.tenantId,
        tenantName: result.tenantName,
        tenantCode: result.tenantCode,
        countryCode: result.countryCode,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[API] GET /api/public/verify - Error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }
}

// ===== POST: Submit Verification =====

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get client IP for CGI tracking
    const clientIp = getClientIp(request);

    logger.info(
      { clientIp },
      "[API] POST /api/public/verify - Verification submission"
    );

    // Parse request body
    const body = await request.json();

    // Validate input
    const parseResult = verificationSubmitSchema.safeParse(body);

    if (!parseResult.success) {
      const errors = formatZodErrors(parseResult.error);
      logger.warn(
        { errors },
        "[API] POST /api/public/verify - Validation failed"
      );

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          errorCode: "VALIDATION_ERROR",
          errors,
        },
        { status: 400 }
      );
    }

    // Process verification
    const result = await verificationService.submitVerification(
      parseResult.data,
      clientIp
    );

    const duration = Date.now() - startTime;

    if (!result.success) {
      logger.warn(
        { errorCode: result.errorCode, duration },
        "[API] POST /api/public/verify - Verification failed"
      );

      // Different status codes based on error type
      const statusCode =
        result.errorCode === "TOKEN_EXPIRED"
          ? 410 // Gone
          : result.errorCode === "TOKEN_ALREADY_USED"
            ? 409 // Conflict
            : result.errorCode === "TOKEN_INVALID"
              ? 404 // Not Found
              : 400; // Bad Request

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: statusCode }
      );
    }

    logger.info(
      {
        tenantId: result.tenantId,
        tenantCode: result.tenantCode,
        adminInvitationSent: result.adminInvitationSent,
        duration,
      },
      "[API] POST /api/public/verify - Verification completed"
    );

    return NextResponse.json({
      success: true,
      data: {
        tenantId: result.tenantId,
        tenantCode: result.tenantCode,
        adminInvitationSent: result.adminInvitationSent,
        message: result.adminInvitationSent
          ? "Verification complete. An invitation has been sent to the admin email."
          : "Verification complete. Admin invitation will be sent shortly.",
      },
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          errorCode: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[API] POST /api/public/verify - Error"
    );

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred",
        errorCode: "DATABASE_ERROR",
      },
      { status: 500 }
    );
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Get client IP from request headers
 * Handles various proxy headers
 */
function getClientIp(request: NextRequest): string {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  if (vercelForwardedFor) {
    return vercelForwardedFor;
  }

  // Fallback
  return "unknown";
}

/**
 * Format Zod validation errors into a user-friendly object
 */
function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".");
    errors[path] = issue.message;
  }

  return errors;
}
