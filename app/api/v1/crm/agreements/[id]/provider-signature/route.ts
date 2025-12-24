/**
 * /api/v1/crm/agreements/[id]/provider-signature
 * Record provider signature
 *
 * @module app/api/v1/crm/agreements/[id]/provider-signature
 */

import { NextRequest, NextResponse } from "next/server";
import { recordProviderSignatureAction } from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/agreements/[id]/provider-signature
 * Record provider signature on agreement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await recordProviderSignatureAction({
      agreementId: id,
      signatoryId: body.signatoryId,
      signatoryName: body.signatoryName,
      signatoryTitle: body.signatoryTitle,
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
      message: "Provider signature recorded",
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
