"use server";

/**
 * CRM Activities Server Actions (Unified Polymorphic)
 *
 * Server Actions for managing CRM activities (calls, emails, notes, meetings, tasks).
 * Uses the unified crm_activities table with polymorphic links to leads AND/OR opportunities.
 *
 * Security:
 * 1. Authentication via requireCrmAuth (HQ org check)
 * 2. Zod input validation
 * 3. Tenant isolation via session.orgId
 *
 * @see prisma/schema.prisma - crm_activities model
 * @module lib/actions/crm/activities.actions
 */

import { requireCrmAuth } from "@/lib/auth/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { LeadScoringService } from "@/lib/services/crm/lead-scoring.service";

// ============================================================================
// TYPES
// ============================================================================

export type ActivityType = "call" | "email" | "note" | "meeting" | "task";

export interface Activity {
  id: string;
  lead_id: string | null;
  opportunity_id: string | null;
  tenant_id: string;
  activity_type: ActivityType;
  subject: string;
  description: string | null;
  activity_date: string;
  duration_minutes: number | null;
  outcome: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  creator?: {
    first_name: string;
    last_name: string | null;
  } | null;
}

export interface ActivityFilters {
  leadId?: string;
  opportunityId?: string;
  type?: ActivityType;
  isCompleted?: boolean;
  limit?: number;
  offset?: number;
}

// ============================================================================
// GET ACTIVITIES (Polymorphic)
// ============================================================================

export type GetActivitiesResult =
  | { success: true; activities: Activity[]; total: number }
  | { success: false; error: string };

/**
 * Server Action: Get activities with polymorphic filters
 *
 * Can fetch activities by leadId, opportunityId, or both.
 * At least one filter (leadId or opportunityId) is required.
 *
 * @param filters - Filter options (leadId, opportunityId, type, isCompleted)
 * @returns Result with activities array and total count
 */
export async function getActivitiesAction(
  filters: ActivityFilters
): Promise<GetActivitiesResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();

    // 2. Validate at least one entity filter
    if (!filters.leadId && !filters.opportunityId) {
      return {
        success: false,
        error: "At least leadId or opportunityId is required",
      };
    }

    // 5. Build where clause
    const whereClause: Record<string, unknown> = {
      tenant_id: session.orgId,
    };

    if (filters.leadId) {
      whereClause.lead_id = filters.leadId;
    }
    if (filters.opportunityId) {
      whereClause.opportunity_id = filters.opportunityId;
    }
    if (filters.type) {
      whereClause.activity_type = filters.type;
    }
    if (typeof filters.isCompleted === "boolean") {
      whereClause.is_completed = filters.isCompleted;
    }

    // 6. Query with pagination
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;

    const [activities, total] = await Promise.all([
      db.crm_activities.findMany({
        where: whereClause,
        orderBy: { activity_date: "desc" },
        take: limit,
        skip: offset,
        include: {
          created_by_member: {
            select: { first_name: true, last_name: true },
          },
        },
      }),
      db.crm_activities.count({ where: whereClause }),
    ]);

    // 7. Serialize for client
    const serializedActivities: Activity[] = activities.map((a) => ({
      id: a.id,
      lead_id: a.lead_id,
      opportunity_id: a.opportunity_id,
      tenant_id: a.tenant_id,
      activity_type: a.activity_type as ActivityType,
      subject: a.subject,
      description: a.description,
      activity_date: a.activity_date.toISOString(),
      duration_minutes: a.duration_minutes,
      outcome: a.outcome,
      is_completed: a.is_completed ?? false,
      completed_at: a.completed_at?.toISOString() || null,
      created_by: a.created_by,
      created_at: a.created_at?.toISOString() || new Date().toISOString(),
      updated_at: a.updated_at?.toISOString() || new Date().toISOString(),
      creator: a.created_by_member
        ? {
            first_name: a.created_by_member.first_name ?? "",
            last_name: a.created_by_member.last_name,
          }
        : null,
    }));

    return { success: true, activities: serializedActivities, total };
  } catch (error) {
    logger.error({ error, filters }, "[getActivitiesAction] Error");
    return { success: false, error: "Failed to fetch activities" };
  }
}

