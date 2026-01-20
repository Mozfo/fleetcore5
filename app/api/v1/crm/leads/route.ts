/**
 * /api/v1/crm/leads
 * Lead list and creation operations (GET, POST)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages prospects/leads BEFORE they become clients.
 * Prospects do NOT have a tenantId (they're not clients yet).
 *
 * Authentication flow:
 * 1. Middleware validates: userId + FleetCore Admin org membership + CRM role
 * 2. Middleware injects: x-user-id, x-org-id headers
 * 3. This route trusts middleware validation (no redundant tenantId check)
 *
 * Security: Access restricted to FleetCore Admin users with CRM roles
 * (org:adm_admin, org:adm_commercial) - enforced at middleware level.
 *
 * @module app/api/v1/crm/leads
 */

import { NextRequest, NextResponse } from "next/server";
import { LeadCreationService } from "@/lib/services/crm/lead-creation.service";
import { CreateLeadSchema } from "@/lib/validators/crm/lead.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * POST /api/v1/crm/leads
 * Create a new lead with automatic scoring and assignment
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 * Tenant Isolation: N/A (CRM manages prospects without tenant)
 *
 * Flow:
 * 1. Read auth from middleware-injected headers
 * 2. Parse and validate request body (Zod)
 * 3. Call LeadCreationService.createLead()
 * 4. Return 201 with lead data + scoring + assignment
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
 *     "lead_code": "L-R7M8J6",
 *     "qualification_score": 76,
 *     "lead_stage": "sales_qualified",
 *     "assigned_to": "emp-uuid",
 *     "priority": "high"
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Read authentication from middleware-injected headers
    // Security: Middleware already validated FleetCore Admin membership + CRM role
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    // Defensive check (should never fail if middleware is correctly configured)
    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Lead Create] Missing auth headers - middleware may be misconfigured"
      );
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

    // STEP 2: Parse request body
    const body = await request.json();

    // STEP 3: Validate with Zod
    const validatedData = CreateLeadSchema.parse(body);

    // STEP 4: Create lead (orchestrated)
    // Note: orgId passed as context identifier (not tenant - prospects have no tenant)
    const leadCreationService = new LeadCreationService();
    const result = await leadCreationService.createLead(
      validatedData,
      orgId, // FleetCore Admin org context
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

/**
 * GET /api/v1/crm/leads
 * List leads with filtering, sorting, and pagination
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 * Tenant Isolation: N/A (CRM manages prospects without tenant)
 *
 * Query Parameters:
 * - status: Filter by status (new, contacted, qualified, converted, lost)
 * - lead_stage: Filter by stage (top_of_funnel, marketing_qualified, sales_qualified, opportunity)
 * - assigned_to: Filter by assigned employee ID
 * - country_code: Filter by country (2-letter ISO code)
 * - min_score: Minimum qualification score (0-100)
 * - search: Search in email, company_name, first_name, last_name
 * - inactive_months: Filter cold leads (no update for X months)
 * - include_cold: Include only cold leads (lost/disqualified OR inactive)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (asc/desc, default: desc)
 *
 * Response 200: Paginated list of leads
 * Response 401: Unauthorized (middleware handles this)
 * Response 400: Invalid query parameters
 * Response 500: Internal server error
 *
 * @example
 * GET /api/v1/crm/leads?status=new&lead_stage=sales_qualified&page=1&limit=20&sort=created_at&order=desc
 *
 * Response 200: {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "lead_code": "L-CQDM56",
 *       "email": "ceo@bigfleet.ae",
 *       "company_name": "Big Fleet LLC",
 *       "status": "new",
 *       "lead_stage": "sales_qualified",
 *       "qualification_score": 76,
 *       "assigned_to": {
 *         "id": "emp-uuid",
 *         "first_name": "John",
 *         "last_name": "Doe"
 *       },
 *       "created_at": "2025-01-20T10:00:00Z"
 *     }
 *   ],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 150,
 *     "totalPages": 8
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Read authentication from middleware-injected headers
    // Security: Middleware already validated FleetCore Admin membership + CRM role
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    // Defensive check (should never fail if middleware is correctly configured)
    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Lead List] Missing auth headers - middleware may be misconfigured"
      );
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

    // STEP 2: Parse query parameters
    const { searchParams } = new URL(request.url);

    // Filters
    const status = searchParams.get("status") || undefined;
    const lead_stage = searchParams.get("lead_stage") || undefined;
    const assigned_to = searchParams.get("assigned_to") || undefined;
    const country_code = searchParams.get("country_code") || undefined;
    const minScoreParam = searchParams.get("min_score");
    const min_score = minScoreParam ? parseInt(minScoreParam) : undefined;
    const search = searchParams.get("search") || undefined;

    // Cold leads filters
    const inactiveMonthsParam = searchParams.get("inactive_months");
    const inactive_months = inactiveMonthsParam
      ? parseInt(inactiveMonthsParam)
      : undefined;
    const include_cold = searchParams.get("include_cold") === "true";

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Sorting
    const sort = searchParams.get("sort") || "created_at";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";

    // STEP 4: Build where clause
    const where: Record<string, unknown> = {
      deleted_at: null, // Exclude soft-deleted
    };

    // Apply filters
    if (status) where.status = status;
    if (lead_stage) where.lead_stage = lead_stage;
    if (assigned_to) where.assigned_to = assigned_to;
    if (country_code) where.country_code = country_code;
    if (min_score !== undefined) {
      where.qualification_score = { gte: min_score };
    }

    // Search across multiple fields
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { company_name: { contains: search, mode: "insensitive" } },
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
      ];
    }

    // Cold leads filters
    if (include_cold) {
      // Include only cold leads: lost/disqualified OR inactive for X months
      const coldThreshold = new Date();
      coldThreshold.setMonth(coldThreshold.getMonth() - (inactive_months || 6));
      where.OR = [
        { status: { in: ["lost", "disqualified"] } },
        { updated_at: { lt: coldThreshold } },
      ];
    } else if (inactive_months) {
      // Filter by inactivity only
      const coldThreshold = new Date();
      coldThreshold.setMonth(coldThreshold.getMonth() - inactive_months);
      where.updated_at = { lt: coldThreshold };
    }

    // STEP 5: Query leads directly with Prisma
    const [leads, total] = await Promise.all([
      db.crm_leads.findMany({
        where,
        include: {
          eu1f9qh: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          crm_countries: {
            select: {
              country_code: true,
              country_name_en: true,
              flag_emoji: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.crm_leads.count({ where }),
    ]);

    // STEP 6: Format response
    return NextResponse.json(
      {
        success: true,
        data: leads.map((lead) => ({
          id: lead.id,
          lead_code: lead.lead_code,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          phone: lead.phone,
          country_code: lead.country_code,
          country: lead.crm_countries as unknown as {
            country_code: string;
            country_name_en: string;
            flag_emoji: string;
          } | null,
          fleet_size: lead.fleet_size,
          status: lead.status,
          lead_stage: lead.lead_stage,
          priority: lead.priority,
          fit_score: lead.fit_score ? Number(lead.fit_score) : null,
          engagement_score: lead.engagement_score
            ? Number(lead.engagement_score)
            : null,
          qualification_score: lead.qualification_score
            ? Number(lead.qualification_score)
            : null,
          assigned_to: lead.eu1f9qh
            ? {
                id: lead.eu1f9qh.id,
                first_name: lead.eu1f9qh.first_name,
                last_name: lead.eu1f9qh.last_name,
                email: lead.eu1f9qh.email,
              }
            : null,
          created_at: lead.created_at.toISOString(),
          updated_at: lead.updated_at?.toISOString() || null,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // Error handling
    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred while fetching leads",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching leads",
        },
      },
      { status: 500 }
    );
  }
}
