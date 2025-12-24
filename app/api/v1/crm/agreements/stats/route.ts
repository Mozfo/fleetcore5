/**
 * /api/v1/crm/agreements/stats
 * Agreement statistics
 *
 * @module app/api/v1/crm/agreements/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { getAgreementStatsAction } from "@/lib/actions/crm/agreements.actions";

/**
 * GET /api/v1/crm/agreements/stats
 * Get agreement statistics
 */
export async function GET(_request: NextRequest) {
  const result = await getAgreementStatsAction();

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
