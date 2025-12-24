"use server";

/**
 * CRM Lead Delete Server Actions
 *
 * Handles soft delete and GDPR permanent delete for leads.
 *
 * Security:
 * 1. Authentication via Clerk auth()
 * 2. Zod input validation
 * 3. Authorization (FleetCore Admin only)
 * 4. Audit logging for compliance
 */

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getAuditLogUuids } from "@/lib/utils/clerk-uuid-mapper";
import {
  getCurrentProviderId,
  buildProviderFilter,
} from "@/lib/utils/provider-context";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Valid deletion reasons
const DELETE_REASONS = [
  "duplicate",
  "invalid_data",
  "request_from_lead",
  "no_longer_interested",
  "gdpr_erasure_request",
  "other",
] as const;

// Schema de validation pour delete lead
const DeleteLeadSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  reason: z.enum(DELETE_REASONS, { message: "Invalid deletion reason" }),
  permanentDelete: z.boolean().default(false),
});

export type DeleteLeadResult =
  | { success: true; message: string; permanent: boolean }
  | { success: false; error: string };

/**
 * Server Action: Delete lead (soft or permanent)
 *
 * Soft delete: Sets deleted_at, deleted_by, deletion_reason
 * Permanent delete: Actually removes from database (GDPR compliance)
 *
 * @param leadId - UUID of the lead to delete
 * @param reason - Reason for deletion
 * @param permanentDelete - Whether to permanently delete (GDPR erasure)
 * @returns Result object with success/error
 */
export async function deleteLeadAction(
  leadId: string,
  reason: string,
  permanentDelete: boolean = false
): Promise<DeleteLeadResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 3. Validation Zod
    const validation = DeleteLeadSchema.safeParse({
      leadId,
      reason,
      permanentDelete,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Verify lead exists (with provider filter)
    const lead = await db.crm_leads.findFirst({
      where: { id: leadId, ...buildProviderFilter(providerId) },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        company_name: true,
      },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    // 6. Get UUIDs for audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (permanentDelete) {
      // PERMANENT DELETE - GDPR erasure
      // First, create audit log before deletion
      if (tenantUuid && memberUuid) {
        await db.adm_audit_logs.create({
          data: {
            tenant_id: tenantUuid,
            member_id: memberUuid,
            entity: "crm_lead",
            entity_id: leadId,
            action: "PERMANENT_DELETE",
            old_values: {
              email: lead.email,
              first_name: lead.first_name,
              last_name: lead.last_name,
              company_name: lead.company_name,
              deletion_reason: reason,
              gdpr_erasure: reason === "gdpr_erasure_request",
            },
            severity: "warning",
            category: "compliance",
          },
        });
      }

      // Permanently delete the lead
      await db.crm_leads.delete({
        where: { id: leadId },
      });

      logger.info(
        { leadId, reason, userId, permanent: true },
        "[deleteLeadAction] Lead permanently deleted (GDPR)"
      );

      return {
        success: true,
        message: "Lead permanently deleted",
        permanent: true,
      };
    } else {
      // SOFT DELETE - Mark as deleted
      await db.crm_leads.update({
        where: { id: leadId },
        data: {
          deleted_at: new Date(),
          deleted_by: userId,
          deletion_reason: reason,
          updated_at: new Date(),
        },
      });

      // Create audit log
      if (tenantUuid && memberUuid) {
        await db.adm_audit_logs.create({
          data: {
            tenant_id: tenantUuid,
            member_id: memberUuid,
            entity: "crm_lead",
            entity_id: leadId,
            action: "SOFT_DELETE",
            old_values: {
              deleted_at: null,
              deleted_by: null,
              deletion_reason: null,
            },
            new_values: {
              deleted_at: new Date(),
              deleted_by: userId,
              deletion_reason: reason,
            },
            severity: "info",
            category: "operational",
          },
        });
      }

      logger.info(
        { leadId, reason, userId, permanent: false },
        "[deleteLeadAction] Lead soft deleted"
      );

      return {
        success: true,
        message: "Lead deleted",
        permanent: false,
      };
    }
  } catch (error) {
    logger.error({ error, leadId }, "[deleteLeadAction] Error");
    return { success: false, error: "Failed to delete lead" };
  }
}

/**
 * Server Action: Restore soft-deleted lead
 *
 * @param leadId - UUID of the lead to restore
 * @returns Result object with success/error
 */
export async function restoreLeadAction(
  leadId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 3. Validate lead ID
    if (!z.string().uuid().safeParse(leadId).success) {
      return { success: false, error: "Invalid lead ID" };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Verify lead exists and is soft-deleted (with provider filter)
    const lead = await db.crm_leads.findFirst({
      where: { id: leadId, ...buildProviderFilter(providerId) },
      select: { id: true, deleted_at: true },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    if (!lead.deleted_at) {
      return { success: false, error: "Lead is not deleted" };
    }

    // 6. Restore the lead
    await db.crm_leads.update({
      where: { id: leadId },
      data: {
        deleted_at: null,
        deleted_by: null,
        deletion_reason: null,
        updated_at: new Date(),
      },
    });

    // 7. Create audit log
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_lead",
          entity_id: leadId,
          action: "RESTORE",
          old_values: { deleted_at: lead.deleted_at },
          new_values: { deleted_at: null },
          severity: "info",
          category: "operational",
        },
      });
    }

    logger.info({ leadId, userId }, "[restoreLeadAction] Lead restored");

    return { success: true };
  } catch (error) {
    logger.error({ error, leadId }, "[restoreLeadAction] Error");
    return { success: false, error: "Failed to restore lead" };
  }
}
