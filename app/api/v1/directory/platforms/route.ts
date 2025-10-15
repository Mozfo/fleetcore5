// Directory Platforms API routes: GET + POST /api/v1/directory/platforms
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listPlatformsSchema,
  createPlatformSchema,
} from "@/lib/validators/directory.validators";
import { ValidationError } from "@/lib/core/errors";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";
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
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // 3. Validate query parameters with Zod
    const validatedQuery = listPlatformsSchema.parse(queryParams);

    // 4. Call DirectoryService to list platforms
    const directoryService = new DirectoryService();
    const platforms = await directoryService.listPlatforms(
      validatedQuery.search,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 5. Return platforms array
    return NextResponse.json(platforms, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createPlatformSchema.parse(body);

    // 4. Call DirectoryService to create platform
    const directoryService = new DirectoryService();
    const platform = await directoryService.createPlatform(validatedData);

    // 5. Return created platform
    return NextResponse.json(platform, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
