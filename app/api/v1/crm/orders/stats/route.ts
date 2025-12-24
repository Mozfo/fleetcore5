/**
 * /api/v1/crm/orders/stats
 * Order statistics
 *
 * @module app/api/v1/crm/orders/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrderStatsAction } from "@/lib/actions/crm/orders.actions";

/**
 * GET /api/v1/crm/orders/stats
 * Get order statistics
 */
export async function GET(_request: NextRequest) {
  const result = await getOrderStatsAction();

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: result.error } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: { activeCount: result.activeCount },
  });
}
