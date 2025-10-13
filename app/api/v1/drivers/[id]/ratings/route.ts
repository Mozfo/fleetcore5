// Driver Ratings API route: GET /api/v1/drivers/:id/ratings (list - read only)
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { NotFoundError } from "@/lib/core/errors";

/**
 * GET /api/v1/drivers/:id/ratings
 * List driver ratings from performance records (read-only aggregation)
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - sortBy: period_start|avg_rating (default: period_start)
 * - sortOrder: asc|desc (default: desc)
 *
 * Returns ratings aggregated from rid_driver_performances table
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sortBy = searchParams.get("sortBy") || "period_start";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as
      | "asc"
      | "desc";

    // 5. Validate sortBy
    const validSortFields = ["period_start", "avg_rating"];
    const finalSortBy = validSortFields.includes(sortBy)
      ? sortBy
      : "period_start";

    // 6. Query rid_driver_performances with pagination
    const [performances, total] = await Promise.all([
      driverService["prisma"].rid_driver_performances.findMany({
        where: {
          driver_id: id,
          tenant_id: tenantId,
          deleted_at: null,
        },
        orderBy: { [finalSortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      driverService["prisma"].rid_driver_performances.count({
        where: {
          driver_id: id,
          tenant_id: tenantId,
          deleted_at: null,
        },
      }),
    ]);

    // 7. Map performances to rating objects
    const ratings = performances.map((p) => ({
      id: p.id,
      period: `${p.period_start.toISOString().split("T")[0]} - ${p.period_end.toISOString().split("T")[0]}`,
      period_start: p.period_start,
      period_end: p.period_end,
      rating: Number(p.avg_rating || 0),
      trips: p.trips_completed,
      created_at: p.created_at,
    }));

    // 8. Return paginated list
    return NextResponse.json(
      {
        data: ratings,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
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
