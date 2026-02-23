import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { DashboardLayout } from "@/lib/types/dashboard";

/**
 * Dashboard Layout API
 *
 * Persists user dashboard layouts in crm_settings table.
 * Uses key pattern: `dashboard_layout_{userId}`
 *
 * This allows each user to have their own layout preferences stored
 * in the database rather than localStorage (cross-device sync).
 *
 * @module app/api/v1/dashboard/layout
 */

const SETTING_KEY_PREFIX = "dashboard_layout_";
const SETTING_CATEGORY = "ui";

/**
 * GET /api/v1/dashboard/layout
 * Fetch user's dashboard layout from database
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;

    // Check query param for specific user (admin access)
    const searchParams = request.nextUrl.searchParams;
    const requestedUserId = searchParams.get("userId") || userId;

    // Only allow fetching own layout (or admin in future)
    if (requestedUserId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch from crm_settings
    const settingKey = `${SETTING_KEY_PREFIX}${userId}`;
    const setting = await db.crm_settings.findFirst({
      where: {
        setting_key: settingKey,
        is_active: true,
        deleted_at: null,
      },
    });

    if (setting && setting.setting_value) {
      return NextResponse.json({
        success: true,
        data: setting.setting_value as unknown as DashboardLayout,
        source: "database",
      });
    }

    // No layout found - client will use localStorage or defaults
    return NextResponse.json(
      { success: false, error: "Layout not found" },
      { status: 404 }
    );
  } catch (error) {
    logger.error({ error }, "[Dashboard Layout GET] Error fetching layout");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/dashboard/layout
 * Save user's dashboard layout to database
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, orgId } = session;

    // orgId = adm_tenants.id (shared-ID pattern: auth_organization.id = adm_tenants.id)
    if (!orgId) {
      return NextResponse.json(
        { success: false, error: "No active organization" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as DashboardLayout;

    // Validate basic structure
    if (!body.layouts || !body.enabledWidgets) {
      return NextResponse.json(
        { success: false, error: "Invalid layout data" },
        { status: 400 }
      );
    }

    // Ensure userId matches
    const layoutToSave: DashboardLayout = {
      ...body,
      userId,
      updatedAt: new Date().toISOString(),
    };

    // Upsert in crm_settings
    const settingKey = `${SETTING_KEY_PREFIX}${userId}`;
    const existing = await db.crm_settings.findFirst({
      where: {
        setting_key: settingKey,
        deleted_at: null,
      },
    });

    if (existing) {
      // Update existing setting
      await db.crm_settings.update({
        where: { id: existing.id },
        data: {
          setting_value: layoutToSave as object,
          version: existing.version + 1,
          updated_at: new Date(),
          updated_by: userId,
        },
      });
    } else {
      // Create new setting
      await db.crm_settings.create({
        data: {
          tenant_id: orgId,
          setting_key: settingKey,
          setting_value: layoutToSave as object,
          category: SETTING_CATEGORY,
          data_type: "object",
          description: `Dashboard layout preferences for user ${userId}`,
          is_system: false,
          is_active: true,
          version: 1,
          created_by: userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: layoutToSave,
      message: "Layout saved to database",
    });
  } catch (error) {
    logger.error({ error }, "[Dashboard Layout PUT] Error saving layout");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/dashboard/layout
 * Reset user's dashboard layout to defaults (soft delete)
 */
export async function DELETE() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = session;

    // Soft delete from crm_settings
    const settingKey = `${SETTING_KEY_PREFIX}${userId}`;
    const existing = await db.crm_settings.findFirst({
      where: {
        setting_key: settingKey,
        deleted_at: null,
      },
    });

    if (existing) {
      await db.crm_settings.update({
        where: { id: existing.id },
        data: {
          deleted_at: new Date(),
          deleted_by: userId,
          is_active: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Layout reset to defaults",
    });
  } catch (error) {
    logger.error({ error }, "[Dashboard Layout DELETE] Error resetting layout");
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
