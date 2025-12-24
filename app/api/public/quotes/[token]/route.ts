/**
 * /api/public/quotes/[token]
 * Public quote view (no auth required)
 *
 * @module app/api/public/quotes/[token]
 */

import { NextRequest, NextResponse } from "next/server";
import { viewQuoteByTokenAction } from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ token: string }> };

/**
 * GET /api/public/quotes/[token]
 * View quote by public token (no auth)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { token } = await params;
  const result = await viewQuoteByTokenAction(token);

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
  });
}
