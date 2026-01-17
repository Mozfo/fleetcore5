"use server";

/**
 * CRM Bulk Lead Server Actions
 *
 * Server Actions for bulk operations on leads.
 * Uses Clerk auth() directly - no middleware tenant check required.
 *
 * Security:
 * 1. Authentication via Clerk auth()
 * 2. Zod input validation
 * 3. Authorization (FleetCore Admin only)
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 */

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  getCurrentProviderId,
  buildProviderFilter,
} from "@/lib/utils/provider-context";
import type { LeadStatus } from "@/types/crm";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Schemas de validation
const BulkAssignSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "At least one lead required"),
  assigneeId: z.string().uuid("Invalid assignee ID"),
});

// V6.3: 8 statuts (removed demo_scheduled, qualified, demo_completed)
const BulkStatusSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "At least one lead required"),
  status: z.enum([
    "new",
    "demo",
    "proposal_sent",
    "payment_pending",
    "converted",
    "lost",
    "nurturing",
    "disqualified",
  ]),
});

const BulkDeleteSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1, "At least one lead required"),
  reason: z.string().min(1, "Reason is required"),
});

export type BulkActionResult = {
  success: boolean;
  successCount: number;
  failedCount: number;
  errors?: string[];
};

/**
 * Server Action: Bulk assign leads to a team member
 *
 * @param leadIds - Array of lead UUIDs to update
 * @param assigneeId - UUID of the team member to assign
 * @returns BulkActionResult
 */
export async function bulkAssignLeadsAction(
  leadIds: string[],
  assigneeId: string
): Promise<BulkActionResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Unauthorized"],
      };
    }

    // 2. Validation Zod
    const validation = BulkAssignSchema.safeParse({ leadIds, assigneeId });
    if (!validation.success) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Invalid input"],
      };
    }

    // 3. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Forbidden: Admin access required"],
      };
    }

    // 4. Verify assignee exists and is a member
    const assignee = await db.clt_members.findUnique({
      where: { id: assigneeId },
      select: { id: true },
    });

    if (!assignee) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Assignee not found"],
      };
    }

    // 5. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 6. Bulk update with Prisma (with provider filter)
    const result = await db.crm_leads.updateMany({
      where: { id: { in: leadIds }, ...buildProviderFilter(providerId) },
      data: {
        assigned_to: assigneeId,
        updated_at: new Date(),
      },
    });

    logger.info(
      { leadIds, assigneeId, count: result.count, userId },
      "[bulkAssignLeadsAction] Leads assigned"
    );

    return {
      success: true,
      successCount: result.count,
      failedCount: leadIds.length - result.count,
    };
  } catch (error) {
    logger.error({ error, leadIds }, "[bulkAssignLeadsAction] Error");
    return {
      success: false,
      successCount: 0,
      failedCount: leadIds.length,
      errors: ["Failed to assign leads"],
    };
  }
}

/**
 * Server Action: Bulk update lead status
 *
 * @param leadIds - Array of lead UUIDs to update
 * @param status - New status value
 * @returns BulkActionResult
 */
export async function bulkUpdateStatusAction(
  leadIds: string[],
  status: LeadStatus
): Promise<BulkActionResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Unauthorized"],
      };
    }

    // 2. Validation Zod
    const validation = BulkStatusSchema.safeParse({ leadIds, status });
    if (!validation.success) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Invalid input"],
      };
    }

    // 3. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Forbidden: Admin access required"],
      };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Bulk update with Prisma (with provider filter)
    const result = await db.crm_leads.updateMany({
      where: { id: { in: leadIds }, ...buildProviderFilter(providerId) },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    logger.info(
      { leadIds, status, count: result.count, userId },
      "[bulkUpdateStatusAction] Lead statuses updated"
    );

    return {
      success: true,
      successCount: result.count,
      failedCount: leadIds.length - result.count,
    };
  } catch (error) {
    logger.error({ error, leadIds }, "[bulkUpdateStatusAction] Error");
    return {
      success: false,
      successCount: 0,
      failedCount: leadIds.length,
      errors: ["Failed to update lead statuses"],
    };
  }
}

/**
 * Server Action: Bulk soft delete leads
 *
 * @param leadIds - Array of lead UUIDs to delete
 * @param reason - Reason for deletion
 * @returns BulkActionResult
 */
export async function bulkDeleteLeadsAction(
  leadIds: string[],
  reason: string
): Promise<BulkActionResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Unauthorized"],
      };
    }

    // 2. Validation Zod
    const validation = BulkDeleteSchema.safeParse({ leadIds, reason });
    if (!validation.success) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Invalid input"],
      };
    }

    // 3. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return {
        success: false,
        successCount: 0,
        failedCount: leadIds.length,
        errors: ["Forbidden: Admin access required"],
      };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Soft delete with Prisma (with provider filter)
    const result = await db.crm_leads.updateMany({
      where: {
        id: { in: leadIds },
        deleted_at: null, // Only delete non-deleted leads
        ...buildProviderFilter(providerId),
      },
      data: {
        deleted_at: new Date(),
        // Store reason in a notes field or separate table if needed
        updated_at: new Date(),
      },
    });

    logger.info(
      { leadIds, reason, count: result.count, userId },
      "[bulkDeleteLeadsAction] Leads soft deleted"
    );

    return {
      success: true,
      successCount: result.count,
      failedCount: leadIds.length - result.count,
    };
  } catch (error) {
    logger.error({ error, leadIds }, "[bulkDeleteLeadsAction] Error");
    return {
      success: false,
      successCount: 0,
      failedCount: leadIds.length,
      errors: ["Failed to delete leads"],
    };
  }
}
