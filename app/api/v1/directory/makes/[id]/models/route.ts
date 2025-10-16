// Directory Models by Make API route: GET /api/v1/directory/makes/:id/models
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/directory/makes/:id/models
 * List car models for a specific make (global + tenant-specific)
 *
 * Response: Array of car models
 * [
 *   {
 *     id: "uuid",
 *     tenant_id: null,           // null = global model
 *     make_id: "make-uuid",
 *     name: "Camry",
 *     vehicle_class_id: "class-uuid",
 *     created_at: "2025-01-01T00:00:00Z",
 *     updated_at: "2025-01-01T00:00:00Z"
 *   }
 * ]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id: makeId } = await params;

    // 4. Call DirectoryService to list models
    const directoryService = new DirectoryService();
    const models = await directoryService.listModelsByMake(makeId, tenantId);

    // 5. Return models array
    return NextResponse.json(models, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
