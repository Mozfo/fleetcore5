/**
 * /api/v1/crm/agreements/[id]/client-signature
 * Record client signature
 *
 * @module app/api/v1/crm/agreements/[id]/client-signature
 */

import { NextRequest, NextResponse } from "next/server";
import { recordClientSignatureAction } from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/agreements/[id]/client-signature
 * Record client signature on agreement
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await recordClientSignatureAction({
      agreementId: id,
      signatoryName: body.signatoryName,
      signatoryEmail: body.signatoryEmail,
      signatoryTitle: body.signatoryTitle,
      signatureIp: body.signatureIp,
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
      message: "Client signature recorded",
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
