/**
 * /api/v1/crm/agreements/[id]/version
 * Create new version of agreement
 *
 * @module app/api/v1/crm/agreements/[id]/version
 */

import { NextRequest, NextResponse } from "next/server";
import { createNewVersionAction } from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/agreements/[id]/version
 * Create new version of agreement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await createNewVersionAction({ originalAgreementId: id });

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

  return NextResponse.json(
    {
      success: true,
      data: result.agreement,
      message: "New agreement version created",
    },
    { status: 201 }
  );
}
