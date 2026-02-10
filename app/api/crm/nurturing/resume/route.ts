/**
 * GET /api/crm/nurturing/resume?token=xxx
 *
 * V6.6 - Resume wizard via nurturing token
 *
 * Public endpoint: No auth required (token-based access).
 * Validates the resume_token from nurturing emails and returns
 * redirect information for the wizard.
 *
 * Flow:
 * 1. Validate token (exists, not expired, not archived)
 * 2. Mark nurturing entry as clicked
 * 3. Return redirect info (to Step 3 with pre-filled data)
 *
 * @module app/api/crm/nurturing/resume/route
 */

import { NextRequest, NextResponse } from "next/server";
import { nurturingService } from "@/lib/services/crm/nurturing.service";
import { logger } from "@/lib/logger";

// ============================================================================
// HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "MISSING_TOKEN",
            message: "Token parameter is required",
          },
        },
        { status: 400 }
      );
    }

    // Validate token format (64 hex chars)
    if (!/^[0-9a-f]{64}$/i.test(token)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "Invalid token format",
          },
        },
        { status: 400 }
      );
    }

    // Find nurturing entry by resume token
    const nurturing = await nurturingService.findByResumeToken(token);

    if (!nurturing) {
      logger.info(
        { token: token.substring(0, 8) + "..." },
        "[NurturingResume] Invalid or expired token"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_TOKEN",
            message: "This link has expired or is invalid",
          },
        },
        { status: 404 }
      );
    }

    // Mark as clicked (for analytics)
    await nurturingService.markClicked(nurturing.id);

    // Determine redirect based on state
    const locale = nurturing.language || "en";
    let redirectTo: string;

    if (nurturing.original_lead_id) {
      // Has a lead reference - redirect to Step 3 (profile) or Step 4 (booking)
      redirectTo = `/${locale}/book-demo/profile?leadId=${nurturing.original_lead_id}`;
    } else {
      // No lead reference - redirect to Step 1
      redirectTo = `/${locale}/book-demo`;
    }

    logger.info(
      {
        nurturingId: nurturing.id,
        email: nurturing.email,
        redirectTo,
      },
      "[NurturingResume] Token validated, redirecting"
    );

    return NextResponse.json({
      success: true,
      data: {
        nurturing_id: nurturing.id,
        email: nurturing.email,
        redirect_to: redirectTo,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error(
      { error: errorMessage },
      "[NurturingResume] Failed to process resume token"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to process resume request",
        },
      },
      { status: 500 }
    );
  }
}
