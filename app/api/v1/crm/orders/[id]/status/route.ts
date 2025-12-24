/**
 * /api/v1/crm/orders/[id]/status
 * Update order status
 *
 * @module app/api/v1/crm/orders/[id]/status
 */

import { NextRequest, NextResponse } from "next/server";
import { updateOrderStatusAction } from "@/lib/actions/crm/orders.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/v1/crm/orders/[id]/status
 * Update order status
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await updateOrderStatusAction({
      orderId: id,
      status: body.status,
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
      message: "Order status updated successfully",
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
