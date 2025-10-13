// Vehicles requiring maintenance API route: GET /api/v1/vehicles/maintenance
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { ValidationError, NotFoundError } from "@/lib/core/errors";

/**
 * GET /api/v1/vehicles/maintenance
 * List all vehicles requiring maintenance
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Call VehicleService to list vehicles requiring maintenance
    const vehicleService = new VehicleService();
    const vehicles =
      await vehicleService.listVehiclesRequiringMaintenance(tenantId);

    // 3. Return vehicles array with maintenance relations
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
