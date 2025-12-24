/**
 * /api/v1/crm/orders/[id]/fulfill
 * Fulfill order
 *
 * @module app/api/v1/crm/orders/[id]/fulfill
 */

import { NextRequest, NextResponse } from "next/server";
import { fulfillOrderAction } from "@/lib/actions/crm/orders.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/orders/[id]/fulfill
 * Mark order as fulfilled
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await fulfillOrderAction(id);

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
    message: "Order fulfilled successfully",
  });
}
