/**
 * /api/v1/crm/owners
 * Returns active Sales team members for lead assignment dropdowns.
 *
 * Authentication: Via auth guard (FleetCore Admin org membership)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

export async function GET(_request: NextRequest) {
  try {
    await requireCrmApiAuth();

    const owners = await db.adm_members.findMany({
      where: {
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
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.statusCode }
      );
    }

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
