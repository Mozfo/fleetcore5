/**
 * GET /api/v1/notifications/stats
 * Get notification statistics and analytics
 * Requires authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { NotificationLogRepository } from "@/lib/repositories/notification-log.repository";
import { getStatsSchema } from "@/lib/validators/notification.validators";
import { prisma } from "@/lib/prisma";
import { ZodError } from "zod";

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized - Authentication required" },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries()
    );
    const validatedParams = getStatsSchema.parse(searchParams);

    // Initialize repository
    const logRepository = new NotificationLogRepository(prisma);

    // Fetch statistics
    const stats = await logRepository.getStats(
      validatedParams.tenantId,
      validatedParams.startDate,
      validatedParams.endDate
    );

    // Fetch template statistics (top 10 most used templates)
    const templateStats = await logRepository.getTemplateStats(
      validatedParams.tenantId,
      10
    );

    // Calculate derived metrics
    const deliveryRate =
      stats.total > 0
        ? parseFloat(((stats.delivered / stats.total) * 100).toFixed(2))
        : 0;

    const openRate =
      stats.delivered > 0
        ? parseFloat(((stats.opened / stats.delivered) * 100).toFixed(2))
        : 0;

    const clickRate =
      stats.opened > 0
        ? parseFloat(((stats.clicked / stats.opened) * 100).toFixed(2))
        : 0;

    const failureRate =
      stats.total > 0
        ? parseFloat(((stats.failed / stats.total) * 100).toFixed(2))
        : 0;

    const bounceRate =
      stats.total > 0
        ? parseFloat(((stats.bounced / stats.total) * 100).toFixed(2))
        : 0;

    // Return comprehensive statistics
    return NextResponse.json(
      {
        summary: {
          total: stats.total,
          pending: stats.pending,
          sent: stats.sent,
          delivered: stats.delivered,
          bounced: stats.bounced,
          opened: stats.opened,
          clicked: stats.clicked,
          failed: stats.failed,
        },
        metrics: {
          deliveryRate: `${deliveryRate}%`,
          openRate: `${openRate}%`,
          clickRate: `${clickRate}%`,
          failureRate: `${failureRate}%`,
          bounceRate: `${bounceRate}%`,
        },
        topTemplates: templateStats,
        filters: {
          tenantId: validatedParams.tenantId,
          startDate: validatedParams.startDate,
          endDate: validatedParams.endDate,
        },
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Internal server error
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
