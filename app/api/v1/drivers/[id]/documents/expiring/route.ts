// Driver Documents Expiring API route: GET /api/v1/drivers/:id/documents/expiring
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

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
  try {
    const { tenantId } = await requireTenantApiAuth();

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
    });
  }
}
