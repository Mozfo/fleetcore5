// Vehicles with expiring insurance API route: GET /api/v1/vehicles/insurance-expiring
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { ValidationError, NotFoundError } from "@/lib/core/errors";

/**
 * GET /api/v1/vehicles/insurance-expiring
 * List all vehicles with expiring insurance
 * Query params: daysAhead (default: 30)
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse optional query parameter daysAhead
    const { searchParams } = new URL(request.url);
    const daysAheadParam = searchParams.get("daysAhead");
    const daysAhead = daysAheadParam ? parseInt(daysAheadParam, 10) : 30;

    // Validate daysAhead is a positive number
    if (isNaN(daysAhead) || daysAhead < 0) {
      return NextResponse.json(
        { error: "Invalid daysAhead parameter. Must be a positive number." },
        { status: 400 }
      );
    }

    // 3. Call VehicleService to list vehicles with expiring insurance
    const vehicleService = new VehicleService();
    const vehicles = await vehicleService.listVehiclesWithExpiringInsurance(
      tenantId,
      daysAhead
    );

    // 4. Return vehicles array with insurance relations
    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
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
