// Vehicles with expiring insurance API route: GET /api/v1/vehicles/insurance-expiring
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { handleApiError } from "@/lib/api/error-handler";
import { logger } from "@/lib/logger";

/**
 * GET /api/v1/vehicles/insurance-expiring
 * List all vehicles with expiring insurance
 * Query params: daysAhead (default: 30)
 */
export async function GET(request: NextRequest) {
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse optional query parameter daysAhead
    const { searchParams } = new URL(request.url);
    const daysAheadParam = searchParams.get("daysAhead");
    const daysAhead = daysAheadParam ? parseInt(daysAheadParam, 10) : 30;

    // 4. Validate daysAhead is a positive number
    if (isNaN(daysAhead) || daysAhead < 0) {
      return NextResponse.json(
        { error: "Invalid daysAhead parameter. Must be a positive number." },
        { status: 400 }
      );
    }

    // 5. Call VehicleService to list vehicles with expiring insurance
    const vehicleService = new VehicleService();
    const vehicles = await vehicleService.listVehiclesWithExpiringInsurance(
      tenantId,
      daysAhead
    );

    // 6. Return vehicles array with insurance relations
    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    // DEBUG: Log full error for CI investigation of 500 errors
    logger.error(
      {
        path: request.nextUrl.pathname,
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "[DEBUG] Full error details for CI investigation"
    );

    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
