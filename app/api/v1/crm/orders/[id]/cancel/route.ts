/**
 * /api/v1/crm/orders/[id]/cancel
 * Cancel order
 *
 * @module app/api/v1/crm/orders/[id]/cancel
 */

import { NextRequest, NextResponse } from "next/server";
import { cancelOrderAction } from "@/lib/actions/crm/orders.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/orders/[id]/cancel
 * Cancel order with reason
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await cancelOrderAction({
      orderId: id,
      reason: body.reason,
    });

    if (!result.success) {
      const status = result.error.includes("Invalid")
        ? 400
        : result.error.includes("not found")
          ? 404
          : 400;
      return NextResponse.json(
        { success: false, error: { code: "ERROR", message: result.error } },
        { status }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.order,
      message: "Order cancelled successfully",
    });
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
