/**
 * /api/v1/crm/orders
 * Order list and creation operations (GET, POST)
 *
 * @module app/api/v1/crm/orders
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listOrdersAction,
  createOrderAction,
} from "@/lib/actions/crm/orders.actions";

/**
 * GET /api/v1/crm/orders
 * List orders with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters with defaults
  const result = await listOrdersAction({
    page: searchParams.get("page")
      ? parseInt(searchParams.get("page") ?? "1")
      : 1,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit") ?? "20")
      : 20,
    status: searchParams.get("status") || undefined,
    fulfillmentStatus:
      (searchParams.get("fulfillmentStatus") as
        | "pending"
        | "active"
        | "fulfilled"
        | "cancelled") || undefined,
    orderType:
      (searchParams.get("orderType") as
        | "new"
        | "renewal"
        | "upgrade"
        | "downgrade"
        | "amendment") || undefined,
    sortBy:
      (searchParams.get("sortBy") as
        | "created_at"
        | "effective_date"
        | "expiry_date"
        | "total_value"
        | "order_reference") || "created_at",
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
    data: result.orders,
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

/**
 * POST /api/v1/crm/orders
 * Create a new order from opportunity
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createOrderAction(body);

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
        data: result.data,
        message: "Order created successfully",
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
