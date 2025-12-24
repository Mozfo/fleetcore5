/**
 * /api/v1/crm/quotes/stats
 * Quote statistics
 *
 * @module app/api/v1/crm/quotes/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getQuoteStatsAction } from "@/lib/actions/crm/quote.actions";

/**
 * GET /api/v1/crm/quotes/stats
 * Get quote statistics
 */
export async function GET(_request: NextRequest) {
  const result = await getQuoteStatsAction();

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: result.error } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.stats,
  });
}
