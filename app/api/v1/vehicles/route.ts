// Vehicle API routes: POST /api/v1/vehicles (create) and GET /api/v1/vehicles (list)
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import {
  createVehicleSchema,
  vehicleQuerySchema,
} from "@/lib/validators/vehicles.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { handleApiError } from "@/lib/api/error-handler";
import { z } from "zod";

/**
 * POST /api/v1/vehicles
 * Create a new vehicle
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createVehicleSchema.parse(body);

    // 4. Call VehicleService to create vehicle
    const vehicleService = new VehicleService();
    const vehicle = await vehicleService.createVehicle(
      validatedData,
      userId,
      tenantId
    );

    // 5. Return created vehicle
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * GET /api/v1/vehicles
 * List vehicles with pagination and filters
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
      status: searchParams.get("status") || undefined,
      make_id: searchParams.get("make_id") || undefined,
      model_id: searchParams.get("model_id") || undefined,
      vehicle_class: searchParams.get("vehicle_class") || undefined,
      fuel_type: searchParams.get("fuel_type") || undefined,
      min_year: searchParams.get("min_year") || undefined,
      max_year: searchParams.get("max_year") || undefined,
      min_seats: searchParams.get("min_seats") || undefined,
      max_seats: searchParams.get("max_seats") || undefined,
    };

    // 3. Validate query parameters with Zod
    const validatedQuery = vehicleQuerySchema.parse(queryParams);

    // 4. Extract filters and pagination options
    const filters = {
      status: validatedQuery.status,
      make_id: validatedQuery.make_id,
      model_id: validatedQuery.model_id,
      vehicle_class: validatedQuery.vehicle_class,
      fuel_type: validatedQuery.fuel_type,
      min_year: validatedQuery.min_year,
      max_year: validatedQuery.max_year,
      min_seats: validatedQuery.min_seats,
      max_seats: validatedQuery.max_seats,
    };

    const paginationOptions = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sortBy,
      sortOrder: validatedQuery.sortOrder,
    };

    // 5. Call VehicleService to list vehicles
    const vehicleService = new VehicleService();
    const result = await vehicleService.listVehicles(
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
