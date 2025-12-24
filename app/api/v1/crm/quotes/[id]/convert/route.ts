/**
 * /api/v1/crm/quotes/[id]/convert
 * Convert accepted quote to order
 *
 * @module app/api/v1/crm/quotes/[id]/convert
 */

import { NextRequest, NextResponse } from "next/server";
import { convertQuoteToOrderAction } from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/quotes/[id]/convert
 * Convert quote to order
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const result = await convertQuoteToOrderAction({
      quoteId: id,
      ...body,
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

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        message: "Quote converted to order successfully",
      },
      { status: 201 }
    );
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
