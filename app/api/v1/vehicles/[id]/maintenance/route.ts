import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import {
  createMaintenanceSchema,
  maintenanceQuerySchema,
} from "@/lib/validators/vehicles.validators";
import { ZodError } from "zod";

/**
 * POST /api/v1/vehicles/:id/maintenance
 *
 * Create a new maintenance record for a vehicle
 *
 * @requires Headers: x-user-id, x-tenant-id
 * @body CreateMaintenanceInput (validated by createMaintenanceSchema)
 * @returns 201 Created - Maintenance record
 * @returns 400 Bad Request - Validation errors
 * @returns 401 Unauthorized - Missing auth headers
 * @returns 404 Not Found - Vehicle not found
 * @returns 500 Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract auth headers
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing authentication headers" },
        { status: 401 }
      );
    }

    // 2. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // 4. Create maintenance via service
    const vehicleService = new VehicleService();
    const maintenance = await vehicleService.createMaintenance(
      vehicleId,
      validatedData,
      userId,
      tenantId
    );

    // 5. Return created maintenance
    return NextResponse.json(maintenance, { status: 201 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid maintenance data",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle known errors
    if (error instanceof Error) {
      const errorName = error.constructor.name;

      if (errorName === "NotFoundError") {
        return NextResponse.json(
          { error: "Not Found", message: error.message },
          { status: 404 }
        );
      }

      if (errorName === "ValidationError") {
        return NextResponse.json(
          { error: "Validation Error", message: error.message },
          { status: 400 }
        );
      }
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to create maintenance record",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/vehicles/:id/maintenance
 *
 * List all maintenance records for a vehicle with pagination and filters
 *
 * @requires Headers: x-user-id, x-tenant-id
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query status - Filter by status (scheduled, in_progress, completed, cancelled)
 * @query maintenance_type - Filter by type
 * @query from_date - Filter from date (ISO string)
 * @query to_date - Filter to date (ISO string)
 * @query sortBy - Sort field (default: scheduled_date)
 * @query sortOrder - Sort order (asc, desc, default: desc)
 * @returns 200 OK - Paginated maintenance records
 * @returns 400 Bad Request - Invalid query parameters
 * @returns 401 Unauthorized - Missing auth headers
 * @returns 404 Not Found - Vehicle not found
 * @returns 500 Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract auth headers
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Missing authentication headers" },
        { status: 401 }
      );
    }

    // 2. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 3. Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      status: searchParams.get("status") || undefined,
      maintenance_type: searchParams.get("maintenance_type") || undefined,
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
      sortBy: searchParams.get("sortBy") || "scheduled_date",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validatedQuery = maintenanceQuerySchema.parse(queryParams);

    // 4. Get maintenance records via service
    const vehicleService = new VehicleService();
    const result = await vehicleService.getVehicleMaintenance(
      vehicleId,
      tenantId,
      validatedQuery
    );

    // 5. Return paginated results
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation Error",
          message: "Invalid query parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    // Handle known errors
    if (error instanceof Error) {
      const errorName = error.constructor.name;

      if (errorName === "NotFoundError") {
        return NextResponse.json(
          { error: "Not Found", message: error.message },
          { status: 404 }
        );
      }

      if (errorName === "ValidationError") {
        return NextResponse.json(
          { error: "Validation Error", message: error.message },
          { status: 400 }
        );
      }
    }

    // Handle unexpected errors
    return NextResponse.json(
      {
        error: "Internal Server Error",
        message: "Failed to fetch maintenance records",
      },
      { status: 500 }
    );
  }
}
