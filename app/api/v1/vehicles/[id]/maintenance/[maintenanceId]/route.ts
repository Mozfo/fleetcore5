import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { updateMaintenanceSchema } from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * PATCH /api/v1/vehicles/:id/maintenance/:maintenanceId
 *
 * Update an existing maintenance record
 *
 * Validates status transitions:
 * - completed and cancelled are terminal states (no further transitions allowed)
 * - scheduled can only transition to in_progress or cancelled
 * - in_progress can only transition to completed or cancelled
 * - completed_date is required when status is set to completed
 *
 * @requires Headers: x-user-id, x-tenant-id
 * @body UpdateMaintenanceInput (validated by updateMaintenanceSchema)
 * @returns 200 OK - Updated maintenance record
 * @returns 400 Bad Request - Validation errors or invalid status transition
 * @returns 401 Unauthorized - Missing auth headers
 * @returns 404 Not Found - Vehicle or maintenance record not found
 * @returns 500 Internal Server Error
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; maintenanceId: string }> }
) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Extract vehicle and maintenance IDs from params
    const { id: vehicleId, maintenanceId } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // 5. Update maintenance via service
    const vehicleService = new VehicleService();
    const maintenance = await vehicleService.updateMaintenance(
      vehicleId,
      maintenanceId,
      validatedData,
      userId,
      tenantId
    );

    // 6. Return updated maintenance
    return NextResponse.json(maintenance, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "PATCH",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
