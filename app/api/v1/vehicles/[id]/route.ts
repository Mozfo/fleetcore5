// Vehicle API routes: GET, PUT, DELETE /api/v1/vehicles/:id
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { updateVehicleSchema } from "@/lib/validators/vehicles.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/vehicles/:id
 * Get vehicle details with relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id } = await params;

    // 4. Call VehicleService to get vehicle
    const vehicleService = new VehicleService();
    const vehicle = await vehicleService.getVehicle(id, tenantId);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // 5. Return vehicle with relations
    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * PUT /api/v1/vehicles/:id
 * Update vehicle
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = updateVehicleSchema.parse(body);

    // 5. Call VehicleService to update vehicle
    const vehicleService = new VehicleService();
    const vehicle = await vehicleService.updateVehicle(
      id,
      validatedData,
      userId,
      tenantId
    );

    // 6. Return updated vehicle
    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "PUT",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * DELETE /api/v1/vehicles/:id
 * Soft-delete vehicle
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
    const { id } = await params;

    // 3. Parse optional reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON - that's OK, reason is optional
    }

    // 4. Call VehicleService to soft-delete vehicle
    const vehicleService = new VehicleService();
    await vehicleService.deleteVehicle(id, userId, tenantId, reason);

    // 5. Return 204 No Content
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
