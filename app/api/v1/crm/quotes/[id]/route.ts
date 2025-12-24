/**
 * /api/v1/crm/quotes/[id]
 * Quote detail operations (GET, PUT, DELETE)
 *
 * @module app/api/v1/crm/quotes/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getQuoteWithRelationsAction,
  updateQuoteAction,
  deleteQuoteAction,
} from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/crm/quotes/[id]
 * Get quote details with items and relations
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await getQuoteWithRelationsAction(id);

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

  if (!result.quote) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "NOT_FOUND", message: "Quote not found" },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: result.quote });
}

/**
 * PUT /api/v1/crm/quotes/[id]
 * Update a quote
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await updateQuoteAction(id, body);

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
      data: result.quote,
      message: "Quote updated successfully",
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
 * DELETE /api/v1/crm/quotes/[id]
 * Soft delete a quote
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  // Parse optional reason from body
  let reason: string | undefined;
  try {
    const body = await request.json();
    reason = body.reason;
  } catch {
    // No body provided
  }

  const result = await deleteQuoteAction(id, reason || "Deleted via API");

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
