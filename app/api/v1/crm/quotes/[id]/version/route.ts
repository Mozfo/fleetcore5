/**
 * /api/v1/crm/quotes/[id]/version
 * Create new version of a quote
 *
 * @module app/api/v1/crm/quotes/[id]/version
 */

import { NextRequest, NextResponse } from "next/server";
import { createQuoteVersionAction } from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/quotes/[id]/version
 * Create new version of quote
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await createQuoteVersionAction(id);

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
      data: result.quote,
      message: "New quote version created successfully",
    },
    { status: 201 }
  );
}
