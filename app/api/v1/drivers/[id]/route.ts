// Driver API routes: GET, PATCH, DELETE /api/v1/drivers/:id
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { updateDriverSchema } from "@/lib/validators/drivers.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/drivers/:id
 * Get driver details with relations
 */
export async function GET(
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

    // 3. Call DriverService to get driver
    const driverService = new DriverService();
    const driver = await driverService.getDriver(id, tenantId);

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // 4. Return driver with relations
    return NextResponse.json(driver, { status: 200 });
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

/**
 * PATCH /api/v1/drivers/:id
 * Update driver
 */
export async function PATCH(
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
    const validatedData = updateDriverSchema.parse(body);

    // 5. Call DriverService to update driver
    const driverService = new DriverService();
    const driver = await driverService.updateDriver(
      id,
      validatedData,
      userId,
      tenantId
    );

    // 6. Return updated driver
    return NextResponse.json(driver, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "PATCH",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * DELETE /api/v1/drivers/:id
 * Soft-delete driver
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

    // 4. Call DriverService to soft-delete driver
    const driverService = new DriverService();
    await driverService.deleteDriver(id, userId, tenantId, reason);

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
