/**
 * GET /api/v1/notifications/history
 * Query notification history with filters and pagination
 * Requires authentication
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { NotificationLogRepository } from "@/lib/repositories/notification-log.repository";
import { queryHistorySchema } from "@/lib/validators/notification.validators";
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
    const validatedParams = queryHistorySchema.parse(searchParams);

    // Initialize repository
    const _logRepository = new NotificationLogRepository(prisma);

    // Build filters
    const filters: Record<string, unknown> = {
      deleted_at: null,
    };

    if (validatedParams.tenantId) {
      filters.tenant_id = validatedParams.tenantId;
    }

    if (validatedParams.recipientId) {
      filters.recipient_id = validatedParams.recipientId;
    }

    if (validatedParams.recipientEmail) {
      filters.recipient_email = validatedParams.recipientEmail;
    }

    if (validatedParams.status) {
      filters.status = validatedParams.status;
    }

    if (validatedParams.templateCode) {
      filters.template_code = validatedParams.templateCode;
    }

    if (validatedParams.channel) {
      filters.channel = validatedParams.channel;
    }

    if (validatedParams.startDate || validatedParams.endDate) {
      filters.created_at = {};
      if (validatedParams.startDate) {
        (filters.created_at as Record<string, Date>).gte =
          validatedParams.startDate;
      }
      if (validatedParams.endDate) {
        (filters.created_at as Record<string, Date>).lte =
          validatedParams.endDate;
      }
    }

    // Build sort options
    const orderBy: Record<string, string> = {};
    orderBy[validatedParams.sortBy] = validatedParams.sortOrder;

    // Calculate pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit;

    // Fetch logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.adm_notification_logs.findMany({
        where: filters,
        orderBy,
        skip,
        take: validatedParams.limit,
        select: {
          id: true,
          recipient_id: true,
          recipient_email: true,
          tenant_id: true,
          template_code: true,
          channel: true,
          status: true,
          locale_used: true,
          subject: true,
          external_id: true,
          created_at: true,
          sent_at: true,
          delivered_at: true,
          opened_at: true,
          clicked_at: true,
          failed_at: true,
          error_message: true,
        },
      }),
      prisma.adm_notification_logs.count({ where: filters }),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / validatedParams.limit);
    const hasNextPage = validatedParams.page < totalPages;
    const hasPreviousPage = validatedParams.page > 1;

    // Return paginated response
    return NextResponse.json(
      {
        data: logs,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          totalCount,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
        filters: validatedParams,
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
