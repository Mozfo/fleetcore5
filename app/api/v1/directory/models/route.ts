// Directory Models API route: POST /api/v1/directory/models
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import { createModelSchema } from "@/lib/validators/directory.validators";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

/**
 * POST /api/v1/directory/models
 * Create a new car model (requires manage_directory or admin permission)
 *
 * Body:
 * {
 *   make_id: "uuid",
 *   name: "My Custom Model",
 *   vehicle_class_id: "uuid" (optional)
 * }
 *
 * Response: Created car model
 * {
 *   id: "uuid",
 *   tenant_id: "tenant-uuid",  // null if global admin, tenant UUID otherwise
 *   make_id: "make-uuid",
 *   name: "My Custom Model",
 *   vehicle_class_id: "class-uuid",
 *   created_at: "2025-01-01T00:00:00Z",
 *   updated_at: "2025-01-01T00:00:00Z"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Check permission (manage_directory or admin)
    const permCheck = await hasPermission(userId, tenantId, "manage_directory");

    if (!permCheck.hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage directory" },
        { status: 403 }
      );
    }

    // 3. Determine target tenant_id (null if global admin, tenantId otherwise)
    const targetTenantId = permCheck.isGlobalAdmin ? null : tenantId;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createModelSchema.parse(body);

    // 5. Call DirectoryService to create model
    const directoryService = new DirectoryService();
    const model = await directoryService.createModel(
      validatedData,
      targetTenantId,
      tenantId // Use tenantId for checking make access
    );

    // 6. Return created model
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
