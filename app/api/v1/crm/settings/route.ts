/**
 * /api/v1/crm/settings
 * CRM Settings list and creation operations (GET, POST)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages CRM configuration settings stored as JSONB.
 * Follows "ZERO HARDCODING" principle - all config is database-driven.
 *
 * Authentication flow:
 * 1. Auth guard validates: userId + FleetCore Admin org membership + settings:view/edit
 * 2. Auth guard returns userId, orgId directly
 *
 * Security: Access restricted to FleetCore Admin users with settings permissions
 * (org:adm_admin, org:admin, org:provider_admin) - enforced at auth guard level.
 *
 * @module app/api/v1/crm/settings
 */

import { NextRequest, NextResponse } from "next/server";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import {
  CreateSettingSchema,
  GetSettingsQuerySchema,
} from "@/lib/validators/crm/settings.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * GET /api/v1/crm/settings
 * List all CRM settings with optional category filter
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:view)
 *
 * Query Parameters:
 * - category: Filter by category (pipeline, scoring, assignment, loss_reasons, etc.)
 * - include_inactive: Include inactive settings (default: false)
 *
 * Response 200: Array of settings
 * Response 401: Unauthorized (middleware handles this)
 * Response 500: Internal server error
 *
 * @example
 * GET /api/v1/crm/settings?category=pipeline
 *
 * Response 200: {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "uuid",
 *       "setting_key": "lead_stages",
 *       "setting_value": { ... },
 *       "category": "pipeline",
 *       "version": 1
 *     }
 *   ]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // STEP 1: Authenticate via auth guard
    await requireCrmApiAuth();

    // STEP 2: Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      category: searchParams.get("category") || undefined,
      include_inactive: searchParams.get("include_inactive") || undefined,
    };

    // Validate query params
    const validatedQuery = GetSettingsQuerySchema.parse(queryParams);

    // STEP 3: Query settings
    const repo = new CrmSettingsRepository(db);

    let settings;
    if (validatedQuery.category) {
      settings = await repo.getSettingsByCategory(validatedQuery.category);
    } else {
      settings = await repo.getAllSettings();
    }

    // Include inactive if requested
    if (validatedQuery.include_inactive) {
      settings = await db.crm_settings.findMany({
        where: {
          deleted_at: null,
          ...(validatedQuery.category && { category: validatedQuery.category }),
        },
        orderBy: [{ category: "asc" }, { display_order: "asc" }],
      });
    }

    // STEP 4: Format response
    return NextResponse.json(
      {
        success: true,
        data: settings.map((setting) => ({
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
        })),
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
            message: "Invalid query parameters",
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    logger.error({ error }, "[CRM Settings List] Error fetching settings");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching settings",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/crm/settings
 * Create a new CRM setting
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:edit)
 *
 * Request Body: CreateSettingInput (validated with Zod)
 * Response 201: Created setting
 * Response 400: Validation error
 * Response 401: Unauthorized
 * Response 409: Setting key already exists
 * Response 500: Internal server error
 *
 * @example
 * POST /api/v1/crm/settings
 * Body: {
 *   "setting_key": "custom_pipeline_config",
 *   "setting_value": { ... },
 *   "category": "pipeline",
 *   "data_type": "object"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate via auth guard
    const { userId } = await requireCrmApiAuth();

    // STEP 2: Parse request body
    const body = await request.json();

    // STEP 3: Validate with Zod
    const validatedData = CreateSettingSchema.parse(body);

    // STEP 4: Check if setting key already exists
    const repo = new CrmSettingsRepository(db);
    const exists = await repo.exists(validatedData.setting_key);

    if (exists) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_KEY",
            message: `Setting with key "${validatedData.setting_key}" already exists`,
          },
        },
        { status: 409 }
      );
    }

    // STEP 5: Create setting
    const setting = await repo.upsertByKey(
      validatedData.setting_key,
      {
        setting_value: validatedData.setting_value,
        category: validatedData.category,
        data_type: validatedData.data_type,
        description: validatedData.description ?? undefined,
        display_label: validatedData.display_label ?? undefined,
        help_text: validatedData.help_text ?? undefined,
        ui_component: validatedData.ui_component ?? undefined,
        display_order: validatedData.display_order,
        is_system: validatedData.is_system,
      },
      userId
    );

    // STEP 6: Audit log
    logger.info(
      {
        settingKey: setting.setting_key,
        userId,
        category: setting.category,
      },
      "[CRM Settings Create] Setting created"
    );

    // STEP 7: Success response
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
        message: "Setting created successfully",
      },
      { status: 201 }
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

    logger.error({ error }, "[CRM Settings Create] Error creating setting");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while creating the setting",
        },
      },
      { status: 500 }
    );
  }
}
