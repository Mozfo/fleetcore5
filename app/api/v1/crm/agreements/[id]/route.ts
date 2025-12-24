/**
 * /api/v1/crm/agreements/[id]
 * Agreement detail operations (GET, PUT, DELETE)
 *
 * @module app/api/v1/crm/agreements/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getAgreementWithRelationsAction,
  updateAgreementAction,
  deleteAgreementAction,
} from "@/lib/actions/crm/agreements.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/crm/agreements/[id]
 * Get agreement details with relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getAgreementWithRelationsAction(id);

  if (!result.success) {
    const status = result.error.includes("Invalid") ? 400 : 404;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: status === 400 ? "INVALID_UUID" : "NOT_FOUND",
          message: result.error,
        },
      },
      { status }
    );
  }

  if (!result.agreement) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Agreement not found" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: result.agreement });
}

/**
 * PUT /api/v1/crm/agreements/[id]
 * Update an agreement
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await updateAgreementAction(id, body);

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
      message: "Agreement updated successfully",
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

/**
 * DELETE /api/v1/crm/agreements/[id]
 * Soft delete an agreement
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  let reason: string | undefined;
  try {
    const body = await request.json();
    reason = body.reason;
  } catch {
    // No body provided
  }

  const result = await deleteAgreementAction({
    agreementId: id,
    reason: reason || "Deleted via API",
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

  return new NextResponse(null, { status: 204 });
}
