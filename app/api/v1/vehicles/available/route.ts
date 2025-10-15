// Available vehicles API route: GET /api/v1/vehicles/available
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/vehicles/available
 * List all available vehicles (not currently assigned)
 */
export async function GET(request: NextRequest) {
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Call VehicleService to list available vehicles
    const vehicleService = new VehicleService();
    const vehicles = await vehicleService.listAvailableVehicles(tenantId);

    // 3. Return vehicles array
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
