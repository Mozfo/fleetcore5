import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import {
  createMaintenanceSchema,
  maintenanceQuerySchema,
} from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

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
    const { userId, tenantId } = await requireTenantApiAuth();

    // 3. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createMaintenanceSchema.parse(body);

    // 5. Create maintenance via service
    const vehicleService = new VehicleService();
    const maintenance = await vehicleService.createMaintenance(
      vehicleId,
      validatedData,
      userId,
      tenantId
    );

    // 6. Return created maintenance
    return NextResponse.json(maintenance, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
    });
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
    const { tenantId } = await requireTenantApiAuth();

    // 3. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 4. Parse and validate query parameters
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

    // 5. Get maintenance records via service
    const vehicleService = new VehicleService();
    const result = await vehicleService.getVehicleMaintenance(
      vehicleId,
      tenantId,
      validatedQuery
    );

    // 6. Return paginated results
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
