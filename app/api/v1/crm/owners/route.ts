/**
 * /api/v1/crm/owners
 * Returns active Sales team members for lead assignment dropdowns.
 *
 * Authentication: Via middleware (FleetCore Admin org membership)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    if (!userId || !orgId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    const owners = await db.adm_provider_employees.findMany({
      where: {
        department: "Sales",
        status: "active",
        deleted_at: null,
      },
      orderBy: { first_name: "asc" },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    return NextResponse.json({ success: true, data: owners }, { status: 200 });
  } catch (error) {
    logger.error({ error }, "[CRM Owners] Error fetching sales owners");
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Failed to fetch owners" },
      },
      { status: 500 }
    );
  }
}
