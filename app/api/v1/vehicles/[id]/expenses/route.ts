import { NextRequest, NextResponse } from "next/server";
import { VehicleService } from "@/lib/services/vehicles/vehicle.service";
import {
  createExpenseSchema,
  expenseQuerySchema,
} from "@/lib/validators/vehicles.validators";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * POST /api/v1/vehicles/:id/expenses
 *
 * Create a new expense record for a vehicle
 *
 * Validates:
 * - Vehicle exists
 * - Driver exists, belongs to tenant, and is active (if driver_id provided)
 * - Ride exists, belongs to tenant, and matches vehicle (if ride_id provided)
 *
 * @requires Headers: x-user-id, x-tenant-id
 * @body CreateExpenseInput (validated by createExpenseSchema)
 * @returns 201 Created - Expense record
 * @returns 400 Bad Request - Validation errors
 * @returns 401 Unauthorized - Missing auth headers
 * @returns 404 Not Found - Vehicle, driver, or ride not found
 * @returns 500 Internal Server Error
 */
export async function POST(
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

    // 3. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = createExpenseSchema.parse(body);

    // 5. Create expense via service
    const vehicleService = new VehicleService();
    const expense = await vehicleService.createExpense(
      vehicleId,
      validatedData,
      userId,
      tenantId
    );

    // 6. Return created expense
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}

/**
 * GET /api/v1/vehicles/:id/expenses
 *
 * List all expenses for a vehicle with pagination and filters
 *
 * @requires Headers: x-user-id, x-tenant-id
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 20, max: 100)
 * @query expense_category - Filter by category (fuel, toll, parking, wash, repair, fine, other)
 * @query reimbursed - Filter by reimbursement status (true, false)
 * @query from_date - Filter from date (ISO string)
 * @query to_date - Filter to date (ISO string)
 * @query sortBy - Sort field (default: expense_date)
 * @query sortOrder - Sort order (asc, desc, default: desc)
 * @returns 200 OK - Paginated expense records
 * @returns 400 Bad Request - Invalid query parameters
 * @returns 401 Unauthorized - Missing auth headers
 * @returns 404 Not Found - Vehicle not found
 * @returns 500 Internal Server Error
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

    // 3. Extract vehicle ID from params
    const { id: vehicleId } = await params;

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
      expense_category: searchParams.get("expense_category") || undefined,
      reimbursed: searchParams.get("reimbursed") || undefined,
      from_date: searchParams.get("from_date") || undefined,
      to_date: searchParams.get("to_date") || undefined,
      sortBy: searchParams.get("sortBy") || "expense_date",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const validatedQuery = expenseQuerySchema.parse(queryParams);

    // 5. Get expense records via service
    const vehicleService = new VehicleService();
    const result = await vehicleService.getVehicleExpenses(
      vehicleId,
      tenantId,
      validatedQuery
    );

    // 6. Return paginated results
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
