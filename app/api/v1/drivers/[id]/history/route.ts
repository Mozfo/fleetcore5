// Driver History API route: GET /api/v1/drivers/:id/history
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * GET /api/v1/drivers/:id/history
 * Get driver history including trips, documents, assignments, and status changes
 *
 * Uses DriverService.getDriverHistory() which returns:
 * - trips: Recent trips with summary stats
 * - documents: Document timeline
 * - assignments: Vehicle assignment history
 * - status_changes: Driver status change log
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireTenantApiAuth();

    // 2. Await params (Next.js 15 convention)
    const { id } = await params;

    // 3. Call DriverService to get driver history
    const driverService = new DriverService();
    const history = await driverService.getDriverHistory(id, tenantId);

    // 4. Return history object
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
