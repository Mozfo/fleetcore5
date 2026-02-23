"use server";

/**
 * CRM Lead Convert Server Actions
 *
 * Server Action to convert a Sales Qualified Lead (SQL) to an Opportunity.
 * Creates a new crm_opportunities record and updates the lead.
 *
 * @see lib/actions/crm/qualify.actions.ts for pattern reference
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { getAuditLogUuids, resolveTenantId } from "@/lib/utils/audit-resolver";
import {
  getStageProbability,
  getStageMaxDays,
  DEFAULT_OPPORTUNITY_STAGE,
} from "@/lib/config/opportunity-stages";
import { getOrgCurrency } from "@/lib/organization";

// Schema for convert action
const ConvertSchema = z.object({
  opportunityName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(200),
  expectedValue: z.string().optional(),
  expectedCloseDate: z.string().optional(),
  stage: z.string().optional(),
  notes: z.string().max(2000).optional(),
});

export type ConvertLeadData = z.infer<typeof ConvertSchema>;

export type ConvertLeadResult =
  | {
      success: true;
      lead: Record<string, unknown>;
      opportunity: Record<string, unknown>;
    }
  | { success: false; error: string };

/**
 * Server Action: Convert lead to opportunity
 *
 * Converts a Sales Qualified Lead to an Opportunity.
 * Creates a new crm_opportunities record and links it to the lead.
 *
 * @param leadId - UUID of the lead to convert
 * @param data - Opportunity data (name, value, date, stage, notes)
 * @returns Result object with success/error and created opportunity
 */
