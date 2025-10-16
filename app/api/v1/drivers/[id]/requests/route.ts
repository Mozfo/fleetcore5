// Driver Requests API routes: GET /api/v1/drivers/:id/requests
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { driverRequestsQuerySchema } from "@/lib/validators/drivers.validators";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/drivers/:id/requests
 * List requests for a specific driver with pagination and filters
 *
 * Query Parameters:
 * - page (number, default 1)
 * - limit (number, default 20, max 100)
 * - status (enum: pending|approved|rejected|cancelled, optional)
 * - request_type (string, optional) - e.g. "leave", "shift_change", "document_renewal"
 * - from_date (ISO date, optional) - Filter requests from this date
 * - to_date (ISO date, optional) - Filter requests until this date
 * - sort_by (enum: created_at|updated_at|request_date|status, default created_at)
 * - sort_order (enum: asc|desc, default desc)
 *
 * Response: PaginatedResult<DriverRequest>
 * {
 *   data: [...],
 *   total: number,
 *   page: number,
 *   totalPages: number
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Extract auth headers (before try for error context)
  const userId = request.headers.get("x-user-id");
  const tenantId = request.headers.get("x-tenant-id");

  try {
    // 2. Auth check
    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Await params (Next.js 15 convention)
    const { id: driverId } = await params;

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      sort_by: searchParams.get("sort_by") || "created_at",
      sort_order: searchParams.get("sort_order") || "desc",
      status: searchParams.get("status") || undefined,
      request_type: searchParams.get("request_type") || undefined,
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
    };

    // 5. Validate query parameters
    const validatedQuery = driverRequestsQuerySchema.parse(queryParams);

    // 6. Extract filters and pagination options
    const filters = {
      status: validatedQuery.status,
      request_type: validatedQuery.request_type,
      from_date: validatedQuery.from_date,
      to_date: validatedQuery.to_date,
    };

    const paginationOptions = {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
      sortBy: validatedQuery.sort_by,
      sortOrder: validatedQuery.sort_order,
    };

    // 7. Call DriverService to list driver requests
    const driverService = new DriverService();
    const result = await driverService.listDriverRequests(
      driverId,
      filters,
      paginationOptions,
      tenantId
    );

    // 8. Return paginated result
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
