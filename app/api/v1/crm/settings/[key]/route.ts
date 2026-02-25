/**
 * /api/v1/crm/settings/[key]
 * Single CRM Setting operations (GET, PUT, DELETE)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages individual CRM configuration settings.
 * Settings are identified by their unique key (e.g., "lead_stages").
 *
 * Authentication flow:
 * 1. Auth guard validates: userId + FleetCore Admin org membership + settings:view/edit
 * 2. Auth guard returns userId, orgId directly
 *
 * Security: Access restricted to FleetCore Admin users with settings permissions
 * (org:adm_admin, org:admin, org:provider_admin) - enforced at auth guard level.
 *
 * @module app/api/v1/crm/settings/[key]
 */

import { NextRequest, NextResponse } from "next/server";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { UpdateSettingSchema } from "@/lib/validators/crm/settings.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { resolveEmployeeId } from "@/lib/utils/audit-resolver";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * GET /api/v1/crm/settings/[key]
 * Retrieve a specific CRM setting by key
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:view)
 *
 * Response 200: Setting with full data
 * Response 401: Unauthorized
 * Response 404: Setting not found
 * Response 500: Internal server error
 *
 * @example
 * GET /api/v1/crm/settings/lead_stages
 *
 * Response 200: {
 *   "success": true,
 *   "data": {
 *     "id": "uuid",
 *     "setting_key": "lead_stages",
 *     "setting_value": { "stages": [...], "transitions": {...} },
 *     "category": "pipeline",
 *     "version": 3
 *   }
 * }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // STEP 1: Authenticate via auth guard
    await requireCrmApiAuth();
    const { key } = await params;

    // STEP 2: Validate key format (snake_case, lowercase)
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_KEY",
            message:
              "Setting key must be lowercase, start with letter, and contain only letters, numbers, underscores",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Query setting
    const repo = new CrmSettingsRepository(db);
    const setting = await repo.getSetting(key);

    if (!setting) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Setting "${key}" not found or inactive`,
          },
        },
        { status: 404 }
      );
    }

    // STEP 4: Format response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: setting.id,
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          category: setting.category,
          data_type: setting.data_type,
          description: setting.description,
          display_label: setting.display_label,
          help_text: setting.help_text,
          ui_component: setting.ui_component,
          display_order: setting.display_order,
          is_active: setting.is_active,
          is_system: setting.is_system,
          version: setting.version,
          created_at: setting.created_at.toISOString(),
          updated_at: setting.updated_at?.toISOString() || null,
        },
      },
      { status: 200 }
    );
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

    logger.error({ error }, "[CRM Settings Detail] Error fetching setting");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching the setting",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/v1/crm/settings/[key]
 * Update an existing CRM setting (or create via upsert)
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:edit)
 *
 * Request Body: UpdateSettingInput (validated with Zod)
 * Response 200: Updated setting with incremented version
 * Response 400: Validation error
 * Response 401: Unauthorized
 * Response 500: Internal server error
 *
 * Business Logic:
 * - Automatically increments version number
 * - Sets updated_by and updated_at
 * - If setting doesn't exist, creates it (upsert behavior)
 *
 * @example
 * PUT /api/v1/crm/settings/lead_stages
 * Body: {
 *   "setting_value": { "stages": [...], "transitions": {...} }
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // STEP 1: Authenticate via auth guard
    const { userId } = await requireCrmApiAuth();
    const { key } = await params;

    // STEP 2: Validate key format
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_KEY",
            message:
              "Setting key must be lowercase, start with letter, and contain only letters, numbers, underscores",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Parse request body
    const body = await request.json();

    // STEP 4: Validate with Zod
    const validatedData = UpdateSettingSchema.parse(body);

    // STEP 5: Check if trying to deactivate a system setting
    if (validatedData.is_active === false) {
      const repo = new CrmSettingsRepository(db);
      const existing = await repo.getSetting(key);
      if (existing?.is_system) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SYSTEM_SETTING",
              message: "Cannot deactivate a system setting",
            },
          },
          { status: 400 }
        );
      }
    }

    // STEP 6: Convert auth user ID to provider employee UUID for audit trail
    // Note: crm_settings.updated_by has FK to adm_members, not adm_members
    const employee = await resolveEmployeeId(userId);
    const employeeUuid = employee?.id ?? null;

    // STEP 7: Upsert setting
    const repo = new CrmSettingsRepository(db);
    const setting = await repo.upsertByKey(
      key,
      {
        setting_value: validatedData.setting_value ?? {},
        description: validatedData.description ?? undefined,
        display_label: validatedData.display_label ?? undefined,
        help_text: validatedData.help_text ?? undefined,
        ui_component: validatedData.ui_component ?? undefined,
        display_order: validatedData.display_order,
      },
      employeeUuid
    );

    // Handle is_active toggle separately if provided
    if (validatedData.is_active !== undefined && !setting.is_system) {
      const updatedSetting = await db.crm_settings.update({
        where: { id: setting.id },
        data: { is_active: validatedData.is_active },
      });
      Object.assign(setting, updatedSetting);
    }

    // STEP 8: Audit log
    logger.info(
      {
        settingKey: key,
        userId,
        newVersion: setting.version,
        fields: Object.keys(validatedData),
      },
      "[CRM Settings Update] Setting updated"
    );

    // STEP 9: Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: setting.id,
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          category: setting.category,
          data_type: setting.data_type,
          description: setting.description,
          display_label: setting.display_label,
          help_text: setting.help_text,
          ui_component: setting.ui_component,
          display_order: setting.display_order,
          is_active: setting.is_active,
          is_system: setting.is_system,
          version: setting.version,
          created_at: setting.created_at.toISOString(),
          updated_at: setting.updated_at?.toISOString() || null,
        },
        message: "Setting updated successfully",
      },
      { status: 200 }
    );
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

    // Zod validation error
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input data",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    logger.error({ error }, "[CRM Settings Update] Error updating setting");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while updating the setting",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/crm/settings/[key]
 * Soft delete a CRM setting
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:edit)
 *
 * Response 204: No Content (successful soft delete)
 * Response 400: Cannot delete system setting
 * Response 401: Unauthorized
 * Response 404: Setting not found
 * Response 500: Internal server error
 *
 * IMPORTANT:
 * - This is a SOFT DELETE only (sets deleted_at)
 * - System settings (is_system=true) CANNOT be deleted
 * - Hard deletes are FORBIDDEN for audit trail compliance
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    // STEP 1: Authenticate via auth guard
    const { userId } = await requireCrmApiAuth();
    const { key } = await params;

    // STEP 2: Validate key format
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    if (!keyRegex.test(key)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_KEY",
            message:
              "Setting key must be lowercase, start with letter, and contain only letters, numbers, underscores",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Convert auth user ID to provider employee UUID for audit trail
    // Note: crm_settings.deleted_by has FK to adm_members, not adm_members
    const employee = await resolveEmployeeId(userId);
    const employeeUuid = employee?.id ?? null;

    // STEP 4: Soft delete
    const repo = new CrmSettingsRepository(db);
    const deleted = await repo.softDeleteByKey(key, employeeUuid);

    if (!deleted) {
      // Check if it's because it's a system setting or not found
      const existing = await db.crm_settings.findFirst({
        where: { setting_key: key, deleted_at: null },
      });

      if (existing?.is_system) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "SYSTEM_SETTING",
              message: "Cannot delete a system setting",
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: `Setting "${key}" not found or already deleted`,
          },
        },
        { status: 404 }
      );
    }

    // STEP 5: Audit log
    logger.warn(
      {
        settingKey: key,
        deletedBy: userId,
        employeeUuid,
      },
      "[CRM Settings Delete] Setting soft-deleted"
    );

    // STEP 6: Return 204 No Content
    return new NextResponse(null, { status: 204 });
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

    logger.error({ error }, "[CRM Settings Delete] Error deleting setting");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while deleting the setting",
        },
      },
      { status: 500 }
    );
  }
}
