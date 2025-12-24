/**
 * /api/v1/crm/quotes/[id]/send
 * Send quote to client
 *
 * @module app/api/v1/crm/quotes/[id]/send
 */

import { NextRequest, NextResponse } from "next/server";
import { sendQuoteAction } from "@/lib/actions/crm/quote.actions";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/v1/crm/quotes/[id]/send
 * Send quote to client (generates public token)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const result = await sendQuoteAction(id);

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
    data: result.data,
    message: "Quote sent successfully",
  });
}
