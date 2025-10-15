// Vehicles requiring maintenance API route: GET /api/v1/vehicles/maintenance
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/vehicles/maintenance
 * List all vehicles requiring maintenance
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

    // 3. Call VehicleService to list vehicles requiring maintenance
    const vehicleService = new VehicleService();
    const vehicles =
      await vehicleService.listVehiclesRequiringMaintenance(tenantId);

    // 4. Return vehicles array with maintenance relations
    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
