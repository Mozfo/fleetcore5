// Directory Vehicle Classes API routes: GET + POST /api/v1/directory/vehicle-classes
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import {
  listVehicleClassesSchema,
  createVehicleClassSchema,
} from "@/lib/validators/directory.validators";
import { ValidationError } from "@/lib/core/errors";
import { hasPermission } from "@/lib/auth/permissions";
import { z } from "zod";

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
      country_code: searchParams.get("country_code") || undefined,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "name",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // 3. Validate query parameters with Zod
    const validatedQuery = listVehicleClassesSchema.parse(queryParams);

    // 4. Call DirectoryService to list vehicle classes
    const directoryService = new DirectoryService();
    const vehicleClasses = await directoryService.listVehicleClasses(
      validatedQuery.country_code,
      validatedQuery.search,
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 5. Return vehicle classes array
    return NextResponse.json(vehicleClasses, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
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
    const validatedData = createVehicleClassSchema.parse(body);

    // 4. Call DirectoryService to create vehicle class
    const directoryService = new DirectoryService();
    const vehicleClass =
      await directoryService.createVehicleClass(validatedData);

    // 5. Return created vehicle class
    return NextResponse.json(vehicleClass, { status: 201 });
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
