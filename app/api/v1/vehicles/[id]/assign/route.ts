// Vehicle assignment API routes: POST and DELETE /api/v1/vehicles/:id/assign
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { vehicleAssignmentSchema } from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * POST /api/v1/vehicles/:id/assign
 * Assign vehicle to driver
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id: vehicleId } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = vehicleAssignmentSchema.parse(body);

    // 5. Call VehicleService to assign vehicle to driver
    const vehicleService = new VehicleService();
    const assignment = await vehicleService.assignToDriver(
      vehicleId,
      validatedData.driver_id,
      validatedData.start_date,
      userId,
      tenantId
    );

    // 6. Return created assignment
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * DELETE /api/v1/vehicles/:id/assign
 * End active assignment (unassign driver from vehicle)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id: vehicleId } = await params;

    // 4. Call VehicleService to unassign driver
    const vehicleService = new VehicleService();
    await vehicleService.unassignDriver(vehicleId, userId, tenantId);

    // 5. Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "DELETE",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
