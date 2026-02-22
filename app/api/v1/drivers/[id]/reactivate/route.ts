// Driver Reactivate API route: POST /api/v1/drivers/:id/reactivate
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

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
    const { userId, tenantId } = await requireTenantApiAuth();

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
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
    });
  }
}
