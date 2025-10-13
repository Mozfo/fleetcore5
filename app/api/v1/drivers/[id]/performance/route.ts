// Driver Performance API route: GET /api/v1/drivers/:id/performance
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { driverPerformanceQuerySchema } from "@/lib/validators/drivers.validators";
import { ValidationError, NotFoundError } from "@/lib/core/errors";
import { z } from "zod";

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
  try {
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params (Next.js 15 convention)
    const { id: driverId } = await params;

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
      platform: searchParams.get("platform") || undefined,
    };

    // 4. Validate query parameters with Zod
    const validatedQuery = driverPerformanceQuerySchema.parse(queryParams);

    // 5. Extract filters
    const filters = {
      from_date: validatedQuery.from_date,
      to_date: validatedQuery.to_date,
      platform: validatedQuery.platform,
    };

    // 6. Call DriverService to get performance metrics
    const driverService = new DriverService();
    const result = await driverService.getDriverPerformance(
      driverId,
      filters,
      tenantId
    );

    // 7. Return aggregated metrics
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
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
