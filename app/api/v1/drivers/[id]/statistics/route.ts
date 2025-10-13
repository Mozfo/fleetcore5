// Driver Statistics API route: GET /api/v1/drivers/:id/statistics
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { NotFoundError, ValidationError } from "@/lib/core/errors";

/**
 * GET /api/v1/drivers/:id/statistics
 * Get aggregated statistics for a driver across multiple tables
 *
 * Query params:
 * - start_date?: Date (optional, default: all-time)
 * - end_date?: Date (optional, default: now)
 *
 * Returns aggregated data from:
 * - trp_trips (trips count, distance)
 * - rev_driver_revenues (revenue)
 * - rid_driver_performances (ratings, on-time rate, incidents, hours)
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

    // 3. Verify driver exists
    const driverService = new DriverService();
    const driver = await driverService.getDriver(id, tenantId);

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    // 4. Parse query parameters for date range
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      if (isNaN(startDate.getTime())) {
        throw new ValidationError("Invalid start_date format");
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      if (isNaN(endDate.getTime())) {
        throw new ValidationError("Invalid end_date format");
      }
    }

    // 5. Validate date range
    if (startDate && endDate && startDate > endDate) {
      throw new ValidationError("start_date cannot be after end_date");
    }

    // 6. Build date filter
    const dateFilter = {
      ...(startDate && { gte: startDate }),
      ...(endDate && { lte: endDate }),
    };

    // 7. Aggregate trips from trp_trips
    const tripAggregate = await driverService["prisma"].trp_trips.aggregate({
      where: {
        driver_id: id,
        tenant_id: tenantId,
        deleted_at: null,
        ...(Object.keys(dateFilter).length > 0 && { start_time: dateFilter }),
      },
      _count: { id: true },
      _sum: {
        distance_km: true,
        net_earnings: true,
      },
    });

    // 8. Aggregate revenue from rev_driver_revenues
    const revenueAggregate = await driverService[
      "prisma"
    ].rev_driver_revenues.aggregate({
      where: {
        driver_id: id,
        tenant_id: tenantId,
        deleted_at: null,
        ...(Object.keys(dateFilter).length > 0 && { period_start: dateFilter }),
      },
      _sum: {
        net_revenue: true,
        total_revenue: true,
      },
    });

    // 9. Aggregate performance from rid_driver_performances
    const performanceAggregate = await driverService[
      "prisma"
    ].rid_driver_performances.aggregate({
      where: {
        driver_id: id,
        tenant_id: tenantId,
        deleted_at: null,
        ...(Object.keys(dateFilter).length > 0 && { period_start: dateFilter }),
      },
      _avg: {
        avg_rating: true,
        on_time_rate: true,
      },
      _sum: {
        trips_completed: true,
        trips_cancelled: true,
        incidents_count: true,
        hours_online: true,
      },
    });

    // 10. Calculate success rate (completed trips - incidents) / completed trips
    const tripsCompleted = performanceAggregate._sum?.trips_completed || 0;
    const incidents = performanceAggregate._sum?.incidents_count || 0;
    const successRate =
      tripsCompleted > 0
        ? Number(
            (((tripsCompleted - incidents) / tripsCompleted) * 100).toFixed(2)
          )
        : 0;

    // 11. Return aggregated statistics
    return NextResponse.json(
      {
        driver_id: id,
        date_range: {
          start_date: startDate?.toISOString() || null,
          end_date: endDate?.toISOString() || null,
        },
        trips: {
          total_deliveries: tripAggregate._count?.id || 0,
          total_distance_km: Number(tripAggregate._sum?.distance_km || 0),
          total_fare: Number(tripAggregate._sum?.net_earnings || 0),
          trips_completed: performanceAggregate._sum?.trips_completed || 0,
          trips_cancelled: performanceAggregate._sum?.trips_cancelled || 0,
        },
        performance: {
          avg_rating: Number(performanceAggregate._avg?.avg_rating || 0),
          on_time_rate: Number(performanceAggregate._avg?.on_time_rate || 0),
          success_rate: successRate,
          incidents_count: incidents,
          hours_online: Number(performanceAggregate._sum?.hours_online || 0),
        },
        revenue: {
          total_revenue: Number(revenueAggregate._sum?.total_revenue || 0),
          net_revenue: Number(revenueAggregate._sum?.net_revenue || 0),
        },
      },
      { status: 200 }
    );
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
