/**
 * Admin Audit API
 *
 * Query and export audit logs (admin/support only).
 * Requires audit.read permission for GET, audit.export for POST.
 *
 * @module app/api/v1/admin/audit
 */

import { NextRequest, NextResponse } from "next/server";
import { AuditService } from "@/lib/services/admin/audit.service";
import { requireAuth } from "@/lib/middleware/auth.middleware";
import { requirePermission } from "@/lib/middleware/rbac.middleware";
import { z } from "zod";

/**
 * Query parameters schema for audit log filtering
 */
const AuditQuerySchema = z.object({
  entity: z.string().optional(),
  action: z.string().optional(),
  member_id: z.string().uuid().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

/**
 * GET /api/v1/admin/audit
 *
 * Query audit logs with filters and pagination.
 *
 * Permissions: Requires audit.read permission
 *
 * Query params:
 * - entity (optional): Filter by entity type (e.g., 'lead', 'member')
 * - action (optional): Filter by action (e.g., 'create', 'update', 'delete')
 * - member_id (optional): Filter by member who performed action
 * - date_from (optional): Filter by timestamp >= date_from (ISO 8601)
 * - date_to (optional): Filter by timestamp <= date_to (ISO 8601)
 * - limit (optional): Number of results per page (default 20, max 100)
 * - offset (optional): Pagination offset (default 0)
 *
 * Returns:
 * {
 *   logs: [...],
 *   total: number,
 *   pagination: { limit, offset, hasMore }
 * }
 *
 * @example
 * GET /api/v1/admin/audit?entity=lead&action=delete&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate
    const { userId, tenantId } = await requireAuth(req);

    // 2. Check permission (admin or support only)
    await requirePermission(userId, tenantId, "audit.read");

    // 3. Parse and validate query params
    const searchParams = req.nextUrl.searchParams;
    const queryParams = {
      entity: searchParams.get("entity") || undefined,
      action: searchParams.get("action") || undefined,
      member_id: searchParams.get("member_id") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      limit: searchParams.get("limit") || "20",
      offset: searchParams.get("offset") || "0",
    };

    const validated = AuditQuerySchema.parse(queryParams);

    // 4. Query audit logs
    const auditService = new AuditService();
    const result = await auditService.query({
      tenantId, // CRITICAL: Always filter by tenant
      entity: validated.entity as never,
      action: validated.action as never,
      memberId: validated.member_id,
      dateFrom: validated.date_from ? new Date(validated.date_from) : undefined,
      dateTo: validated.date_to ? new Date(validated.date_to) : undefined,
      limit: validated.limit,
      offset: validated.offset,
    });

    // 5. Return results with pagination metadata
    return NextResponse.json({
      logs: result.logs,
      total: result.total,
      pagination: {
        limit: validated.limit,
        offset: validated.offset,
        hasMore: validated.offset + validated.limit < result.total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
