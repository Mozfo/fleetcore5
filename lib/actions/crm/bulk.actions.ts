"use server";

/**
 * CRM Bulk Lead Server Actions
 *
 * Server Actions for bulk operations on leads.
 * Security:
 * 1. Authentication via requireCrmAuth (HQ org check)
 * 2. Zod input validation
 * 3. Tenant isolation via session.orgId
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { LeadStatus } from "@/types/crm";

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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

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

    // 3. Verify assignee exists and is a member
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

    // 6. Bulk update with Prisma (with tenant filter)
    const result = await db.crm_leads.updateMany({
      where: { id: { in: leadIds }, tenant_id: session.orgId },
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

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

    // 5. Bulk update with Prisma (with tenant filter)
    const result = await db.crm_leads.updateMany({
      where: { id: { in: leadIds }, tenant_id: session.orgId },
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
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

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

    // 5. Soft delete with Prisma (with tenant filter)
    const result = await db.crm_leads.updateMany({
      where: {
        id: { in: leadIds },
        deleted_at: null, // Only delete non-deleted leads
        tenant_id: session.orgId,
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
