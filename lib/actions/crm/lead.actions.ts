"use server";

/**
 * CRM Lead Server Actions
 *
 * Server Actions for CRM backoffice operations.
 * Uses Clerk auth() directly - no middleware tenant check required.
 *
 * Security:
 * 1. Authentication via Clerk auth()
 * 2. Zod input validation
 * 3. Authorization (FleetCore Admin only)
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 * @see https://clerk.com/articles/complete-authentication-guide-for-nextjs-app-router
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
import type { LeadStatus } from "@/types/crm";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Schema de validation pour status update (Kanban)
const UpdateStatusSchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  status: z.enum(["new", "working", "qualified", "lost"]),
});

// Schema de validation pour lead update (Drawer edit mode - F1-B)
const UpdateLeadSchema = z.object({
  first_name: z.string().min(2).max(50).optional(),
  last_name: z.string().min(2).max(50).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional().nullable(),
  company_name: z.string().min(2).max(100).optional(),
  fleet_size: z.string().optional().nullable(),
  current_software: z.string().max(100).optional().nullable(),
  website_url: z.string().url().optional().nullable().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  next_action_date: z.coerce.date().optional().nullable(),
  assigned_to_id: z.string().uuid().optional().nullable(),
});

export type UpdateLeadData = z.infer<typeof UpdateLeadSchema>;

export type UpdateStatusResult =
  | { success: true; data: { id: string; status: LeadStatus } }
  | { success: false; error: string };

/**
 * Server Action: Update lead status
 *
 * Used by Kanban drag & drop to persist status changes.
 *
 * @param leadId - UUID of the lead to update
 * @param status - New status value
 * @returns Result object with success/error
 */
