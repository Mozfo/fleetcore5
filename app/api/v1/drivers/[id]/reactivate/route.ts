// Driver Reactivate API route: POST /api/v1/drivers/:id/reactivate
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { ValidationError, NotFoundError } from "@/lib/core/errors";

/**
 * POST /api/v1/drivers/:id/reactivate
 * Reactivate a suspended driver
 *
 * Uses DriverService.reactivateDriver() which:
 * - Updates driver_status to 'active'
 * - Validates documents are valid
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

    // 3. Call DriverService to reactivate driver
    const driverService = new DriverService();
    await driverService.reactivateDriver(id, userId, tenantId);

    // 4. Return success message
    return NextResponse.json(
      { message: "Driver reactivated successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof ValidationError) {
      // Example: Driver not suspended or documents invalid
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
