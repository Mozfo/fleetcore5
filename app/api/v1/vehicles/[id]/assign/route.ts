// Vehicle assignment API routes: POST and DELETE /api/v1/vehicles/:id/assign
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { vehicleAssignmentSchema } from "@/lib/validators/vehicles.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { z } from "zod";

/**
 * POST /api/v1/vehicles/:id/assign
 * Assign vehicle to driver
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params (Next.js 15 convention)
    const { id: vehicleId } = await params;

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = vehicleAssignmentSchema.parse(body);

    // 4. Call VehicleService to assign vehicle to driver
    const vehicleService = new VehicleService();
    const assignment = await vehicleService.assignToDriver(
      vehicleId,
      validatedData.driver_id,
      validatedData.start_date,
      userId,
      tenantId
    );

    // 5. Return created assignment
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
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

/**
 * DELETE /api/v1/vehicles/:id/assign
 * End active assignment (unassign driver from vehicle)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params (Next.js 15 convention)
    const { id: vehicleId } = await params;

    // 3. Call VehicleService to unassign driver
    const vehicleService = new VehicleService();
    await vehicleService.unassignDriver(vehicleId, userId, tenantId);

    // 4. Return 204 No Content
    return new NextResponse(null, { status: 204 });
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