export async function convertLeadToOpportunityAction(
  leadId: string,
  data: ConvertLeadData
): Promise<ConvertLeadResult> {
  // DEBUG: Log function entry
  logger.debug(
    { leadId, opportunityName: data.opportunityName },
    "[convertLeadToOpportunityAction] CALLED"
  );

  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId, orgId } = session;

    // 2. Validation Zod
    const validation = ConvertSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid input" };
    }

    // 5. Fetch current lead (with tenant filter)
    const currentLead = await db.crm_leads.findFirst({
      where: { id: leadId, tenant_id: session.orgId },
      include: {
        assigned_member: {
          select: { id: true },
        },
      },
    });

    if (!currentLead) {
      return { success: false, error: "Lead not found" };
    }

    // 6. Verify eligibility - must be sales_qualified
    if (currentLead.lead_stage !== "sales_qualified") {
      return {
        success: false,
        error: "Lead must be Sales Qualified to convert",
      };
    }

    // 7. Get currency from tenant (zero hardcoding principle)
    // Lookup tenant UUID from org ID, then get configured currency
    const tenant = orgId ? await resolveTenantId(orgId) : null;
    const currency = tenant ? await getOrgCurrency(tenant.id) : "EUR";

    // 8. Transaction: Create opportunity + Update lead
    logger.debug(
      { leadId, currency },
      "[convertLeadToOpportunityAction] Starting transaction"
    );

    const result = await db.$transaction(async (tx) => {
      // Create the opportunity - using minimal fields, rely on schema defaults
      logger.debug("[convertLeadToOpportunityAction] Creating opportunity...");

      // Determine stage with fallback to default
      const selectedStage = validation.data.stage || DEFAULT_OPPORTUNITY_STAGE;

      const opportunityData = {
        tenant_id: orgId,
        lead_id: leadId,
        stage: selectedStage,
        // AUTO-PROBABILITY: Calculate from stage config
        probability_percent: getStageProbability(selectedStage),
        // DEAL ROTTING: Set max days and entry timestamp
        max_days_in_stage: getStageMaxDays(selectedStage),
        stage_entered_at: new Date(),
        // Use expected_close_date (the correct field name based on schema)
        expected_close_date: validation.data.expectedCloseDate
          ? new Date(validation.data.expectedCloseDate)
          : null,
        // expected_value must be Decimal - pass as number, Prisma handles conversion
        expected_value: validation.data.expectedValue
          ? Number.parseFloat(validation.data.expectedValue)
          : null,
        // Don't set: status (defaults to 'open')
        // Don't set: assigned_to (might have FK constraint issues)
        // Currency from tenant configuration (adm_tenants.default_currency)
        currency,
        metadata: {
          opportunity_name: validation.data.opportunityName,
          converted_from_lead: true,
          lead_company: currentLead.company_name,
          lead_contact:
            `${currentLead.first_name || ""} ${currentLead.last_name || ""}`.trim(),
          lead_email: currentLead.email,
          lead_phone: currentLead.phone,
          lead_fleet_size: currentLead.fleet_size,
          lead_qualification_score: currentLead.qualification_score,
          lead_assigned_to: currentLead.assigned_to, // Store for reference, not as FK
          notes: validation.data.notes || null,
          created_by_user_id: userId,
        },
      };

      logger.debug(
        { opportunityData },
        "[convertLeadToOpportunityAction] Opportunity data"
      );

      const opportunity = await tx.crm_opportunities.create({
        data: opportunityData,
      });

      // Update the lead
      // V6.3 AUTO STATUS SYNC: Set status to "converted" when converting to opportunity
      const updatedLead = await tx.crm_leads.update({
        where: { id: leadId },
        data: {
          lead_stage: "opportunity",
          status: "converted", // V6.3: Auto-sync status with stage
          converted_date: new Date(),
          opportunity_id: opportunity.id,
          updated_at: new Date(),
        },
        include: {
          assigned_member: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          crm_countries: true,
        },
      });

      return { lead: updatedLead, opportunity };
    });

    // 8. Create audit log entry
    // Look up proper UUIDs for audit log (adm_audit_logs requires UUID FKs)
    const { tenantUuid, memberUuid } = await getAuditLogUuids(orgId, userId);

    if (tenantUuid && memberUuid) {
      await db.adm_audit_logs.create({
        data: {
          tenant_id: tenantUuid,
          member_id: memberUuid,
          entity: "crm_lead",
          entity_id: leadId,
          action: "CONVERT",
          old_values: { lead_stage: currentLead.lead_stage },
          new_values: {
            lead_stage: "opportunity",
            opportunity_id: result.opportunity.id,
            opportunity_name: validation.data.opportunityName,
          },
          severity: "info",
          category: "operational",
        },
      });
    } else {
      // Log warning but don't fail the operation - audit is important but not blocking
      logger.warn(
        { leadId, orgId, userId, tenantUuid, memberUuid },
        "[convertLeadToOpportunityAction] Could not create audit log - UUID lookup failed"
      );
    }

    // 9. Revalidate paths
    revalidatePath("/[locale]/(crm)/crm/leads");
    revalidatePath(`/[locale]/(crm)/crm/leads/${leadId}`);
    revalidatePath("/[locale]/(crm)/crm/opportunities");

    // Log success
    if (process.env.NODE_ENV === "production") {
      logger.info(
        { leadId, opportunityId: result.opportunity.id, userId },
        "[convertLeadToOpportunityAction] Lead converted to opportunity"
      );
    }

    // Serialize Decimal fields to plain numbers for client component compatibility
    const serializedOpportunity = {
      ...result.opportunity,
      expected_value: result.opportunity.expected_value
        ? Number(result.opportunity.expected_value)
        : null,
      probability_percent: result.opportunity.probability_percent
        ? Number(result.opportunity.probability_percent)
        : null,
      forecast_value: result.opportunity.forecast_value
        ? Number(result.opportunity.forecast_value)
        : null,
      won_value: result.opportunity.won_value
        ? Number(result.opportunity.won_value)
        : null,
      discount_amount: result.opportunity.discount_amount
        ? Number(result.opportunity.discount_amount)
        : null,
    };

    // Serialize lead Decimal fields as well
    const serializedLead = {
      ...result.lead,
      fit_score: result.lead.fit_score ? Number(result.lead.fit_score) : null,
      engagement_score: result.lead.engagement_score
        ? Number(result.lead.engagement_score)
        : null,
      qualification_score: result.lead.qualification_score
        ? Number(result.lead.qualification_score)
        : null,
      // Convert Date fields to ISO strings
      created_at: result.lead.created_at.toISOString(),
      updated_at: result.lead.updated_at?.toISOString() || null,
      qualified_date: result.lead.qualified_date?.toISOString() || null,
      converted_date: result.lead.converted_date?.toISOString() || null,
      next_action_date: result.lead.next_action_date?.toISOString() || null,
      consent_at: result.lead.consent_at?.toISOString() || null,
    };

    return {
      success: true,
      lead: serializedLead as unknown as Record<string, unknown>,
      opportunity: serializedOpportunity as unknown as Record<string, unknown>,
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
    logger.error(
      { error, leadId, prismaError },
      "[convertLeadToOpportunityAction] Error"
    );
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to convert lead to opportunity";
    return { success: false, error: errorMessage };
  }
}
