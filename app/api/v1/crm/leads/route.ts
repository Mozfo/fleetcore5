/**
 * POST /api/v1/crm/leads
 * Create a new lead with automatic scoring and assignment
 *
 * Authentication: Required (Clerk)
 * Tenant Isolation: Required (Clerk Organizations - orgId)
 *
 * Request Body: CreateLeadInput (validated with Zod)
 * Response 201: LeadCreationResponse
 * Response 400: Validation error
 * Response 401: Unauthorized
 * Response 409: Duplicate email
 * Response 500: Internal server error
 *
 * @module app/api/v1/crm/leads
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeadCreationService } from "@/lib/services/crm/lead-creation.service";
import { CreateLeadSchema } from "@/lib/validators/crm/lead.validators";
import { ZodError } from "zod";

/**
 * POST /api/v1/crm/leads
 * Create a new lead with automatic scoring and assignment
 *
 * Flow:
 * 1. Authenticate user (Clerk userId)
 * 2. Get tenant context (Clerk orgId)
 * 3. Parse and validate request body (Zod)
 * 4. Call LeadCreationService.createLead()
 * 5. Return 201 with lead data + scoring + assignment
 *
 * @example
 * POST /api/v1/crm/leads
 * Headers: { Authorization: "Bearer <clerk-token>" }
 * Body: {
 *   "email": "ceo@bigfleet.ae",
 *   "fleet_size": "500+",
 *   "country_code": "AE",
 *   "message": "We need fleet management...",
 *   "source": "website"
 * }
 *
 * Response 201: {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "lead_code": "LEAD-2025-001",
 *     "qualification_score": 76,
 *     "lead_stage": "sales_qualified",
 *     "assigned_to": "emp-uuid",
 *     "priority": "high"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // STEP 2: Tenant isolation (orgId from Clerk Organizations)
    const tenantId = orgId;
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_TENANT",
            message:
              "No organization context found. Please select an organization.",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Parse request body
    const body = await request.json();

    // STEP 4: Validate with Zod
    const validatedData = CreateLeadSchema.parse(body);

    // STEP 5: Create lead (orchestrated)
    const leadCreationService = new LeadCreationService();
    const result = await leadCreationService.createLead(
      validatedData,
      tenantId,
      userId // created_by
    );

    // STEP 6: Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.lead.id,
          lead_code: result.lead.lead_code ?? "",
          email: result.lead.email,
          status: result.lead.status,
          priority: result.lead.priority ?? "medium",

          // Scoring info
          fit_score: result.scoring.fit_score,
          engagement_score: result.scoring.engagement_score,
          qualification_score: result.scoring.qualification_score,
          lead_stage: result.scoring.lead_stage as
            | "top_of_funnel"
            | "marketing_qualified"
            | "sales_qualified",

          // Assignment info
          assigned_to: result.assignment.assigned_to,
          assignment_reason: result.assignment.assignment_reason,

          created_at: result.lead.created_at.toISOString(),
        },
        message: "Lead created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    // ERROR HANDLING

    // Zod validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    // Prisma unique constraint error (duplicate email)
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") ||
        error.message.includes("unique constraint"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_EMAIL",
            message:
              "A lead with this email already exists in your organization",
          },
        },
        { status: 409 }
      );
    }

    // Configuration missing errors
    if (
      error instanceof Error &&
      (error.message.includes("scoring configuration not found") ||
        error.message.includes("assignment rules not found"))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "CONFIGURATION_ERROR",
            message:
              "System configuration incomplete. Please contact administrator.",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    // Generic server error
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating the lead",
        },
      },
      { status: 500 }
    );
  }
}
