/**
 * Demo Lead [id] Redirect - Backward Compatibility
 *
 * @deprecated This route is deprecated. Use /api/crm/demo-leads/[id] instead.
 * Will be removed in V7.0.
 *
 * @module app/api/demo-leads/[id]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Import handlers from new location
import {
  GET as newGET,
  PUT as newPUT,
  DELETE as newDELETE,
} from "@/app/api/crm/demo-leads/[id]/route";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * Add deprecation headers to response
 */
function addDeprecationHeaders(response: NextResponse): NextResponse {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", "2026-06-01");
  response.headers.set(
    "Link",
    '</api/crm/demo-leads/[id]>; rel="successor-version"'
  );
  return response;
}

/**
 * @deprecated Use GET /api/crm/demo-leads/[id] instead
 */
export async function GET(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  logger.warn(
    { leadId: id },
    "[DEPRECATED] GET /api/demo-leads/[id] called - use /api/crm/demo-leads/[id] instead"
  );

  const response = await newGET(request, context);
  return addDeprecationHeaders(response);
}

/**
 * @deprecated Use PUT /api/crm/demo-leads/[id] instead
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  logger.warn(
    { leadId: id },
    "[DEPRECATED] PUT /api/demo-leads/[id] called - use /api/crm/demo-leads/[id] instead"
  );

  const response = await newPUT(request, context);
  return addDeprecationHeaders(response);
}

/**
 * @deprecated Use DELETE /api/crm/demo-leads/[id] instead
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  logger.warn(
    { leadId: id },
    "[DEPRECATED] DELETE /api/demo-leads/[id] called - use /api/crm/demo-leads/[id] instead"
  );

  const response = await newDELETE(request, context);
  return addDeprecationHeaders(response);
}
