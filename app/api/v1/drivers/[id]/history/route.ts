// Driver History API route: GET /api/v1/drivers/:id/history
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { NotFoundError } from "@/lib/core/errors";

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
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params (Next.js 15 convention)
    const { id } = await params;

    // 3. Call DriverService to get driver history
    const driverService = new DriverService();
    const history = await driverService.getDriverHistory(id, tenantId);

    // 4. Return history object
    return NextResponse.json(history, { status: 200 });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
