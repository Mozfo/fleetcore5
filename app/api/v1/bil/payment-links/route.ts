/**
 * /api/v1/bil/payment-links
 * Generate Stripe payment links for leads (V6.2.1)
 *
 * Context: Creates Stripe checkout sessions for lead conversion.
 * Validates lead status against bil_settings.payment_settings.
 * Updates lead to payment_pending status after link creation.
 *
 * Authentication: Auth guard validates userId + FleetCore Admin org + CRM role
 *
 * @module app/api/v1/bil/payment-links
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { paymentLinkService } from "@/lib/services/billing/payment-link.service";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * Request body validation schema
 */
const createPaymentLinkSchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID format"),
  plan_code: z
    .string()
    .min(1, "Plan code is required")
    .max(50, "Plan code too long"),
  billing_cycle: z.enum(["monthly", "yearly"], {
    message: "Billing cycle must be 'monthly' or 'yearly'",
  }),
});

/**
 * POST /api/v1/bil/payment-links
 * Create a payment link for a lead
 *
 * Authentication: Via auth guard (FleetCore Admin + CRM role)
 *
 * Request Body:
 * {
 *   lead_id: string (UUID)
 *   plan_code: string ("starter", "pro", "premium")
 *   billing_cycle: "monthly" | "yearly"
 * }
 *
 * Response 200: Payment link created successfully
 * Response 400: Validation error, invalid status, or link already exists
 * Response 401: Unauthorized
 * Response 404: Lead not found
 * Response 500: Internal server error
 *
 * @example
 * POST /api/v1/bil/payment-links
 * {
 *   "lead_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "plan_code": "starter",
 *   "billing_cycle": "monthly"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "payment_link_url": "https://checkout.stripe.com/...",
 *     "checkout_session_id": "cs_xxx",
 *     "expires_at": "2026-01-08T10:00:00Z",
 *     "lead_id": "uuid",
 *     "status_updated": true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate via auth guard
    const { userId } = await requireCrmApiAuth();

    // STEP 2: Parse and validate request body with Zod safeParse
    const body = await request.json();
    const parseResult = createPaymentLinkSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: parseResult.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { lead_id, plan_code, billing_cycle } = parseResult.data;

    // STEP 3: Call service to create payment link
    const result = await paymentLinkService.createPaymentLink({
      leadId: lead_id,
      planCode: plan_code,
      billingCycle: billing_cycle,
      performedBy: userId,
    });

    // STEP 4: Return response based on result
    if (!result.success) {
      // Determine appropriate status code
      let statusCode = 400;
      let errorCode = "PAYMENT_LINK_ERROR";

      if (result.error?.includes("not found")) {
        statusCode = 404;
        errorCode = "NOT_FOUND";
      } else if (result.error?.includes("already exists")) {
        statusCode = 409;
        errorCode = "CONFLICT";
      } else if (result.error?.includes("Cannot create payment link")) {
        errorCode = "INVALID_STATUS";
      } else if (result.error?.includes("No Stripe price ID")) {
        errorCode = "PLAN_NOT_CONFIGURED";
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: errorCode,
            message: result.error,
          },
        },
        { status: statusCode }
      );
    }

    // STEP 5: Success response
    logger.info(
      {
        leadId: lead_id,
        planCode: plan_code,
        billingCycle: billing_cycle,
        sessionId: result.checkoutSessionId,
        userId,
      },
      "[Payment Links] Payment link created"
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          payment_link_url: result.paymentLinkUrl,
          checkout_session_id: result.checkoutSessionId,
          expires_at: result.expiresAt?.toISOString(),
          lead_id: result.leadId,
          status_updated: result.statusUpdated,
        },
        message: "Payment link created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

    logger.error({ error }, "[Payment Links] Error creating payment link");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating payment link",
        },
      },
      { status: 500 }
    );
  }
}