// ============================================================================
// CREATE ACTIVITY (Polymorphic)
// ============================================================================

const CreateActivitySchema = z
  .object({
    leadId: z.string().uuid("Invalid lead ID").optional().nullable(),
    opportunityId: z
      .string()
      .uuid("Invalid opportunity ID")
      .optional()
      .nullable(),
    activityType: z.enum(["call", "email", "note", "meeting", "task"]),
    subject: z.string().min(1, "Subject is required").max(255),
    description: z.string().max(5000).optional().nullable(),
    activityDate: z.coerce.date().optional(),
    durationMinutes: z.number().int().min(0).max(1440).optional().nullable(),
    outcome: z.string().max(100).optional().nullable(),
  })
  .refine((data) => data.leadId || data.opportunityId, {
    message: "At least leadId or opportunityId is required",
  });

export type CreateActivityData = z.infer<typeof CreateActivitySchema>;

export type CreateActivityResult =
  | { success: true; activity: Activity }
  | { success: false; error: string };

/**
 * Server Action: Create a new activity
 *
 * Creates an activity linked to a lead, opportunity, or both.
 * At least one of leadId or opportunityId must be provided.
 *
 * @param data - Activity data
 * @returns Result with created activity or error
 */
export async function createActivityAction(
  data: CreateActivityData
): Promise<CreateActivityResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validate with Zod
    const validated = CreateActivitySchema.safeParse(data);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid data" };
    }

    // 5. Verify lead exists if provided
    if (validated.data.leadId) {
      const lead = await db.crm_leads.findFirst({
        where: {
          id: validated.data.leadId,
          tenant_id: session.orgId,
          deleted_at: null,
        },
        select: { id: true },
      });
      if (!lead) {
        return { success: false, error: "Lead not found" };
      }
    }

    // 6. Verify opportunity exists if provided
    if (validated.data.opportunityId) {
      const opportunity = await db.crm_opportunities.findFirst({
        where: {
          id: validated.data.opportunityId,
          deleted_at: null,
          tenant_id: session.orgId,
        },
        select: { id: true },
      });
      if (!opportunity) {
        return { success: false, error: "Opportunity not found" };
      }
    }

    // 7. Get current member ID for created_by
    const member = await db.adm_members.findFirst({
      where: {
        auth_user_id: userId,
        tenant_id: session.orgId,
        deleted_at: null,
      },
      select: { id: true },
    });
    const createdBy = member?.id ?? null;

    // 8. Create activity
    const activity = await db.crm_activities.create({
      data: {
        lead_id: validated.data.leadId ?? undefined,
        opportunity_id: validated.data.opportunityId ?? undefined,
        tenant_id: session.orgId,
        activity_type: validated.data.activityType,
        subject: validated.data.subject,
        description: validated.data.description ?? undefined,
        activity_date: validated.data.activityDate ?? new Date(),
        duration_minutes: validated.data.durationMinutes ?? undefined,
        outcome: validated.data.outcome ?? undefined,
        is_completed: false,
        created_by: createdBy ?? undefined,
      },
      include: {
        created_by_member: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    // 9. Update last_activity_at on lead if linked
    if (validated.data.leadId) {
      try {
        await db.crm_leads.update({
          where: { id: validated.data.leadId },
          data: { last_activity_at: new Date() },
        });

        // Recalculate scores (async, non-blocking)
        const scoringService = new LeadScoringService();
        await scoringService.recalculateScores(validated.data.leadId);
      } catch (scoreError) {
        logger.warn(
          { leadId: validated.data.leadId, error: scoreError },
          "[createActivityAction] Score update failed (non-blocking)"
        );
      }
    }

    // 10. Revalidate paths
    if (validated.data.leadId) {
      revalidatePath(`/[locale]/(app)/crm/leads/${validated.data.leadId}`);
    }
    if (validated.data.opportunityId) {
      revalidatePath(`/[locale]/(app)/crm/opportunities`);
    }

    logger.info(
      {
        activityId: activity.id,
        leadId: validated.data.leadId,
        opportunityId: validated.data.opportunityId,
        userId,
      },
      "[createActivityAction] Activity created"
    );

    // 11. Serialize and return
    return {
      success: true,
      activity: {
        id: activity.id,
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        tenant_id: activity.tenant_id,
        activity_type: activity.activity_type as ActivityType,
        subject: activity.subject,
        description: activity.description,
        activity_date: activity.activity_date.toISOString(),
        duration_minutes: activity.duration_minutes,
        outcome: activity.outcome,
        is_completed: activity.is_completed ?? false,
        completed_at: activity.completed_at?.toISOString() || null,
        created_by: activity.created_by,
        created_at:
          activity.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          activity.updated_at?.toISOString() || new Date().toISOString(),
        creator: activity.created_by_member
          ? {
              first_name: activity.created_by_member.first_name ?? "",
              last_name: activity.created_by_member.last_name,
            }
          : null,
      },
    };
  } catch (error) {
    logger.error({ error, data }, "[createActivityAction] Error");
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create activity";
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// UPDATE ACTIVITY
// ============================================================================

const UpdateActivitySchema = z.object({
  subject: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  activityDate: z.coerce.date().optional(),
  durationMinutes: z.number().int().min(0).max(1440).optional().nullable(),
  outcome: z.string().max(100).optional().nullable(),
});

export type UpdateActivityData = z.infer<typeof UpdateActivitySchema>;

export type UpdateActivityResult =
  | { success: true; activity: Activity }
  | { success: false; error: string };

/**
 * Server Action: Update an existing activity
 *
 * @param id - Activity UUID
 * @param data - Fields to update
 * @returns Result with updated activity or error
 */
export async function updateActivityAction(
  id: string,
  data: UpdateActivityData
): Promise<UpdateActivityResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();

    // 2. Validate UUID
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return { success: false, error: "Invalid activity ID" };
    }

    // 3. Validate data
    const validated = UpdateActivitySchema.safeParse(data);
    if (!validated.success) {
      return { success: false, error: "Invalid update data" };
    }

    // 6. Find activity with tenant filter
    const existing = await db.crm_activities.findFirst({
      where: { id, tenant_id: session.orgId },
      select: { id: true, lead_id: true, opportunity_id: true },
    });

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    // 7. Update activity
    const updateData: Record<string, unknown> = {};
    if (validated.data.subject !== undefined) {
      updateData.subject = validated.data.subject;
    }
    if (validated.data.description !== undefined) {
      updateData.description = validated.data.description;
    }
    if (validated.data.activityDate !== undefined) {
      updateData.activity_date = validated.data.activityDate;
    }
    if (validated.data.durationMinutes !== undefined) {
      updateData.duration_minutes = validated.data.durationMinutes;
    }
    if (validated.data.outcome !== undefined) {
      updateData.outcome = validated.data.outcome;
    }

    const activity = await db.crm_activities.update({
      where: { id },
      data: updateData,
      include: {
        created_by_member: {
          select: { first_name: true, last_name: true },
        },
      },
    });

    // 8. Revalidate paths
    if (existing.lead_id) {
      revalidatePath(`/[locale]/(app)/crm/leads/${existing.lead_id}`);
    }
    if (existing.opportunity_id) {
      revalidatePath(`/[locale]/(app)/crm/opportunities`);
    }

    return {
      success: true,
      activity: {
        id: activity.id,
        lead_id: activity.lead_id,
        opportunity_id: activity.opportunity_id,
        tenant_id: activity.tenant_id,
        activity_type: activity.activity_type as ActivityType,
        subject: activity.subject,
        description: activity.description,
        activity_date: activity.activity_date.toISOString(),
        duration_minutes: activity.duration_minutes,
        outcome: activity.outcome,
        is_completed: activity.is_completed ?? false,
        completed_at: activity.completed_at?.toISOString() || null,
        created_by: activity.created_by,
        created_at:
          activity.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          activity.updated_at?.toISOString() || new Date().toISOString(),
        creator: activity.created_by_member
          ? {
              first_name: activity.created_by_member.first_name ?? "",
              last_name: activity.created_by_member.last_name,
            }
          : null,
      },
    };
  } catch (error) {
    logger.error({ error, id }, "[updateActivityAction] Error");
    return { success: false, error: "Failed to update activity" };
  }
}

