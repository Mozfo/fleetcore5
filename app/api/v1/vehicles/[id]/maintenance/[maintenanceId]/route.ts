import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { updateMaintenanceSchema } from "@/lib/validators/vehicles.validators";
import { ZodError } from "zod";

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

    // 2. Extract vehicle and maintenance IDs from params
    const { id: vehicleId, maintenanceId } = await params;

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = updateMaintenanceSchema.parse(body);

    // 4. Update maintenance via service
    const vehicleService = new VehicleService();
    const maintenance = await vehicleService.updateMaintenance(
      vehicleId,
      maintenanceId,
      validatedData,
      userId,
      tenantId
    );

    // 5. Return updated maintenance
    return NextResponse.json(maintenance, { status: 200 });
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
        message: "Failed to update maintenance record",
      },
      { status: 500 }
    );
  }
}
