// Directory Makes API routes: GET + POST /api/v1/directory/makes
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listMakesSchema,
  createMakeSchema,
} from "@/lib/validators/directory.validators";
import { hasPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/directory/makes
 * List car makes (global + tenant-specific)
 *
 * Query Parameters:
 * - search (string, optional) - Search by make name
 * - sortBy (enum: name|created_at, default: name)
 * - sortOrder (enum: asc|desc, default: asc)
 *
 * Response: Array of car makes
 * [
 *   {
 *     id: "uuid",
 *     tenant_id: null,         // null = global make
 *     name: "Toyota",
 *     created_at: "2025-01-01T00:00:00Z",
 *     updated_at: "2025-01-01T00:00:00Z"
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // 4. Validate query parameters with Zod
    const validatedQuery = listMakesSchema.parse(queryParams);

    // 5. Call DirectoryService to list makes
    const directoryService = new DirectoryService();
    const makes = await directoryService.listMakes(
      tenantId,
      validatedQuery.search,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 6. Return makes array
    return NextResponse.json(makes, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * POST /api/v1/directory/makes
 * Create a new car make (requires manage_directory or admin permission)
 *
 * Body:
 * {
 *   name: "My Custom Make"
 * }
 *
 * Response: Created car make
 * {
 *   id: "uuid",
 *   tenant_id: "tenant-uuid",  // null if global admin, tenant UUID otherwise
 *   name: "My Custom Make",
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
    const validatedData = createMakeSchema.parse(body);

    // 6. Call DirectoryService to create make
    const directoryService = new DirectoryService();
    const make = await directoryService.createMake(
      validatedData,
      targetTenantId
    );

    // 7. Return created make
    return NextResponse.json(make, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
