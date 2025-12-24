/**
 * /api/v1/crm/agreements/[id]/activate
 * Activate agreement
 *
 * @module app/api/v1/crm/agreements/[id]/activate
 */

import { NextRequest, NextResponse } from "next/server";
import { activateAgreementAction } from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/agreements/[id]/activate
 * Activate agreement after signatures
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await activateAgreementAction(id);

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
    data: result.agreement,
    message: "Agreement activated",
  });
}
