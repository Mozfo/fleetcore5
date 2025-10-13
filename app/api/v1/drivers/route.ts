// Driver API routes: POST /api/v1/drivers (create) and GET /api/v1/drivers (list)
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import {
  createDriverSchema,
  driverQuerySchema,
} from "@/lib/validators/drivers.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { z } from "zod";

/**
 * POST /api/v1/drivers
 * Create a new driver
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validatedData = createDriverSchema.parse(body);

    // 3. Call DriverService to create driver
    const driverService = new DriverService();
    const driver = await driverService.createDriver(
      validatedData,
      userId,
      tenantId
    );

    // 4. Return created driver
    return NextResponse.json(driver, { status: 201 });
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
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/drivers
 * List drivers with pagination and filters
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
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sortBy: searchParams.get("sortBy") || "created_at",
      sortOrder: searchParams.get("sortOrder") || "desc",
      driver_status: searchParams.get("driver_status") || undefined,
      cooperation_type: searchParams.get("cooperation_type") || undefined,
      rating_min: searchParams.get("rating_min") || undefined,
      rating_max: searchParams.get("rating_max") || undefined,
      search: searchParams.get("search") || undefined,
      has_active_assignment:
        searchParams.get("has_active_assignment") || undefined,
      expiring_documents: searchParams.get("expiring_documents") || undefined,
    };

    // 3. Validate query parameters with Zod
    const validatedQuery = driverQuerySchema.parse(queryParams);

    // 4. Extract filters and pagination options
    const filters = {
      driver_status: validatedQuery.driver_status,
      cooperation_type: validatedQuery.cooperation_type,
      rating_min: validatedQuery.rating_min,
      rating_max: validatedQuery.rating_max,
      search: validatedQuery.search,
      has_active_assignment: validatedQuery.has_active_assignment,
      expiring_documents: validatedQuery.expiring_documents,
    };

    const paginationOptions = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    };

    // 5. Call DriverService to list drivers
    const driverService = new DriverService();
    const result = await driverService.listDrivers(
      filters,
      paginationOptions,
      tenantId
    );

    // 6. Return paginated result
    return NextResponse.json(result, { status: 200 });
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
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
