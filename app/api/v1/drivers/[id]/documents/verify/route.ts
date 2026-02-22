// Driver Document Verify API route: POST /api/v1/drivers/:id/documents/verify
import { NextRequest, NextResponse } from "next/server";
import { DriverService } from "@/lib/services/drivers/driver.service";
import { handleApiError } from "@/lib/api/error-handler";
import { requireTenantApiAuth } from "@/lib/auth/api-guard";

/**
 * POST /api/v1/drivers/:id/documents/verify
 * Mark a driver document as verified
 *
 * Updates both tables (transaction for atomicity):
 * - rid_driver_documents: verified, verified_by, verified_at, updated_by, updated_at
 * - doc_documents: verified, updated_at only (verified_by and verified_at don't exist in this table)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, tenantId } = await requireTenantApiAuth();

    // 3. Await params (Next.js 15 convention)
    const { id } = await params;

    // 4. Parse and validate request body
    const body = await request.json();
    const { document_id } = body;

    if (!document_id || typeof document_id !== "string") {
      return NextResponse.json(
        { error: "document_id is required" },
        { status: 400 }
      );
    }

    // 5. Verify document belongs to driver
    const driverService = new DriverService();
    const existingDoc = await driverService[
      "prisma"
    ].rid_driver_documents.findFirst({
      where: {
        id: document_id,
        driver_id: id,
        tenant_id: tenantId,
        deleted_at: null,
      },
    });

    if (!existingDoc) {
      return NextResponse.json(
        { error: "Document not found for this driver" },
        { status: 404 }
      );
    }

    // 6. Update document verification status in transaction (2 tables)
    await driverService["prisma"].$transaction(async (tx) => {
      // Update rid_driver_documents (WITH verified_by, verified_at)
      await tx.rid_driver_documents.update({
        where: { id: document_id },
        data: {
          verified: true,
          verified_by: userId, // Audit field (exists only in rid_driver_documents)
          verified_at: new Date(), // Audit field (exists only in rid_driver_documents)
          updated_by: userId,
          updated_at: new Date(),
        },
      });

      // Update doc_documents (WITHOUT verified_by, verified_at - these fields don't exist)
      await tx.doc_documents.update({
        where: { id: existingDoc.document_id },
        data: {
          verified: true,
          updated_at: new Date(),
          // NO verified_by, verified_at (don't exist in doc_documents table)
        },
      });
    });

    // 7. Return success message
    return NextResponse.json(
      { message: "Document verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, {
      path: request.nextUrl.pathname,
      method: "POST",
    });
  }
}