// ============================================================================
// DELETE ACTIVITY
// ============================================================================

export type DeleteActivityResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action: Delete an activity
 *
 * @param id - Activity UUID
 * @returns Result indicating success or error
 */
export async function deleteActivityAction(
  id: string
): Promise<DeleteActivityResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validate UUID
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return { success: false, error: "Invalid activity ID" };
    }

    // 4. Find activity with tenant filter
    const existing = await db.crm_activities.findFirst({
      where: { id, tenant_id: session.orgId },
      select: { id: true, lead_id: true, opportunity_id: true },
    });

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    // 5. Delete activity
    await db.crm_activities.delete({ where: { id } });

    logger.info(
      { activityId: id, userId },
      "[deleteActivityAction] Activity deleted"
    );

    // 7. Revalidate paths
    if (existing.lead_id) {
      revalidatePath(`/[locale]/(app)/crm/leads/${existing.lead_id}`);
    }
    if (existing.opportunity_id) {
      revalidatePath(`/[locale]/(app)/crm/opportunities`);
    }

    return { success: true };
  } catch (error) {
    logger.error({ error, id }, "[deleteActivityAction] Error");
    return { success: false, error: "Failed to delete activity" };
  }
}

// ============================================================================
// MARK ACTIVITY COMPLETE
// ============================================================================

