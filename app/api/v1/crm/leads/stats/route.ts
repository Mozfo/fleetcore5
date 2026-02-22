/**
 * /api/v1/crm/leads/stats
 * Lead statistics and KPIs for Reports dashboard
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Returns aggregated statistics for the Leads Reports page:
 * - Summary: totals by status/stage, cold leads count
 * - Conversion: rates, trends, average time to convert
 * - Quality: average scores (fit, engagement, qualification)
 * - Pipeline value: total and by status
 * - Time series: leads created over time (for charts)
 *
 * @module app/api/v1/crm/leads/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { resolveMemberId } from "@/lib/utils/audit-resolver";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * GET /api/v1/crm/leads/stats
 *
 * Query Parameters:
 * - start_date: Period start (ISO date, default: 30 days ago)
 * - end_date: Period end (ISO date, default: today)
 * - inactive_months: Cold lead threshold in months (default: 6)
 *
 * @example
 * GET /api/v1/crm/leads/stats?start_date=2025-01-01&end_date=2025-01-31&inactive_months=6
 */
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Authenticate via direct auth helper
    const { userId } = await requireCrmApiAuth();

    // STEP 2: Parse query params
    const { searchParams } = new URL(request.url);

    // Date range (default: last 30 days)
    const now = new Date();
    const defaultStart = new Date(now);
    defaultStart.setDate(defaultStart.getDate() - 30);

    const startDateStr = searchParams.get("start_date");
    const endDateStr = searchParams.get("end_date");
    const startDate = startDateStr ? new Date(startDateStr) : defaultStart;
    const endDate = endDateStr ? new Date(endDateStr) : now;

    // Cold leads threshold (default: 6 months)
    const inactiveMonths = parseInt(searchParams.get("inactive_months") || "6");
    const coldThreshold = new Date();
    coldThreshold.setMonth(coldThreshold.getMonth() - inactiveMonths);

    // Previous period for trend comparison
    const periodDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const previousStart = new Date(startDate);
    previousStart.setDate(previousStart.getDate() - periodDays);
    const previousEnd = new Date(startDate);
    previousEnd.setDate(previousEnd.getDate() - 1);

    // Get member UUID for "My Leads" count
    const member = await resolveMemberId(userId);
    const memberUuid = member?.id;

    // STEP 3: Execute ALL queries in parallel (optimized - no sequential queries)
    const [
      // Total counts
      totalLeads,
      totalLeadsPrevious,

      // By status
      statusCounts,

      // By stage
      stageCounts,

      // Cold leads (lost/disqualified OR inactive)
      coldLeadsCount,

      // Average scores
      avgScores,

      // Conversion stats
      qualifiedThisPeriod,
      qualifiedPreviousPeriod,
      convertedThisPeriod,
      convertedPreviousPeriod,

      // Average conversion time via SQL (optimized - no fetch of 1000 records)
      avgConversionTimeResult,

      // Time series for charts (leads created per week)
      timeSeriesData,

      // Source distribution
      sourceData,

      // Total this period (was sequential, now parallel)
      _totalThisPeriod,

      // Total previous period (was sequential, now parallel)
      totalPrevPeriod,

      // My leads
      myLeadsTotal,
      myLeadsActive,

      // All active leads (for Admin/Manager KPI)
      allActiveLeads,
    ] = await Promise.all([
      // Total leads (all time, not deleted)
      db.crm_leads.count({
        where: { deleted_at: null },
      }),

      // Total leads created in previous period
      db.crm_leads.count({
        where: {
          deleted_at: null,
          created_at: { gte: previousStart, lte: previousEnd },
        },
      }),

      // Count by status
      db.crm_leads.groupBy({
        by: ["status"],
        where: { deleted_at: null },
        _count: { id: true },
      }),

      // Count by stage
      db.crm_leads.groupBy({
        by: ["lead_stage"],
        where: { deleted_at: null },
        _count: { id: true },
      }),

      // Cold leads: lost/disqualified OR no update for X months
      db.crm_leads.count({
        where: {
          deleted_at: null,
          OR: [
            { status: { in: ["lost", "disqualified"] } },
            { updated_at: { lt: coldThreshold } },
          ],
        },
      }),

      // Average scores
      db.crm_leads.aggregate({
        where: { deleted_at: null },
        _avg: {
          fit_score: true,
          engagement_score: true,
          qualification_score: true,
        },
      }),

      // V6.3: Qualified this period (proposal_sent replaces qualified status)
      db.crm_leads.count({
        where: {
          deleted_at: null,
          status: "proposal_sent",
          qualified_date: { gte: startDate, lte: endDate },
        },
      }),

      // V6.3: Qualified previous period
      db.crm_leads.count({
        where: {
          deleted_at: null,
          status: "proposal_sent",
          qualified_date: { gte: previousStart, lte: previousEnd },
        },
      }),

      // Converted this period
      db.crm_leads.count({
        where: {
          deleted_at: null,
          status: "converted",
          converted_date: { gte: startDate, lte: endDate },
        },
      }),

      // Converted previous period
      db.crm_leads.count({
        where: {
          deleted_at: null,
          status: "converted",
          converted_date: { gte: previousStart, lte: previousEnd },
        },
      }),

      // Average conversion time via SQL aggregate (OPTIMIZED: no fetch of 1000 records)
      db.$queryRaw<Array<{ avg_days: number | null }>>`
        SELECT AVG(EXTRACT(EPOCH FROM (qualified_date - created_at)) / 86400)::numeric(10,1) as avg_days
        FROM crm_leads
        WHERE deleted_at IS NULL
          AND qualified_date IS NOT NULL
      `,

      // Time series: count by week for last 12 weeks
      db.$queryRaw<Array<{ week: Date; count: bigint }>>`
        SELECT
          date_trunc('week', created_at) as week,
          COUNT(*) as count
        FROM crm_leads
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - INTERVAL '12 weeks'
        GROUP BY date_trunc('week', created_at)
        ORDER BY week ASC
      `,

      // Source distribution (top 10)
      db.crm_leads.groupBy({
        by: ["source"],
        where: { deleted_at: null, source: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),

      // Total this period (moved from sequential to parallel)
      db.crm_leads.count({
        where: {
          deleted_at: null,
          created_at: { gte: startDate, lte: endDate },
        },
      }),

      // Total previous period (moved from sequential to parallel)
      db.crm_leads.count({
        where: {
          deleted_at: null,
          created_at: { gte: previousStart, lte: previousEnd },
        },
      }),

      // My leads count (assigned to current user)
      memberUuid
        ? db.crm_leads.count({
            where: {
              deleted_at: null,
              assigned_to: memberUuid,
            },
          })
        : Promise.resolve(0),

      // My active leads (assigned to me, not lost/disqualified)
      memberUuid
        ? db.crm_leads.count({
            where: {
              deleted_at: null,
              assigned_to: memberUuid,
              status: { notIn: ["lost", "disqualified", "converted"] },
            },
          })
        : Promise.resolve(0),

      // RÈGLE MÉTIER: Active leads = all leads EXCEPT lost/disqualified/converted
      db.crm_leads.count({
        where: {
          deleted_at: null,
          status: { notIn: ["lost", "disqualified", "converted"] },
        },
      }),
    ]);

    // STEP 4: Calculate derived metrics (no more sequential queries!)

    // Status counts as object
    const byStatus: Record<string, number> = {};
    statusCounts.forEach((s) => {
      if (s.status) byStatus[s.status] = s._count.id;
    });

    // Stage counts as object
    const byStage: Record<string, number> = {};
    stageCounts.forEach((s) => {
      if (s.lead_stage) byStage[s.lead_stage] = s._count.id;
    });

    // RÈGLE MÉTIER: Conversion Rate = qualified / (qualified + lost)
    // Quand un lead passe en lost, le dénominateur augmente → taux diminue
    const qualifiedCount = byStatus.qualified || 0;
    const lostCount = byStatus.lost || 0;
    const outcomeTotal = qualifiedCount + lostCount;

    const conversionRate =
      outcomeTotal > 0
        ? Math.round((qualifiedCount / outcomeTotal) * 100 * 10) / 10
        : 0;

    // Pour le trend, on garde la logique période (évolution dans le temps)
    const prevConversionRate =
      totalPrevPeriod > 0
        ? Math.round((qualifiedPreviousPeriod / totalPrevPeriod) * 100 * 10) /
          10
        : 0;

    const conversionTrend =
      prevConversionRate > 0
        ? Math.round(
            ((conversionRate - prevConversionRate) / prevConversionRate) * 100
          )
        : 0;

    // Average days to qualification (from SQL aggregate - no more loop over 1000 records)
    const avgDaysToQualification = Math.round(
      Number(avgConversionTimeResult[0]?.avg_days) || 0
    );

    // Total trend
    const totalTrend =
      totalLeadsPrevious > 0
        ? Math.round(
            ((totalLeads - totalLeadsPrevious) / totalLeadsPrevious) * 100
          )
        : 0;

    // Format time series for charts
    const timeSeries = timeSeriesData.map((row) => ({
      week: row.week.toISOString().split("T")[0],
      count: Number(row.count),
    }));

    // Format source distribution
    const sources = sourceData.map((s) => ({
      source: s.source || "unknown",
      count: s._count.id,
    }));

    // STEP 5: Return structured response with caching headers
    return NextResponse.json(
      {
        success: true,
        data: {
          summary: {
            total: totalLeads,
            total_trend: totalTrend,
            by_status: byStatus,
            by_stage: byStage,
            cold_leads: coldLeadsCount,
            cold_threshold_months: inactiveMonths,
          },
          conversion: {
            rate: conversionRate,
            rate_previous: prevConversionRate,
            trend: conversionTrend,
            avg_days_to_qualification: avgDaysToQualification,
            qualified_this_period: qualifiedThisPeriod,
            qualified_previous_period: qualifiedPreviousPeriod,
            converted_this_period: convertedThisPeriod,
            converted_previous_period: convertedPreviousPeriod,
          },
          quality: {
            avg_fit_score:
              Math.round((Number(avgScores._avg.fit_score) || 0) * 10) / 10,
            avg_engagement_score:
              Math.round((Number(avgScores._avg.engagement_score) || 0) * 10) /
              10,
            avg_qualification_score:
              Math.round(
                (Number(avgScores._avg.qualification_score) || 0) * 10
              ) / 10,
          },
          charts: {
            time_series: timeSeries,
            status_distribution: Object.entries(byStatus).map(
              ([status, count]) => ({
                status,
                count,
              })
            ),
            sources,
          },
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            previous_start: previousStart.toISOString(),
            previous_end: previousEnd.toISOString(),
          },
          my_leads: {
            total: myLeadsTotal,
            active: myLeadsActive,
          },
          // RÈGLE MÉTIER: Active leads pour KPI Admin/Manager
          active_leads: allActiveLeads,
        },
      },
      {
        status: 200,
        headers: {
          // NO CACHE: stats must update immediately after status changes
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
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

    logger.error({ error }, "[CRM Lead Stats] Error fetching stats");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch lead statistics",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
