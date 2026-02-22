// Directory Makes API routes: GET + POST /api/v1/directory/makes
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listMakesSchema,
  createMakeSchema,
} from "@/lib/validators/directory.validators";
import { hasPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

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
  try {
    // 1. Auth check
    const { tenantId } = await requireTenantApiAuth();

    // 2. Parse query parameters
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

    // 5. Return makes array
    return NextResponse.json(makes, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
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
  try {
    // 1. Auth check
    const { userId, tenantId } = await requireTenantApiAuth();

    // 2. Check permission (manage_directory or admin)
    const permCheck = await hasPermission(userId, tenantId, "manage_directory");

    if (!permCheck.hasPermission) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to manage directory" },
        { status: 403 }
      );
    }

    // 4. V2: tenant_id is now NOT NULL, must use tenantId
    // Global admins still create resources scoped to their tenant

    // 5. Parse and validate request body
    const body = await request.json();
    const validatedData = createMakeSchema.parse(body);

    // 6. Call DirectoryService to create make
    const directoryService = new DirectoryService();
    const make = await directoryService.createMake(validatedData, tenantId);

    // 6. Return created make
    return NextResponse.json(make, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
    });
  }
}
