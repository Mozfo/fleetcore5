// Driver Documents Expiring API route: GET /api/v1/drivers/:id/documents/expiring
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { NotFoundError } from "@/lib/core/errors";

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
    // 1. Extract headers (injected by middleware)
    const userId = request.headers.get("x-user-id");
    const tenantId = request.headers.get("x-tenant-id");

    if (!userId || !tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await params (Next.js 15 convention)
    const { id } = await params;

    // 3. Call DriverService to validate documents and get expiring_soon list
    const driverService = new DriverService();
    const validation = await driverService.validateDriverDocuments(
      id,
      tenantId
    );

    // 4. Return expiring documents list
    return NextResponse.json(validation.expiring_soon, { status: 200 });
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
