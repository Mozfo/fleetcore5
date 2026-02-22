/**
 * /api/v1/crm/settings/bulk
 * Bulk update multiple CRM settings in a single transaction
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API allows updating multiple settings atomically.
 * Useful for saving entire configuration pages (e.g., pipeline stages).
 *
 * Authentication flow:
 * 1. Auth guard validates: userId + FleetCore Admin org membership + settings:edit
 * 2. Auth guard returns userId, orgId directly
 *
 * Security: Access restricted to FleetCore Admin users with settings:edit permission.
 *
 * @module app/api/v1/crm/settings/bulk
 */

import { NextRequest, NextResponse } from "next/server";
import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { BulkUpdateSettingsSchema } from "@/lib/validators/crm/settings.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";

/**
 * POST /api/v1/crm/settings/bulk
 * Bulk update multiple CRM settings in a single atomic transaction
 *
 * Authentication: Via auth guard (FleetCore Admin + settings:edit)
 *
 * Request Body: {
 *   updates: [
 *     { key: "lead_stages", value: {...} },
 *     { key: "opportunity_stages", value: {...} }
 *   ]
 * }
 *
 * Response 200: { success: true, data: { updated_count: N } }
 * Response 400: Validation error
 * Response 401: Unauthorized
 * Response 500: Internal server error (transaction rolled back)
 *
 * Business Logic:
 * - All updates happen in a single transaction
 * - If any update fails, ALL updates are rolled back
 * - Each setting's version is incremented
 * - Maximum 10 updates per request (rate limiting)
 *
 * @example
 * POST /api/v1/crm/settings/bulk
 * Body: {
 *   "updates": [
 *     { "key": "lead_stages", "value": { "stages": [...] } },
 *     { "key": "opportunity_loss_reasons", "value": { "reasons": [...] } }
 *   ]
 * }
 *
 * Response 200: {
 *   "success": true,
 *   "data": {
 *     "updated_count": 2,
 *     "keys": ["lead_stages", "opportunity_loss_reasons"]
 *   },
 *   "message": "2 settings updated successfully"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Authenticate via auth guard
    const { userId } = await requireCrmApiAuth();

    // STEP 2: Parse request body
    const body = await request.json();

    // STEP 3: Validate with Zod
    const validatedData = BulkUpdateSettingsSchema.parse(body);

    // STEP 4: Validate all keys format before processing
    const keyRegex = /^[a-z][a-z0-9_]*$/;
    const invalidKeys = validatedData.updates
      .filter((u) => !keyRegex.test(u.key))
      .map((u) => u.key);

    if (invalidKeys.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_KEYS",
            message: "Some setting keys have invalid format",
            details: invalidKeys,
          },
        },
        { status: 400 }
      );
    }

    // STEP 5: Bulk update in transaction
    const repo = new CrmSettingsRepository(db);
    const updatedCount = await repo.bulkUpdate(validatedData.updates, userId);

    // STEP 6: Audit log
    logger.info(
      {
        userId,
        keys: validatedData.updates.map((u) => u.key),
        count: updatedCount,
      },
      "[CRM Settings Bulk] Bulk update completed"
    );

    // STEP 7: Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          updated_count: updatedCount,
          keys: validatedData.updates.map((u) => u.key),
        },
        message: `${updatedCount} setting(s) updated successfully`,
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

    // Transaction error
    if (
      error instanceof Error &&
      error.message.includes("Transaction failed")
    ) {
      logger.error(
        { error },
        "[CRM Settings Bulk] Transaction failed - all updates rolled back"
      );
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "TRANSACTION_FAILED",
            message: "Bulk update failed. All changes have been rolled back.",
            details: error.message,
          },
        },
        { status: 500 }
      );
    }

    logger.error({ error }, "[CRM Settings Bulk] Error in bulk update");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred during bulk update",
        },
      },
      { status: 500 }
    );
  }
}
