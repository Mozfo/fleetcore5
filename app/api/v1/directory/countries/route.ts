// Directory Countries API route: GET /api/v1/directory/countries
import { NextRequest, NextResponse } from "next/server";
import { DirectoryService } from "@/lib/services/directory/directory.service";
import { listCountriesSchema } from "@/lib/validators/directory.validators";
import { ValidationError } from "@/lib/core/errors";
import { z } from "zod";

/**
 * GET /api/v1/directory/countries
 * List all countries (global data, no tenant filtering)
 *
 * Query Parameters:
 * - sortBy (enum: country_code|currency|timezone, default: country_code)
 * - sortOrder (enum: asc|desc, default: asc)
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
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);

    const queryParams = {
      sortBy: searchParams.get("sortBy") || "country_code",
      sortOrder: searchParams.get("sortOrder") || "asc",
    };

    // 3. Validate query parameters with Zod
    const validatedQuery = listCountriesSchema.parse(queryParams);

    // 4. Call DirectoryService to list countries
    const directoryService = new DirectoryService();
    const countries = await directoryService.listCountries(
      validatedQuery.sortBy,
      validatedQuery.sortOrder
    );

    // 5. Return countries array
    return NextResponse.json(countries, { status: 200 });
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
