// Vehicle API routes: POST /api/v1/vehicles (create) and GET /api/v1/vehicles (list)
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import {
  createVehicleSchema,
  vehicleQuerySchema,
} from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * POST /api/v1/vehicles
 * Create a new vehicle
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId } = await requireTenantApiAuth();

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
    });
  }
}

/**
 * GET /api/v1/vehicles
 * List vehicles with pagination and filters
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantApiAuth();

    // 3. Parse query parameters
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

    // 4. Validate query parameters with Zod
    const validatedQuery = vehicleQuerySchema.parse(queryParams);

    // 5. Extract filters and pagination options
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

    // 6. Call VehicleService to list vehicles
    const vehicleService = new VehicleService();
    const result = await vehicleService.listVehicles(
      filters,
      paginationOptions,
      tenantId
    );

    // 7. Return paginated result
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
