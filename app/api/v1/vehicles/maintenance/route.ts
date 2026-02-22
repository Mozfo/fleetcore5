// Vehicles requiring maintenance API route: GET /api/v1/vehicles/maintenance
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { handleApiError } from "@/lib/api/error-handler";
import { logger } from "@/lib/logger";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * GET /api/v1/vehicles/maintenance
 * List all vehicles requiring maintenance
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireTenantApiAuth();

    // 3. Call VehicleService to list vehicles requiring maintenance
    const vehicleService = new VehicleService();
    const vehicles =
      await vehicleService.listVehiclesRequiringMaintenance(tenantId);

    // 4. Return vehicles array with maintenance relations
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
    });
  }
}
