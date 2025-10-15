// Driver Suspend API route: POST /api/v1/drivers/:id/suspend
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { driverSuspensionSchema } from "@/lib/validators/drivers.validators";
import { handleApiError } from "@/lib/api/error-handler";

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
  // 1. Extract headers (injected by middleware) - declared before try for error context
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  try {
    // 2. Auth check
    if (!tenantId || !userId) {
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
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
