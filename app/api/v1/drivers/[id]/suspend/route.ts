// Driver Suspend API route: POST /api/v1/drivers/:id/suspend
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { driverSuspensionSchema } from "@/lib/validators/drivers.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";

/**
 * POST /api/v1/drivers/:id/suspend
 * Suspend a driver
 *
 * Uses DriverService.suspendDriver() which:
 * - Updates driver_status to 'suspended'
 * - Creates audit log entry
 * - Sends email notification to driver
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
    const { id } = await params;

    // 3. Parse and validate request body
    const body = await request.json();
    const validatedData = driverSuspensionSchema.parse(body);

    // 4. Call DriverService to suspend driver
    const driverService = new DriverService();
    await driverService.suspendDriver(
      id,
      validatedData.reason,
      userId,
      tenantId
    );

    // 5. Return success message
    return NextResponse.json(
      { message: "Driver suspended successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof ValidationError) {
      // Example: Driver already suspended
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
