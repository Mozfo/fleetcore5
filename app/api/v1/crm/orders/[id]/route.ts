/**
 * /api/v1/crm/orders/[id]
 * Order detail operations (GET)
 *
 * @module app/api/v1/crm/orders/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrderAction } from "@/lib/actions/crm/orders.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/crm/orders/[id]
 * Get order details with relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getOrderAction(id);

  if (!result.success) {
    const status = result.error.includes("Invalid") ? 400 : 404;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: status === 400 ? "INVALID_UUID" : "NOT_FOUND",
          message: result.error,
        },
      },
      { status }
    );
  }

  if (!result.order) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Order not found" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: result.order });
}