export async function updateLeadStatusAction(
  leadId: string,
  status: LeadStatus
): Promise<UpdateStatusResult> {
  try {
    // 1. Authentication
    const { userId, orgId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Validation Zod
    const validation = UpdateStatusSchema.safeParse({ leadId, status });
    if (!validation.success) {
      return { success: false, error: "Invalid input" };
    }

    // 3. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Fetch current lead to get old status and metadata
    const currentLead = await db.crm_leads.findFirst({
      where: { id: leadId, ...buildProviderFilter(providerId) },
      select: { status: true, metadata: true, qualified_date: true },
    });

    if (!currentLead) {
      return { success: false, error: "Lead not found" };
    }

    const oldStatus = currentLead.status;
    const now = new Date();

    // 5. Build update data with business rules
    // RÈGLE MÉTIER: Enregistrer les timestamps de transition
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {
      status,
      updated_at: now,
    };

    // RÈGLE MÉTIER: Quand status = "lost", enregistrer lost_at dans metadata
    if (status === "lost") {
      const existingMetadata =
        (currentLead.metadata as Record<string, unknown>) || {};
      updateData.metadata = {
        ...existingMetadata,
        lost_at: now.toISOString(),
        lost_from_status: oldStatus,
      };
    }

    // RÈGLE MÉTIER: Quand status = "qualified", enregistrer qualified_date
    if (status === "qualified" && !currentLead.qualified_date) {
      updateData.qualified_date = now;
    }

    // 6. Update with Prisma (provider_id filter already applied via RLS)
    const updatedLead = await db.crm_leads.update({
      where: { id: leadId },
      data: updateData,
      select: {
        id: true,
        status: true,
      },
    });

    // Log success (using console to avoid pino worker thread issues in dev)
    if (process.env.NODE_ENV === "production") {
      logger.info(
        { leadId, oldStatus, newStatus: status, userId },
        "[updateLeadStatusAction] Lead status updated"
      );
    }

    return {
      success: true,
      data: {
        id: updatedLead.id,
        status: updatedLead.status,
      },
    };
  } catch (error) {
    // Log error (using console to avoid pino worker thread issues in dev)
    if (process.env.NODE_ENV === "production") {
      logger.error({ error, leadId }, "[updateLeadStatusAction] Error");
    }
    return { success: false, error: "Failed to update lead status" };
  }
}

// ============================================================================
// F1-B: Update Lead Action (Drawer Edit Mode)
// ============================================================================

export type UpdateLeadResult =
  | { success: true; lead: Record<string, unknown> }
  | { success: false; error: string };

/**
 * Server Action: Update lead fields
 *
 * Used by Drawer edit mode to persist lead changes.
 * Includes audit logging to adm_audit_logs.
 *
 * @param leadId - UUID of the lead to update
 * @param data - Partial lead data to update
 * @returns Result object with success/error and updated lead
 */
export async function updateLeadAction(
  leadId: string,
  data: UpdateLeadData
): Promise<UpdateLeadResult> {
  // DEBUG: Log function entry
  logger.debug({ leadId, data }, "[updateLeadAction] CALLED");

  try {
    // 1. Authentication
    const { userId, orgId } = await auth();
    logger.debug(
      { userId: userId?.substring(0, 15), orgId: orgId?.substring(0, 15) },
      "[updateLeadAction] Auth result"
    );

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      return { success: false, error: "Forbidden: Admin access required" };
    }

    // 3. Validation Zod
    const validation = UpdateLeadSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Fetch old lead for audit log (with provider filter)
    const oldLead = await db.crm_leads.findFirst({
      where: { id: leadId, ...buildProviderFilter(providerId) },
    });

    if (!oldLead) {
      return { success: false, error: "Lead not found" };
    }

    // 6. Prepare update data (only non-undefined fields)
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    const validatedData = validation.data;
    if (validatedData.first_name !== undefined)
      updateData.first_name = validatedData.first_name;
    if (validatedData.last_name !== undefined)
      updateData.last_name = validatedData.last_name;
    if (validatedData.email !== undefined)
      updateData.email = validatedData.email;
    if (validatedData.phone !== undefined)
      updateData.phone = validatedData.phone;
    if (validatedData.company_name !== undefined)
      updateData.company_name = validatedData.company_name;
    if (validatedData.fleet_size !== undefined)
      updateData.fleet_size = validatedData.fleet_size;
    if (validatedData.current_software !== undefined)
      updateData.current_software = validatedData.current_software;
    if (validatedData.website_url !== undefined)
      updateData.website_url = validatedData.website_url || null;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;
    if (validatedData.message !== undefined)
      updateData.message = validatedData.message;
    if (validatedData.next_action_date !== undefined)
      updateData.next_action_date = validatedData.next_action_date;
    if (validatedData.assigned_to_id !== undefined)
      updateData.assigned_to = validatedData.assigned_to_id;

    // 7. Update lead with Prisma
    const updatedLead = await db.crm_leads.update({
      where: { id: leadId },
      data: updateData,
      include: {
        eu1f9qh: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        crm_countries: true,
      },
    });

    // 8. Create audit log entry
    // Look up proper UUIDs from Clerk IDs (adm_audit_logs requires UUID FKs)
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_lead",
          entity_id: leadId,
          action: "UPDATE",
          old_values: oldLead,
          new_values: validatedData,
          severity: "info",
          category: "operational",
        },
      });
    } else {
      // Log warning but don't fail the operation - audit is important but not blocking
      logger.warn(
        { leadId, orgId, userId, tenantUuid, memberUuid },
        "[updateLeadAction] Could not create audit log - UUID lookup failed"
      );
    }

    // Log success (using console to avoid pino worker thread issues in dev)
    if (process.env.NODE_ENV === "production") {
      logger.info(
        { leadId, userId, changes: Object.keys(validatedData) },
        "[updateLeadAction] Lead updated with audit log"
      );
    }

    // Serialize lead data for Client Component (convert Decimal to Number, Date to ISO string)
    const serializedLead = {
      id: updatedLead.id,
      lead_code: updatedLead.lead_code,
      email: updatedLead.email,
      first_name: updatedLead.first_name,
      last_name: updatedLead.last_name,
      phone: updatedLead.phone,
      company_name: updatedLead.company_name,
      fleet_size: updatedLead.fleet_size,
      current_software: updatedLead.current_software,
      website_url: updatedLead.website_url,
      linkedin_url: updatedLead.linkedin_url,
      industry: updatedLead.industry,
      company_size: updatedLead.company_size,
      city: updatedLead.city,
      country_code: updatedLead.country_code,
      country: updatedLead.crm_countries,
      status: updatedLead.status,
      lead_stage: updatedLead.lead_stage,
      priority: updatedLead.priority,
      source: updatedLead.source,
      source_id: updatedLead.source_id,
      utm_source: updatedLead.utm_source,
      utm_medium: updatedLead.utm_medium,
      utm_campaign: updatedLead.utm_campaign,
      message: updatedLead.message,
      qualification_notes: updatedLead.qualification_notes,
      // Convert Decimal to Number
      fit_score: updatedLead.fit_score ? Number(updatedLead.fit_score) : null,
      engagement_score: updatedLead.engagement_score
        ? Number(updatedLead.engagement_score)
        : null,
      qualification_score: updatedLead.qualification_score
        ? Number(updatedLead.qualification_score)
        : null,
      // Format assigned_to relation
      assigned_to: updatedLead.eu1f9qh
        ? {
            id: updatedLead.eu1f9qh.id,
            first_name: updatedLead.eu1f9qh.first_name,
            last_name: updatedLead.eu1f9qh.last_name,
          }
        : null,
      gdpr_consent: updatedLead.gdpr_consent,
      consent_at: updatedLead.consent_at?.toISOString() || null,
      consent_ip: updatedLead.consent_ip,
      // Convert Date to ISO string
      created_at: updatedLead.created_at.toISOString(),
      updated_at: updatedLead.updated_at?.toISOString() || null,
      qualified_date: updatedLead.qualified_date?.toISOString() || null,
      converted_date: updatedLead.converted_date?.toISOString() || null,
      next_action_date: updatedLead.next_action_date?.toISOString() || null,
      opportunity_id: updatedLead.opportunity_id,
      metadata: updatedLead.metadata,
    };

    return {
      success: true,
      lead: serializedLead,
    };
  } catch (error) {
    // Log error with full details
    const prismaError =
      error && typeof error === "object" && "code" in error
        ? {
            code: (error as { code?: string }).code,
            meta: (error as { meta?: unknown }).meta,
          }
        : undefined;
    logger.error({ error, leadId, prismaError }, "[updateLeadAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to update lead";
    return { success: false, error: errorMessage };
  }
}
