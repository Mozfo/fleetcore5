/**
 * Demo Leads Redirect - Backward Compatibility
 *
 * @deprecated This route is deprecated. Use /api/crm/demo-leads instead.
 * Will be removed in V7.0.
 *
 * Forwards all requests to the new modular route location.
 *
 * @module app/api/demo-leads/route
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// Import handlers from new location
import {
  POST as newPOST,
  GET as newGET,
} from "@/app/api/crm/demo-leads/route";

/**
 * Add deprecation headers to response
 */
function addDeprecationHeaders(response: NextResponse): NextResponse {
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", "2026-06-01");
  response.headers.set("Link", '</api/crm/demo-leads>; rel="successor-version"');
  return response;
}

/**
 * @deprecated Use POST /api/crm/demo-leads instead
 */
export async function POST(request: NextRequest) {
  logger.warn(
    { url: request.url },
    "[DEPRECATED] /api/demo-leads called - use /api/crm/demo-leads instead"
  );

  const response = await newPOST(request);
  return addDeprecationHeaders(response);
}

/**
 * @deprecated Use GET /api/crm/demo-leads instead
 */
export async function GET() {
  logger.warn(
    "[DEPRECATED] GET /api/demo-leads called - use /api/crm/demo-leads instead"
  );

  const response = await newGET();
  return addDeprecationHeaders(response);
}
