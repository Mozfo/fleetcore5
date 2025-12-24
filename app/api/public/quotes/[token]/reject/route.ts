/**
 * /api/public/quotes/[token]/reject
 * Reject quote (no auth required)
 *
 * @module app/api/public/quotes/[token]/reject
 */

import { NextRequest, NextResponse } from "next/server";
import { rejectQuoteByTokenAction } from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * POST /api/public/quotes/[token]/reject
 * Reject quote by public token (no auth)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;

  try {
    const body = await request.json();
    const result = await rejectQuoteByTokenAction({
      token,
      rejectionReason: body.rejectionReason,
    });

    if (!result.success) {
      const status = result.error.includes("expired")
        ? 410
        : result.error.includes("Invalid") || result.error.includes("not found")
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
      message: "Quote rejected",
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
