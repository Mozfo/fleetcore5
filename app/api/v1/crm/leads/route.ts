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
import { db } from "@/lib/prisma";

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

/**
 * GET /api/v1/crm/leads
 * List leads with filtering, sorting, and pagination
 *
 * Authentication: Required (Clerk)
 * Tenant Isolation: Via assigned_to → employee → tenant
 *
 * Query Parameters:
 * - status: Filter by status (new, contacted, qualified, converted, lost)
 * - lead_stage: Filter by stage (top_of_funnel, marketing_qualified, sales_qualified, opportunity)
 * - assigned_to: Filter by assigned employee ID
 * - country_code: Filter by country (2-letter ISO code)
 * - min_score: Minimum qualification score (0-100)
 * - search: Search in email, company_name, first_name, last_name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (asc/desc, default: desc)
 *
 * Response 200: Paginated list of leads
 * Response 401: Unauthorized
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
 *       "lead_code": "LEAD-2025-001",
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

    // STEP 2: Tenant isolation
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

    // STEP 3: Parse query parameters
    const { searchParams } = new URL(request.url);

    // Filters
    const status = searchParams.get("status") || undefined;
    const lead_stage = searchParams.get("lead_stage") || undefined;
    const assigned_to = searchParams.get("assigned_to") || undefined;
    const country_code = searchParams.get("country_code") || undefined;
    const minScoreParam = searchParams.get("min_score");
    const min_score = minScoreParam ? parseInt(minScoreParam) : undefined;
    const search = searchParams.get("search") || undefined;

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

    // STEP 5: Query leads directly with Prisma
    const [leads, total] = await Promise.all([
      db.crm_leads.findMany({
        where,
        include: {
          adm_provider_employees_crm_leads_assigned_toToadm_provider_employees:
            {
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
          fit_score: lead.fit_score,
          engagement_score: lead.engagement_score,
          qualification_score: lead.qualification_score,
          assigned_to:
            lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees
              ? {
                  id: lead
                    .adm_provider_employees_crm_leads_assigned_toToadm_provider_employees
                    .id,
                  first_name:
                    lead
                      .adm_provider_employees_crm_leads_assigned_toToadm_provider_employees
                      .first_name,
                  last_name:
                    lead
                      .adm_provider_employees_crm_leads_assigned_toToadm_provider_employees
                      .last_name,
                  email:
                    lead
                      .adm_provider_employees_crm_leads_assigned_toToadm_provider_employees
                      .email,
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
