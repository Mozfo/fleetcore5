// Directory Models API route: POST /api/v1/directory/models
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import { createModelSchema } from "@/lib/validators/directory.validators";
import { hasPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/error-handler";

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
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Check permission (manage_directory or admin)
    const permCheck = await hasPermission(userId, tenantId, "manage_directory");

    if (!permCheck.hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage directory" },
        { status: 403 }
      );
    }

    // 4. Determine target tenant_id (null if global admin, tenantId otherwise)
    const targetTenantId = permCheck.isGlobalAdmin ? null : tenantId;

    // 5. Parse and validate request body
    const body = await request.json();
    const validatedData = createModelSchema.parse(body);

    // 6. Call DirectoryService to create model
    const directoryService = new DirectoryService();
    const model = await directoryService.createModel(
      validatedData,
      targetTenantId,
      tenantId // Use tenantId for checking make access
    );

    // 7. Return created model
    return NextResponse.json(model, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
