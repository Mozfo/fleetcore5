/**
 * /api/v1/crm/agreements/[id]/terminate
 * Terminate agreement
 *
 * @module app/api/v1/crm/agreements/[id]/terminate
 */

import { NextRequest, NextResponse } from "next/server";
import { terminateAgreementAction } from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/agreements/[id]/terminate
 * Terminate active agreement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await terminateAgreementAction({
      agreementId: id,
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
      data: result.agreement,
      message: "Agreement terminated",
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
