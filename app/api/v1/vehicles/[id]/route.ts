// Vehicle API routes: GET, PUT, DELETE /api/v1/vehicles/:id
import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import { updateVehicleSchema } from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * GET /api/v1/vehicles/:id
 * Get vehicle details with relations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantApiAuth();

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
  try {
    const { userId, tenantId } = await requireTenantApiAuth();

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
    const { userId, tenantId } = await requireTenantApiAuth();

    // 3. Await params (Next.js 15 convention)
    const { id } = await params;

    // 4. Parse optional reason from body
    let reason: string | undefined;
    try {
      const body = await request.json();
      reason = body.reason;
    } catch {
      // No body or invalid JSON - that's OK, reason is optional
    }

    // 5. Call VehicleService to soft-delete vehicle
    const vehicleService = new VehicleService();
    await vehicleService.deleteVehicle(id, userId, tenantId, reason);

    // 6. Return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "DELETE",
    });
  }
}
