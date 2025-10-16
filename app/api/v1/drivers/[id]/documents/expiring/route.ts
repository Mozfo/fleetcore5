// Driver Documents Expiring API route: GET /api/v1/drivers/:id/documents/expiring
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { handleApiError } from "@/lib/api/error-handler";

/**
 * GET /api/v1/drivers/:id/documents/expiring
 * Get list of documents expiring soon for a driver
 *
 * Uses validateDriverDocuments() service method which checks for documents
 * expiring within 30 days by default.
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
    const { id } = await params;

    // 4. Call DriverService to validate documents and get expiring_soon list
    const driverService = new DriverService();
    const validation = await driverService.validateDriverDocuments(
      id,
      tenantId
    );

    // 5. Return expiring documents list
    return NextResponse.json(validation.expiring_soon, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "GET",
      tenantId: tenantId || undefined,
      userId: userId || undefined,
    });
  }
}
