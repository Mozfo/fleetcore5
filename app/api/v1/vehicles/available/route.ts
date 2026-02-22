// Available vehicles API route: GET /api/v1/vehicles/available
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * GET /api/v1/vehicles/available
 * List all available vehicles (not currently assigned)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantApiAuth();

    // 2. Call VehicleService to list available vehicles
    const vehicleService = new VehicleService();
    const vehicles = await vehicleService.listAvailableVehicles(tenantId);

    // 3. Return vehicles array
    return NextResponse.json(vehicles, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
