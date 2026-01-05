/**
 * /api/v1/crm/opportunities
 * Opportunity pipeline operations (GET, POST)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages opportunities in the sales pipeline.
 * Opportunities are created from qualified leads and track the deal lifecycle.
 *
 * Pipeline Stages: qualification -> demo -> proposal -> negotiation -> contract_sent
 * Status: open (active), won, lost, on_hold, cancelled
 *
 * Authentication flow:
 * 1. Middleware validates: userId + FleetCore Admin org membership + CRM role
 * 2. Middleware injects: x-user-id, x-org-id headers
 * 3. This route trusts middleware validation
 *
 * Security: Access restricted to FleetCore Admin users with CRM roles
 * (org:adm_admin, org:adm_commercial) - enforced at middleware level.
 *
 * @module app/api/v1/crm/opportunities
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type {
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
} from "@/types/crm";
import {
  getStageConfig,
  getStageProbability,
  getStageMaxDays,
  DEFAULT_OPPORTUNITY_STAGE,
} from "@/lib/config/opportunity-stages";
import { CreateOpportunitySchema } from "@/lib/validators/crm/opportunity.validators";
import { ZodError } from "zod";

/**
 * GET /api/v1/crm/opportunities
 * List opportunities with filtering, sorting, and pagination
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 *
 * Query Parameters:
 * - stage: Filter by pipeline stage (qualification, demo, proposal, negotiation, contract_sent)
 * - status: Filter by status (open, won, lost, on_hold, cancelled)
 * - assigned_to: Filter by assigned employee ID
 * - min_value: Minimum expected value
 * - max_value: Maximum expected value
 * - close_date_from: Filter by close date (from)
 * - close_date_to: Filter by close date (to)
 * - is_rotting: Filter deals exceeding max_days_in_stage
 * - search: Search in lead email, company_name, first_name, last_name
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - sort: Sort field (default: created_at)
 * - order: Sort order (asc/desc, default: desc)
 *
 * Response 200: Paginated list of opportunities with stats
 */
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Read authentication from middleware-injected headers
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Opportunity List] Missing auth headers - middleware may be misconfigured"
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
    const stage = searchParams.get("stage");
    const status = searchParams.get("status") || "open";
    const assigned_to = searchParams.get("assigned_to") || undefined;
    const minValueParam = searchParams.get("min_value");
    const maxValueParam = searchParams.get("max_value");
    const min_value = minValueParam ? parseFloat(minValueParam) : undefined;
    const max_value = maxValueParam ? parseFloat(maxValueParam) : undefined;
    const close_date_from = searchParams.get("close_date_from") || undefined;
    const close_date_to = searchParams.get("close_date_to") || undefined;
    const is_rotting = searchParams.get("is_rotting") === "true";
    const search = searchParams.get("search") || undefined;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Sorting
    const sort = searchParams.get("sort") || "created_at";
    const order = (searchParams.get("order") || "desc") as "asc" | "desc";

    // STEP 3: Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      deleted_at: null, // Exclude soft-deleted
    };

    // Apply filters
    if (stage) where.stage = stage;
    if (status) where.status = status;
    if (assigned_to) where.assigned_to = assigned_to;

    // Value range filter
    if (min_value !== undefined || max_value !== undefined) {
      where.expected_value = {};
      if (min_value !== undefined) where.expected_value.gte = min_value;
      if (max_value !== undefined) where.expected_value.lte = max_value;
    }

    // Close date range filter
    if (close_date_from || close_date_to) {
      where.close_date = {};
      if (close_date_from) where.close_date.gte = new Date(close_date_from);
      if (close_date_to) where.close_date.lte = new Date(close_date_to);
    }

    // Rotting filter: deals exceeding max_days_in_stage
    if (is_rotting) {
      // We'll filter this post-query since it requires date arithmetic
    }

    // Search across lead fields
    if (search) {
      where.xva1wvf = {
        OR: [
          { email: { contains: search, mode: "insensitive" } },
          { company_name: { contains: search, mode: "insensitive" } },
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    // STEP 4: Query opportunities
    const [opportunities, total] = await Promise.all([
      db.crm_opportunities.findMany({
        where,
        include: {
          xva1wvf: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              company_name: true,
              country_code: true,
              crm_countries: {
                select: {
                  country_code: true,
                  country_name_en: true,
                  flag_emoji: true,
                },
              },
            },
          },
          mfiaerr: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
        },
        orderBy: { [sort]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.crm_opportunities.count({ where }),
    ]);

    // STEP 5: Transform and filter rotting if needed
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let formattedOpportunities = opportunities.map((opp: any) => {
      const lead = opp.xva1wvf;
      const assignedTo = opp.mfiaerr;

      // Calculate days in stage
      const stageEnteredAt = new Date(opp.stage_entered_at);
      const daysInStage = Math.floor(
        (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const maxDays =
        opp.max_days_in_stage ?? getStageConfig(opp.stage)?.maxDays ?? 14;
      const isRotting = daysInStage > maxDays && opp.status === "open";

      return {
        id: opp.id,
        lead_id: opp.lead_id,
        stage: opp.stage as OpportunityStage,
        status: opp.status as OpportunityStatus,
        expected_value: opp.expected_value ? Number(opp.expected_value) : null,
        probability_percent: opp.probability_percent
          ? Number(opp.probability_percent)
          : null,
        forecast_value: opp.forecast_value ? Number(opp.forecast_value) : null,
        won_value: opp.won_value ? Number(opp.won_value) : null,
        currency: opp.currency,
        discount_amount: opp.discount_amount
          ? Number(opp.discount_amount)
          : null,
        close_date: opp.close_date?.toISOString() ?? null,
        expected_close_date: opp.expected_close_date?.toISOString() ?? null,
        won_date: opp.won_date?.toISOString() ?? null,
        lost_date: opp.lost_date?.toISOString() ?? null,
        created_at: opp.created_at.toISOString(),
        updated_at: opp.updated_at?.toISOString() ?? null,
        stage_entered_at: opp.stage_entered_at.toISOString(),
        max_days_in_stage: maxDays,
        days_in_stage: daysInStage,
        is_rotting: isRotting,
        assigned_to: opp.assigned_to,
        owner_id: opp.owner_id,
        pipeline_id: opp.pipeline_id,
        plan_id: opp.plan_id,
        contract_id: opp.contract_id,
        loss_reason: opp.loss_reason,
        notes: opp.notes,
        metadata: opp.metadata as Record<string, unknown>,
        lead: lead
          ? {
              id: lead.id,
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              company_name: lead.company_name,
              country_code: lead.country_code,
              country: lead.crm_countries
                ? {
                    country_code: lead.crm_countries.country_code,
                    country_name_en: lead.crm_countries.country_name_en,
                    flag_emoji: lead.crm_countries.flag_emoji,
                  }
                : null,
            }
          : undefined,
        assignedTo: assignedTo
          ? {
              id: assignedTo.id,
              first_name: assignedTo.first_name,
              last_name: assignedTo.last_name,
              email: assignedTo.email,
            }
          : null,
      } as Opportunity & { days_in_stage: number; is_rotting: boolean };
    });

    // Filter rotting opportunities if requested
    if (is_rotting) {
      formattedOpportunities = formattedOpportunities.filter(
        (opp) => opp.is_rotting
      );
    }

    // STEP 6: Calculate stats
    const stats = await calculateOpportunityStats(where);

    // STEP 7: Return response
    return NextResponse.json(
      {
        success: true,
        data: formattedOpportunities,
        pagination: {
          page,
          limit,
          total: is_rotting ? formattedOpportunities.length : total,
          totalPages: Math.ceil(
            (is_rotting ? formattedOpportunities.length : total) / limit
          ),
        },
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error(
      { error },
      "[CRM Opportunity List] Error fetching opportunities"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching opportunities",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate opportunity statistics
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function calculateOpportunityStats(baseWhere: Record<string, any>) {
  const now = new Date();

  // Get all open opportunities for stats
  const allOpportunities = await db.crm_opportunities.findMany({
    where: { ...baseWhere, status: "open" },
    select: {
      id: true,
      stage: true,
      status: true,
      expected_value: true,
      forecast_value: true,
      stage_entered_at: true,
      max_days_in_stage: true,
    },
  });

  // Calculate totals
  let totalValue = 0;
  let weightedValue = 0;
  let totalDaysInStage = 0;
  let rottingCount = 0;

  const byStage: Record<string, { count: number; value: number }> = {
    qualification: { count: 0, value: 0 },
    demo: { count: 0, value: 0 },
    proposal: { count: 0, value: 0 },
    negotiation: { count: 0, value: 0 },
    contract_sent: { count: 0, value: 0 },
  };

  for (const opp of allOpportunities) {
    const value = opp.expected_value ? Number(opp.expected_value) : 0;
    const forecast = opp.forecast_value ? Number(opp.forecast_value) : 0;

    totalValue += value;
    weightedValue += forecast;

    // Days in stage
    const stageEnteredAt = new Date(opp.stage_entered_at);
    const daysInStage = Math.floor(
      (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    totalDaysInStage += daysInStage;

    // Check rotting
    const maxDays =
      opp.max_days_in_stage ?? getStageConfig(opp.stage)?.maxDays ?? 14;
    if (daysInStage > maxDays) {
      rottingCount++;
    }

    // By stage
    if (byStage[opp.stage]) {
      byStage[opp.stage].count++;
      byStage[opp.stage].value += value;
    }
  }

  // Get counts by status
  const statusCounts = await db.crm_opportunities.groupBy({
    by: ["status"],
    where: { deleted_at: null },
    _count: true,
    _sum: { expected_value: true },
  });

  const byStatus: Record<string, { count: number; value: number }> = {
    open: { count: 0, value: 0 },
    won: { count: 0, value: 0 },
    lost: { count: 0, value: 0 },
    on_hold: { count: 0, value: 0 },
    cancelled: { count: 0, value: 0 },
  };

  for (const sc of statusCounts) {
    if (byStatus[sc.status]) {
      byStatus[sc.status].count = sc._count;
      byStatus[sc.status].value = sc._sum.expected_value
        ? Number(sc._sum.expected_value)
        : 0;
    }
  }

  return {
    total: allOpportunities.length,
    totalValue,
    weightedValue,
    byStage,
    byStatus,
    avgDaysInStage:
      allOpportunities.length > 0
        ? Math.round(totalDaysInStage / allOpportunities.length)
        : 0,
    rottingCount,
  };
}

/**
 * POST /api/v1/crm/opportunities
 * Create a new opportunity
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 *
 * Request Body:
 * - expected_value (required): Deal value in currency
 * - lead_id (optional): UUID of linked lead
 * - stage (optional): Pipeline stage (default: "qualification")
 * - currency (optional): Currency code (default: "EUR")
 * - expected_close_date (optional): Expected closing date
 * - assigned_to (optional): UUID of assigned employee
 * - notes (optional): Additional notes
 * - metadata (optional): Extra JSON data
 *
 * Response 201: Created opportunity with calculated fields
 * Response 400: Validation error
 * Response 401: Unauthorized
 * Response 404: Lead not found (if lead_id provided)
 * Response 500: Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Read authentication from middleware-injected headers
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    if (!userId || !orgId) {
      logger.error(
        { userId, orgId },
        "[CRM Opportunity Create] Missing auth headers - middleware may be misconfigured"
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

    // STEP 2: Parse and validate request body
    const body = await request.json();
    const validatedData = CreateOpportunitySchema.parse(body);

    // STEP 3: Verify lead exists (lead_id is required)
    const lead = await db.crm_leads.findUnique({
      where: { id: validatedData.lead_id },
      select: { id: true, company_name: true, email: true },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Lead not found",
          },
        },
        { status: 404 }
      );
    }

    // STEP 4: Calculate derived fields
    const stage = validatedData.stage || DEFAULT_OPPORTUNITY_STAGE;
    const probability = getStageProbability(stage);
    const maxDays = getStageMaxDays(stage);
    const forecastValue = validatedData.expected_value * (probability / 100);

    // STEP 5: Create opportunity
    const opportunity = await db.crm_opportunities.create({
      data: {
        lead_id: validatedData.lead_id,
        stage,
        status: validatedData.status || "open",
        expected_value: validatedData.expected_value,
        probability_percent: probability,
        forecast_value: forecastValue,
        currency: validatedData.currency || "EUR",
        expected_close_date: validatedData.expected_close_date
          ? new Date(validatedData.expected_close_date)
          : null,
        assigned_to: validatedData.assigned_to ?? undefined,
        notes: validatedData.notes || null,
        metadata: (validatedData.metadata || {
          created_by_clerk_id: userId,
        }) as object,
        stage_entered_at: new Date(),
        max_days_in_stage: maxDays,
      },
    });

    // Fetch full lead info for response
    const leadInfo = await db.crm_leads.findUnique({
      where: { id: opportunity.lead_id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        company_name: true,
      },
    });

    // STEP 6: Format response
    const response = {
      id: opportunity.id,
      lead_id: opportunity.lead_id,
      stage: opportunity.stage,
      status: opportunity.status as OpportunityStatus,
      expected_value: opportunity.expected_value
        ? Number(opportunity.expected_value)
        : null,
      probability_percent: opportunity.probability_percent
        ? Number(opportunity.probability_percent)
        : null,
      forecast_value: opportunity.forecast_value
        ? Number(opportunity.forecast_value)
        : null,
      currency: opportunity.currency,
      expected_close_date:
        opportunity.expected_close_date?.toISOString() ?? null,
      max_days_in_stage: opportunity.max_days_in_stage,
      stage_entered_at: opportunity.stage_entered_at.toISOString(),
      created_at: opportunity.created_at.toISOString(),
      lead: leadInfo
        ? {
            id: leadInfo.id,
            first_name: leadInfo.first_name,
            last_name: leadInfo.last_name,
            email: leadInfo.email,
            company_name: leadInfo.company_name,
          }
        : null,
    };

    logger.info(
      { opportunityId: opportunity.id, userId, leadId: opportunity.lead_id },
      "[CRM Opportunity Create] Opportunity created successfully"
    );

    return NextResponse.json(
      {
        success: true,
        data: response,
        message: "Opportunity created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
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

    logger.error(
      { error },
      "[CRM Opportunity Create] Error creating opportunity"
    );

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message:
            "An unexpected error occurred while creating the opportunity",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
