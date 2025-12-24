/**
 * /api/v1/crm/agreements
 * Agreement list and creation operations (GET, POST)
 *
 * @module app/api/v1/crm/agreements
 */

import { NextRequest, NextResponse } from "next/server";
import {
  listAgreementsAction,
  createAgreementAction,
} from "@/lib/actions/crm/agreements.actions";

/**
 * GET /api/v1/crm/agreements
 * List agreements with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Parse query parameters with defaults
  const result = await listAgreementsAction({
    page: searchParams.get("page")
      ? parseInt(searchParams.get("page") ?? "1")
      : 1,
    limit: searchParams.get("limit")
      ? parseInt(searchParams.get("limit") ?? "20")
      : 20,
    status:
      (searchParams.get("status") as
        | "draft"
        | "pending_signature"
        | "active"
        | "expired"
        | "terminated"
        | "superseded") || undefined,
    agreementType:
      (searchParams.get("agreementType") as
        | "msa"
        | "sla"
        | "dpa"
        | "nda"
        | "sow"
        | "addendum"
        | "other") || undefined,
    orderId: searchParams.get("orderId") || undefined,
    sortBy:
      (searchParams.get("sortBy") as
        | "created_at"
        | "updated_at"
        | "effective_date"
        | "expiry_date"
        | "agreement_reference") || "created_at",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { code: "ERROR", message: result.error } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.agreements,
    pagination: {
      page: result.page,
      limit: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
}

/**
 * POST /api/v1/crm/agreements
 * Create a new agreement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createAgreementAction(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "VALIDATION_ERROR", message: result.error },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.agreement,
        message: "Agreement created successfully",
      },
      { status: 201 }
    );
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to parse request body",
        },
      },
      { status: 400 }
    );
  }
}
