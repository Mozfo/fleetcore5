"use server";

/**
 * CRM Lead Qualify Server Actions
 *
 * Server Action to progress leads through qualification stages.
 * Follows the same pattern as lead.actions.ts.
 *
 * Progression: top_of_funnel → marketing_qualified → sales_qualified → opportunity
 *
 * @see lib/actions/crm/lead.actions.ts for pattern reference
 */

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { getAuditLogUuids } from "@/lib/utils/clerk-uuid-mapper";
import {
  getCurrentProviderId,
  buildProviderFilter,
} from "@/lib/utils/provider-context";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// Stage order for validation (progression only, no going back)
const STAGE_ORDER = [
  "top_of_funnel",
  "marketing_qualified",
  "sales_qualified",
  "opportunity",
] as const;

type LeadStage = (typeof STAGE_ORDER)[number];

// Schema for qualify action
const QualifySchema = z.object({
  leadId: z.string().uuid("Invalid lead ID"),
  newStage: z.enum(["marketing_qualified", "sales_qualified"]),
  notes: z.string().max(1000).optional(),
});

export type QualifyLeadResult =
  | { success: true; lead: Record<string, unknown> }
  | { success: false; error: string };

/**
 * Server Action: Qualify lead to next stage
 *
 * Progresses a lead through the qualification funnel.
 * Only allows forward progression (no going back).
 *
 * @param leadId - UUID of the lead to qualify
 * @param newStage - Target stage (marketing_qualified or sales_qualified)
 * @param notes - Optional qualification notes
 * @returns Result object with success/error and updated lead
 */
export async function qualifyLeadAction(
  leadId: string,
  newStage: string,
  notes?: string
): Promise<QualifyLeadResult> {
  // DEBUG: Log function entry
  logger.debug(
    { leadId, newStage, notes: notes?.substring(0, 50) },
    "[qualifyLeadAction] CALLED"
  );

  try {
    // 1. Authentication
    const { userId, orgId } = await auth();
    logger.debug(
      { userId: userId?.substring(0, 15), orgId: orgId?.substring(0, 15) },
      "[qualifyLeadAction] Auth result"
    );

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    // 2. Authorization - FleetCore Admin only
    if (!ADMIN_ORG_ID || orgId !== ADMIN_ORG_ID) {
      logger.debug(
        { orgId, ADMIN_ORG_ID, match: orgId === ADMIN_ORG_ID },
        "[qualifyLeadAction] Auth debug"
      );
      return {
        success: false,
        error: `Forbidden: Admin access required (org: ${orgId?.slice(0, 10)}...)`,
      };
    }

    // 3. Validation Zod
    const validation = QualifySchema.safeParse({ leadId, newStage, notes });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 4. Get provider context for data isolation
    const providerId = await getCurrentProviderId();

    // 5. Fetch current lead (with provider filter)
    const currentLead = await db.crm_leads.findFirst({
      where: { id: leadId, ...buildProviderFilter(providerId) },
    });

    if (!currentLead) {
      return { success: false, error: "Lead not found" };
    }

    // 6. Validate stage progression (only forward allowed)
    const currentStage =
      (currentLead.lead_stage as LeadStage) || "top_of_funnel";
    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    const newIndex = STAGE_ORDER.indexOf(newStage as LeadStage);

    if (newIndex <= currentIndex) {
      return {
        success: false,
        error: "Cannot move to previous or same stage",
      };
    }

    // 7. Prepare update data
    const updateData: Record<string, unknown> = {
      lead_stage: newStage,
      updated_at: new Date(),
    };

    // AUTO STATUS SYNC: Update status based on stage progression
    // marketing_qualified → status = "working" (if currently "new")
    // sales_qualified → status = "qualified"
    if (newStage === "marketing_qualified" && currentLead.status === "new") {
      updateData.status = "working";
    } else if (newStage === "sales_qualified") {
      updateData.status = "qualified";
    }

    // Set qualified_date when reaching sales_qualified
    if (newStage === "sales_qualified" && !currentLead.qualified_date) {
      updateData.qualified_date = new Date();
    }

    // Append notes if provided
    if (notes) {
      const existingNotes = currentLead.qualification_notes || "";
      const timestamp = new Date().toISOString().split("T")[0];
      const newNote = `[${timestamp}] Stage → ${newStage}: ${notes}`;
      updateData.qualification_notes = existingNotes
        ? `${existingNotes}\n${newNote}`
        : newNote;
    }

    // 8. Update lead with Prisma
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

    // 9. Create audit log entry
    // Look up proper UUIDs from Clerk IDs (adm_audit_logs requires UUID FKs)
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_lead",
          entity_id: leadId,
          action: "QUALIFY",
          old_values: { lead_stage: currentStage },
          new_values: { lead_stage: newStage, notes },
          severity: "info",
          category: "operational",
        },
      });
    } else {
      // Log warning but don't fail the operation - audit is important but not blocking
      logger.warn(
        { leadId, orgId, userId, tenantUuid, memberUuid },
        "[qualifyLeadAction] Could not create audit log - UUID lookup failed"
      );
    }

    // 10. Revalidate paths
    revalidatePath("/[locale]/(crm)/crm/leads");
    revalidatePath(`/[locale]/(crm)/crm/leads/${leadId}`);

    // Log success (using console to avoid pino worker thread issues in dev)
    if (process.env.NODE_ENV === "production") {
      logger.info(
        { leadId, oldStage: currentStage, newStage, userId },
        "[qualifyLeadAction] Lead qualified"
      );
    }

    return {
      success: true,
      lead: updatedLead as unknown as Record<string, unknown>,
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
    logger.error({ error, leadId, prismaError }, "[qualifyLeadAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to qualify lead";
    return { success: false, error: errorMessage };
  }
}
