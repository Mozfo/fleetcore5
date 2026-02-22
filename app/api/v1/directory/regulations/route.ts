// Directory Regulations API route: GET /api/v1/directory/regulations
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import { listRegulationsSchema } from "@/lib/validators/directory.validators";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * GET /api/v1/directory/regulations
 * List country regulations (global data, optional country filter)
 *
 * Query Parameters:
 * - country_code (string, optional) - Filter by specific country code (2 chars)
 *
 * Response: Array of country regulations
 * [
 *   {
 *     country_code: "FR",
 *     currency: "EUR",
 *     timezone: "Europe/Paris",
 *     requires_vtc_card: true,
 *     vehicle_max_age: 7,
 *     vat_rate: 20.00,
 *     min_fare_per_trip: 7.00,
 *     min_fare_per_km: 1.50,
 *     min_fare_per_hour: 25.00,
 *     min_vehicle_class: "sedan",
 *     created_at: "2025-01-01T00:00:00Z",
 *     updated_at: "2025-01-01T00:00:00Z"
 *   }
 * ]
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Auth check
    await requireTenantApiAuth();

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      country_code: searchParams.get("country_code") || undefined,
    };

    // 4. Validate query parameters with Zod
    const validatedQuery = listRegulationsSchema.parse(queryParams);

    // 5. Call DirectoryService to list regulations
    const directoryService = new DirectoryService();
    const regulations = await directoryService.listRegulations(
      validatedQuery.country_code
    );

    // 5. Return regulations array
    return NextResponse.json(regulations, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
    });
  }
}
