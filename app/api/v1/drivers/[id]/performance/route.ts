// Driver Performance API route: GET /api/v1/drivers/:id/performance
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { driverPerformanceQuerySchema } from "@/lib/validators/drivers.validators";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/drivers/:id/performance
 * Get aggregated performance metrics for a specific driver
 *
 * Query Parameters:
 * - from_date (ISO date, optional) - Start date for filtering
 * - to_date (ISO date, optional) - End date for filtering
 * - platform (string, optional) - Filter by platform (e.g., "uber", "bolt")
 *
 * Response: Aggregated Performance Metrics
 * {
 *   driver_id: string,
 *   period: { from: Date | null, to: Date | null },
 *   metrics: {
 *     total_trips: number,
 *     total_cancelled: number,
 *     total_revenue: number,
 *     total_hours: number,
 *     average_rating: number | null,
 *     total_incidents: number,
 *     completion_rate: number | null,
 *     average_on_time_rate: number | null
 *   },
 *   by_platform?: Array<{ platform: string, trips: number, revenue: number }>
 * }
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
    const { id: driverId } = await params;

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
      platform: searchParams.get("platform") || undefined,
    };

    // 5. Validate query parameters with Zod
    const validatedQuery = driverPerformanceQuerySchema.parse(queryParams);

    // 6. Extract filters
    const filters = {
      from_date: validatedQuery.from_date,
      to_date: validatedQuery.to_date,
      platform: validatedQuery.platform,
    };

    // 7. Call DriverService to get performance metrics
    const driverService = new DriverService();
    const result = await driverService.getDriverPerformance(
      driverId,
      filters,
      tenantId
    );

    // 8. Return aggregated metrics
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