export type MarkActivityCompleteResult =
  | {
      success: true;
      activity: {
        id: string;
        is_completed: boolean;
        completed_at: string | null;
      };
    }
  | { success: false; error: string };

/**
 * Server Action: Mark an activity as complete
 *
 * @param id - Activity UUID
 * @returns Result with completion status or error
 */
export async function markActivityCompleteAction(
  id: string
): Promise<MarkActivityCompleteResult> {
  try {
    // 1. Authentication & Authorization
    const session = await requireCrmAuth();
    const { userId } = session;

    // 2. Validate UUID
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return { success: false, error: "Invalid activity ID" };
    }

    // 4. Find activity with tenant filter
    const existing = await db.crm_activities.findFirst({
      where: { id, tenant_id: session.orgId },
      select: {
        id: true,
        lead_id: true,
        opportunity_id: true,
        is_completed: true,
      },
    });

    if (!existing) {
      return { success: false, error: "Activity not found" };
    }

    if (existing.is_completed) {
      return { success: false, error: "Activity is already completed" };
    }

    // 6. Mark as complete
    const now = new Date();
    const activity = await db.crm_activities.update({
      where: { id },
      data: {
        is_completed: true,
        completed_at: now,
      },
    });

    logger.info(
      { activityId: id, userId },
      "[markActivityCompleteAction] Activity completed"
    );

    // 7. Revalidate paths
    if (existing.lead_id) {
      revalidatePath(`/[locale]/(app)/crm/leads/${existing.lead_id}`);
    }
    if (existing.opportunity_id) {
      revalidatePath(`/[locale]/(app)/crm/opportunities`);
    }

    return {
      success: true,
      activity: {
        id: activity.id,
        is_completed: activity.is_completed ?? true,
        completed_at: activity.completed_at?.toISOString() || null,
      },
    };
  } catch (error) {
    logger.error({ error, id }, "[markActivityCompleteAction] Error");
    return { success: false, error: "Failed to complete activity" };
  }
}

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getActivitiesAction({ leadId }) instead
 */
export async function getLeadActivitiesAction(
  leadId: string,
  options?: { limit?: number; offset?: number }
) {
  return getActivitiesAction({
    leadId,
    limit: options?.limit,
    offset: options?.offset,
  });
}

/**
 * @deprecated Use markActivityCompleteAction instead
 */
export async function completeActivityAction(
  activityId: string,
  _notes?: string
) {
  return markActivityCompleteAction(activityId);
}
