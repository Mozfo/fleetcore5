// Directory Platforms API routes: GET + POST /api/v1/directory/platforms
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listPlatformsSchema,
  createPlatformSchema,
} from "@/lib/validators/directory.validators";
import { hasPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/directory/platforms
 * List all platforms (global data)
 *
 * Query Parameters:
 * - search (string, optional) - Search by platform name
 * - sortBy (enum: name|created_at, default: name)
 * - sortOrder (enum: asc|desc, default: asc)
 *
 * Response: Array of platforms
 * [
 *   {
 *     id: "uuid",
 *     name: "Uber",
 *     api_config: { ... },
 *     created_at: "2025-01-01T00:00:00Z",
 *     updated_at: "2025-01-01T00:00:00Z"
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
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
    const validatedQuery = listPlatformsSchema.parse(queryParams);

    // 5. Call DirectoryService to list platforms
    const directoryService = new DirectoryService();
    const platforms = await directoryService.listPlatforms(
      validatedQuery.search,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 6. Return platforms array
    return NextResponse.json(platforms, { status: 200 });
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
 * POST /api/v1/directory/platforms
 * Create a new platform (requires manage_directory or admin permission)
 *
 * Body:
 * {
 *   name: "Bolt",
 *   api_config: { ... } (optional)
 * }
 *
 * Response: Created platform
 * {
 *   id: "uuid",
 *   name: "Bolt",
 *   api_config: { ... },
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

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createPlatformSchema.parse(body);

    // 5. Call DirectoryService to create platform
    const directoryService = new DirectoryService();
    const platform = await directoryService.createPlatform(validatedData);

    // 6. Return created platform
    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
