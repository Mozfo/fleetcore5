/**
 * Internal Audit Log API Route
 *
 * Purpose: Receive audit events from middleware (Edge Runtime) and persist to database
 * Security: Protected by INTERNAL_AUDIT_TOKEN header validation
 * Runtime: Node.js (Prisma compatible)
 */

import { NextResponse } from "next/server";
import { auditLog } from "@/lib/audit";
import type { AuditAction, AuditEntityType } from "@/lib/audit";

/**
 * POST /api/internal/audit
 *
 * Expected body:
 * {
 *   tenant_id: string | null,
 *   action: AuditAction,
 *   entity: AuditEntityType,
 *   entity_id: string,
 *   ip_address?: string | null,
 *   user_agent?: string | null,
 *   metadata?: Record<string, unknown>
 * }
 */
export async function POST(request: Request) {
  try {
    // SECURITY: Validate internal token
    const token = request.headers.get("x-internal-audit-token");
    const expectedToken = process.env.INTERNAL_AUDIT_TOKEN;

    if (!expectedToken) {
      // Fail-closed: If token not configured, block all requests
      return NextResponse.json(
        { error: "Internal audit token not configured" },
        { status: 500 }
      );
    }

    if (token !== expectedToken) {
      // Invalid or missing token - return 403
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    // Call auditLog helper (handles Prisma persistence)
    await auditLog({
      tenantId: body.tenant_id ?? null,
      action: body.action as AuditAction,
      entityType: body.entity as AuditEntityType,
      entityId: body.entity_id,
      ipAddress: body.ip_address ?? null,
      userAgent: body.user_agent ?? null,
      metadata: body.metadata ?? null,
    });

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (_error) {
    // Log error but don't expose details to client
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
