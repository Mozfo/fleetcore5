// Directory Vehicle Classes API routes: GET + POST /api/v1/directory/vehicle-classes
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listVehicleClassesSchema,
  createVehicleClassSchema,
} from "@/lib/validators/directory.validators";
import { hasPermission } from "@/lib/auth/permissions";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/directory/vehicle-classes
 * List vehicle classes (global data per country)
 *
 * Query Parameters:
 * - country_code (string, optional) - Filter by country code (2 chars)
 * - search (string, optional) - Search by name
 * - sortBy (enum: name|created_at, default: name)
 * - sortOrder (enum: asc|desc, default: asc)
 *
 * Response: Array of vehicle classes
 * [
 *   {
 *     id: "uuid",
 *     country_code: "FR",
 *     name: "Berline",
 *     description: "Standard sedan",
 *     max_age: 7,
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
      country_code: searchParams.get("country_code") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // 4. Validate query parameters with Zod
    const validatedQuery = listVehicleClassesSchema.parse(queryParams);

    // 5. Call DirectoryService to list vehicle classes
    const directoryService = new DirectoryService();
    const vehicleClasses = await directoryService.listVehicleClasses(
      validatedQuery.country_code,
      validatedQuery.search,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 6. Return vehicle classes array
    return NextResponse.json(vehicleClasses, { status: 200 });
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
 * POST /api/v1/directory/vehicle-classes
 * Create a new vehicle class (requires manage_directory or admin permission)
 *
 * Body:
 * {
 *   country_code: "FR",
 *   name: "Berline",
 *   description: "Standard sedan" (optional),
 *   max_age: 7 (optional)
 * }
 *
 * Response: Created vehicle class
 * {
 *   id: "uuid",
 *   country_code: "FR",
 *   name: "Berline",
 *   description: "Standard sedan",
 *   max_age: 7,
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
    const validatedData = createVehicleClassSchema.parse(body);

    // 5. Call DirectoryService to create vehicle class
    const directoryService = new DirectoryService();
    const vehicleClass =
      await directoryService.createVehicleClass(validatedData);

    // 6. Return created vehicle class
    return NextResponse.json(vehicleClass, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
