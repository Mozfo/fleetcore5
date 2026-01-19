/**
 * Demo Lead Accept Redirect - Backward Compatibility
 *
 * @deprecated This route is deprecated. Use /api/crm/demo-leads/[id]/accept instead.
 * Will be removed in V7.0.
 *
 * @module app/api/demo-leads/[id]/accept/route
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";

// Import handler from new location
import { POST as newPOST } from "@/app/api/crm/demo-leads/[id]/accept/route";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * @deprecated Use POST /api/crm/demo-leads/[id]/accept instead
 */
export async function POST(request: NextRequest, context: RouteParams) {
  const { id } = await context.params;
  logger.warn(
    { leadId: id },
    "[DEPRECATED] POST /api/demo-leads/[id]/accept called - use /api/crm/demo-leads/[id]/accept instead"
  );

  const response = await newPOST(request, context);

  // Add deprecation headers
  response.headers.set("Deprecation", "true");
  response.headers.set("Sunset", "2026-06-01");
  response.headers.set(
    "Link",
    '</api/crm/demo-leads/[id]/accept>; rel="successor-version"'
  );

  return response;
}
