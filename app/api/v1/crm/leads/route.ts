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
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

// ── Security: Allowed sort fields (must match DataTable sortable columns) ────
const ALLOWED_SORT_FIELDS = new Set([
  "id",
  "lead_code",
  "email",
  "first_name",
  "last_name",
  "phone",
  "company_name",
  "industry",
  "company_size",
  "fleet_size",
  "current_software",
  "website_url",
  "linkedin_url",
  "country_code",
  "city",
  "status",
  "lead_stage",
  "priority",
  "fit_score",
  "engagement_score",
  "qualification_score",
  "source",
  "source_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "assigned_to",
  "gdpr_consent",
  "consent_at",
  "consent_ip",
  "created_at",
  "updated_at",
  "qualified_date",
  "converted_date",
  "next_action_date",
  "last_activity_at",
  "stage_entered_at",
  "booking_slot_at",
  "booking_confirmed_at",
  "wizard_completed",
  "email_verified",
  "callback_requested",
  "callback_requested_at",
  "callback_completed_at",
  "disqualified_at",
  "disqualification_reason",
  "loss_reason_code",
  "competitor_name",
  "detected_country_code",
  "language",
  "converted_at",
  "attendance_confirmed",
  "attendance_confirmed_at",
  "deleted_at",
  "created_by",
]);

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
    // STEP 1: Authenticate via direct auth helper
    const { userId, orgId } = await requireCrmApiAuth();

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

    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

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
    // STEP 1: Authenticate via direct auth helper
    await requireCrmApiAuth();

    // STEP 2: Parse query parameters
    const { searchParams } = new URL(request.url);

    // Helper: parse CSV string into array or undefined
    const csvParam = (key: string): string[] | undefined => {
      const val = searchParams.get(key);
      return val ? val.split(",").filter(Boolean) : undefined;
    };
    const intParam = (key: string): number | undefined => {
      const val = searchParams.get(key);
      return val ? parseInt(val) : undefined;
    };
    const dateParam = (key: string): Date | undefined => {
      const val = searchParams.get(key);
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };
    const boolParam = (key: string): boolean | undefined => {
      const val = searchParams.get(key);
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    };

    // CSV multi-select filters
    const status = csvParam("status");
    const lead_stage = csvParam("lead_stage");
    const priority = csvParam("priority");
    const source = csvParam("source");
    const fleet_size = csvParam("fleet_size");
    const language = csvParam("language");
    const industry = csvParam("industry");
    const country_code = csvParam("country_code");
    const loss_reason_code = csvParam("loss_reason_code");
    const disqualification_reason = csvParam("disqualification_reason");
    const platforms_used = csvParam("platforms_used");
    const assigned_to = searchParams.get("assigned_to") || undefined;

    // Search
    const search = searchParams.get("search") || undefined;

    // Range filters (min/max)
    const min_qualification_score = intParam("min_qualification_score");
    const max_qualification_score = intParam("max_qualification_score");
    const min_fit_score = intParam("min_fit_score");
    const max_fit_score = intParam("max_fit_score");
    const min_engagement_score = intParam("min_engagement_score");
    const max_engagement_score = intParam("max_engagement_score");

    // Date range filters
    const last_activity_at_gte = dateParam("min_last_activity_at");
    const last_activity_at_lte = dateParam("max_last_activity_at");
    const created_at_gte = dateParam("min_created_at");
    const created_at_lte = dateParam("max_created_at");
    const next_action_date_gte = dateParam("min_next_action_date");
    const next_action_date_lte = dateParam("max_next_action_date");
    const booking_slot_at_gte = dateParam("min_booking_slot_at");
    const booking_slot_at_lte = dateParam("max_booking_slot_at");

    // Boolean filters
    const email_verified = boolParam("email_verified");
    const callback_requested = boolParam("callback_requested");
    const gdpr_consent = boolParam("gdpr_consent");
    const attendance_confirmed = boolParam("attendance_confirmed");
    const wizard_completed = boolParam("wizard_completed");

    // Legacy cold leads filters
    const inactive_months = intParam("inactive_months");
    const include_cold = searchParams.get("include_cold") === "true";

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Sorting (validated against whitelist)
    const rawSort = searchParams.get("sort") || "created_at";
    const sort = ALLOWED_SORT_FIELDS.has(rawSort) ? rawSort : "created_at";
    const rawOrder = searchParams.get("order") || "desc";
    const order: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

    // STEP 4: Build where clause
    const where: Record<string, unknown> = {
      deleted_at: null, // Exclude soft-deleted
    };

    // CSV multi-select → Prisma { in: [...] }
    if (status) where.status = { in: status };
    if (lead_stage) where.lead_stage = { in: lead_stage };
    if (priority) where.priority = { in: priority };
    if (source) where.source = { in: source };
    if (fleet_size) where.fleet_size = { in: fleet_size };
    if (language) where.language = { in: language };
    if (industry) where.industry = { in: industry };
    if (country_code) where.country_code = { in: country_code };
    if (loss_reason_code) where.loss_reason_code = { in: loss_reason_code };
    if (disqualification_reason)
      where.disqualification_reason = { in: disqualification_reason };
    if (platforms_used) where.platforms_used = { hasSome: platforms_used };
    if (assigned_to) where.assigned_to = assigned_to;

    // Range filters → Prisma { gte, lte }
    const scoreWhere: Record<string, number> = {};
    if (min_qualification_score !== undefined)
      scoreWhere.gte = min_qualification_score;
    if (max_qualification_score !== undefined)
      scoreWhere.lte = max_qualification_score;
    if (Object.keys(scoreWhere).length > 0)
      where.qualification_score = scoreWhere;

    const fitWhere: Record<string, number> = {};
    if (min_fit_score !== undefined) fitWhere.gte = min_fit_score;
    if (max_fit_score !== undefined) fitWhere.lte = max_fit_score;
    if (Object.keys(fitWhere).length > 0) where.fit_score = fitWhere;

    const engWhere: Record<string, number> = {};
    if (min_engagement_score !== undefined) engWhere.gte = min_engagement_score;
    if (max_engagement_score !== undefined) engWhere.lte = max_engagement_score;
    if (Object.keys(engWhere).length > 0) where.engagement_score = engWhere;

    // Date range filters
    const buildDateRange = (
      gte?: Date,
      lte?: Date
    ): Record<string, Date> | undefined => {
      const r: Record<string, Date> = {};
      if (gte) r.gte = gte;
      if (lte) r.lte = lte;
      return Object.keys(r).length > 0 ? r : undefined;
    };
    const lastActivityRange = buildDateRange(
      last_activity_at_gte,
      last_activity_at_lte
    );
    if (lastActivityRange) where.last_activity_at = lastActivityRange;
    const createdAtRange = buildDateRange(created_at_gte, created_at_lte);
    if (createdAtRange) where.created_at = createdAtRange;
    const nextActionRange = buildDateRange(
      next_action_date_gte,
      next_action_date_lte
    );
    if (nextActionRange) where.next_action_date = nextActionRange;
    const bookingRange = buildDateRange(
      booking_slot_at_gte,
      booking_slot_at_lte
    );
    if (bookingRange) where.booking_slot_at = bookingRange;

    // Boolean filters
    if (email_verified !== undefined) where.email_verified = email_verified;
    if (callback_requested !== undefined)
      where.callback_requested = callback_requested;
    if (gdpr_consent !== undefined) where.gdpr_consent = gdpr_consent;
    if (attendance_confirmed !== undefined)
      where.attendance_confirmed = attendance_confirmed;
    if (wizard_completed !== undefined)
      where.wizard_completed = wizard_completed;

    // Search across multiple fields
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { company_name: { contains: search, mode: "insensitive" } },
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { lead_code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Legacy cold leads filters
    if (include_cold) {
      const coldThreshold = new Date();
      coldThreshold.setMonth(coldThreshold.getMonth() - (inactive_months || 6));
      where.OR = [
        { status: { in: ["lost", "disqualified"] } },
        { updated_at: { lt: coldThreshold } },
      ];
    } else if (inactive_months) {
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
        data: leads.map((lead) => {
          // Destructure Prisma relation keys to exclude from spread
          const { eu1f9qh, crm_countries, ...scalar } = lead;
          return {
            ...scalar,
            // Decimal → number (Prisma Decimal serializes to string)
            fit_score: lead.fit_score ? Number(lead.fit_score) : null,
            engagement_score: lead.engagement_score
              ? Number(lead.engagement_score)
              : null,
            // Relations → clean objects
            country: crm_countries ?? null,
            assigned_to: eu1f9qh
              ? {
                  id: eu1f9qh.id,
                  first_name: eu1f9qh.first_name,
                  last_name: eu1f9qh.last_name,
                  email: eu1f9qh.email,
                }
              : null,
          };
        }),
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
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

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
