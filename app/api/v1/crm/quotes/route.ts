/**
 * /api/v1/crm/quotes
 * Quote list and creation operations (GET, POST)
 *
 * Thin route layer that delegates to Server Actions.
 * Auth handled by actions via Clerk auth().
 *
 * @module app/api/v1/crm/quotes
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listQuotesAction,
  createQuoteAction,
} from "@/lib/actions/crm/quote.actions";

/**
 * GET /api/v1/crm/quotes
 * List quotes with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters - let the schema defaults handle undefined values
  const pageParam = searchParams.get("page");
  const limitParam = searchParams.get("limit");
  const result = await listQuotesAction({
    page: pageParam ? parseInt(pageParam) : 1,
    limit: limitParam ? parseInt(limitParam) : 20,
    status:
      (searchParams.get("status") as
        | "draft"
        | "sent"
        | "viewed"
        | "accepted"
        | "rejected"
        | "expired"
        | "converted") || undefined,
    opportunityId: searchParams.get("opportunityId") || undefined,
    sortBy:
      (searchParams.get("sortBy") as
        | "created_at"
        | "updated_at"
        | "valid_until"
        | "total_value"
        | "quote_reference") || "created_at",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: result.error } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.quotes,
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

/**
 * POST /api/v1/crm/quotes
 * Create a new quote
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createQuoteAction(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: result.error },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.quote,
        message: "Quote created successfully",
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to parse request body",
        },
      },
      { status: 400 }
    );
  }
}
