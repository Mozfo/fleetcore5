"use server";

/**
 * CRM Lead Activities Server Actions
 *
 * Server Actions for managing lead activities (calls, emails, notes, meetings, tasks).
 * Uses Clerk auth() and Prisma to interact with crm_lead_activities table.
 *
 * Security:
 * 1. Authentication via Clerk auth()
 * 2. Zod input validation
 * 3. Authorization (FleetCore Admin only)
 *
 * @see prisma/schema.prisma - crm_lead_activities model
 */

import { auth, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { revalidatePath } from "next/cache";
import { LeadScoringService } from "@/lib/services/crm/lead-scoring.service";

const ADMIN_ORG_ID = process.env.FLEETCORE_ADMIN_ORG_ID;

// ============================================================================
// GET LEAD ACTIVITIES
// ============================================================================

export type GetLeadActivitiesResult =
  | {
      success: true;
      activities: Array<{
        id: string;
        lead_id: string;
        activity_type: string;
        title: string | null;
        description: string | null;
        metadata: unknown;
        scheduled_at: string | null;
        completed_at: string | null;
        is_completed: boolean;
        performed_by: string | null;
        performed_by_name: string | null;
        created_at: string;
        updated_at: string;
      }>;
      total: number;
    }
  | { success: false; error: string };

/**
 * Server Action: Get activities for a lead
 *
 * Fetches all activities for a given lead with pagination.
 *
 * @param leadId - UUID of the lead
 * @param options - Pagination options (limit, offset)
 * @returns Result object with activities array and total count
 */
export async function getLeadActivitiesAction(
  leadId: string,
  options?: { limit?: number; offset?: number }
): Promise<GetLeadActivitiesResult> {
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

    // 3. Validate leadId is a UUID
    const uuidSchema = z.string().uuid("Invalid lead ID");
    const validatedLeadId = uuidSchema.safeParse(leadId);
    if (!validatedLeadId.success) {
      return { success: false, error: "Invalid lead ID format" };
    }

    // 4. Query activities from database
    const limit = options?.limit ?? 50;
    const offset = options?.offset ?? 0;

    const [activities, total] = await Promise.all([
      db.crm_lead_activities.findMany({
        where: { lead_id: leadId },
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      db.crm_lead_activities.count({
        where: { lead_id: leadId },
      }),
    ]);

    // 5. Serialize data for client (convert Date to ISO string)
    const serializedActivities = activities.map((activity) => ({
      id: activity.id,
      lead_id: activity.lead_id,
      activity_type: activity.activity_type,
      title: activity.title,
      description: activity.description,
      metadata: activity.metadata,
      scheduled_at: activity.scheduled_at?.toISOString() || null,
      completed_at: activity.completed_at?.toISOString() || null,
      is_completed: activity.is_completed ?? false,
      performed_by: activity.performed_by,
      performed_by_name: activity.performed_by_name,
      created_at:
        activity.created_at?.toISOString() || new Date().toISOString(),
      updated_at:
        activity.updated_at?.toISOString() || new Date().toISOString(),
    }));

    return {
      success: true,
      activities: serializedActivities,
      total,
    };
  } catch (error) {
    logger.error({ error, leadId }, "[getLeadActivitiesAction] Error");
    return { success: false, error: "Failed to fetch activities" };
  }
}

// ============================================================================
// CREATE ACTIVITY
// ============================================================================

// Schema for creating activity
const CreateActivitySchema = z.object({
  lead_id: z.string().uuid("Invalid lead ID"),
  activity_type: z.enum(["call", "email", "note", "meeting", "task"]),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
});

export type CreateActivityInput = z.infer<typeof CreateActivitySchema>;

export type CreateActivityResult =
  | {
      success: true;
      activity: {
        id: string;
        lead_id: string;
        activity_type: string;
        title: string | null;
        description: string | null;
        metadata: unknown;
        scheduled_at: string | null;
        completed_at: string | null;
        is_completed: boolean;
        performed_by: string | null;
        performed_by_name: string | null;
        created_at: string;
        updated_at: string;
      };
    }
  | { success: false; error: string };

/**
 * Server Action: Create a new activity for a lead
 *
 * Creates a new activity (call, email, note, meeting, task) attached to a lead.
 * Automatically records the user who performed the action.
 *
 * @param data - Activity data (lead_id, activity_type, title, description, etc.)
 * @returns Result object with created activity or error
 */
export async function createActivityAction(
  data: CreateActivityInput
): Promise<CreateActivityResult> {
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

    // 3. Validate with Zod
    const validated = CreateActivitySchema.safeParse(data);
    if (!validated.success) {
      const firstError = validated.error.issues[0];
      return { success: false, error: firstError?.message || "Invalid data" };
    }

    // 4. Verify lead exists
    const lead = await db.crm_leads.findUnique({
      where: { id: validated.data.lead_id },
      select: { id: true },
    });

    if (!lead) {
      return { success: false, error: "Lead not found" };
    }

    // 5. Get current user's name for performed_by_name
    const user = await currentUser();
    const performedByName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.emailAddresses[0]?.emailAddress ||
        "Unknown"
      : "Unknown";

    // 6. Create activity in database
    const activity = await db.crm_lead_activities.create({
      data: {
        lead_id: validated.data.lead_id,
        activity_type: validated.data.activity_type,
        title: validated.data.title,
        description: validated.data.description || null,
        metadata: (validated.data.metadata || {}) as object,
        scheduled_at: validated.data.scheduled_at
          ? new Date(validated.data.scheduled_at)
          : null,
        is_completed: false,
        // Note: performed_by would be a UUID FK to adm_provider_employees
        // For now, we store the name directly since we're using Clerk IDs
        performed_by: null, // Not linking to adm_provider_employees (Clerk vs UUID issue)
        performed_by_name: performedByName,
      },
    });

    // 7. Update last_activity_at on lead and trigger score recalculation
    try {
      // 7a. Update last_activity_at
      await db.crm_leads.update({
        where: { id: validated.data.lead_id },
        data: { last_activity_at: new Date() },
      });

      // 7b. Recalculate scores (async, non-blocking for UX)
      const scoringService = new LeadScoringService();
      const scoreResult = await scoringService.recalculateScores(
        validated.data.lead_id
      );

      logger.info(
        {
          leadId: validated.data.lead_id,
          activityType: validated.data.activity_type,
          stageChanged: scoreResult.stageChanged,
          newStage: scoreResult.newStage,
        },
        "[createActivityAction] Score recalculated after activity"
      );
    } catch (scoreError) {
      // Log but don't fail the activity creation
      logger.warn(
        { leadId: validated.data.lead_id, error: scoreError },
        "[createActivityAction] Score recalculation failed (non-blocking)"
      );
    }

    // 8. Revalidate lead detail page
    revalidatePath(`/[locale]/(crm)/crm/leads/${validated.data.lead_id}`);

    // Log success
    logger.info(
      { leadId: validated.data.lead_id, activityId: activity.id, userId },
      "[createActivityAction] Activity created"
    );

    // 9. Serialize and return
    return {
      success: true,
      activity: {
        id: activity.id,
        lead_id: activity.lead_id,
        activity_type: activity.activity_type,
        title: activity.title,
        description: activity.description,
        metadata: activity.metadata,
        scheduled_at: activity.scheduled_at?.toISOString() || null,
        completed_at: activity.completed_at?.toISOString() || null,
        is_completed: activity.is_completed ?? false,
        performed_by: activity.performed_by,
        performed_by_name: activity.performed_by_name,
        created_at:
          activity.created_at?.toISOString() || new Date().toISOString(),
        updated_at:
          activity.updated_at?.toISOString() || new Date().toISOString(),
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
// COMPLETE ACTIVITY (bonus action for task/meeting completion)
// ============================================================================

const CompleteActivitySchema = z.object({
  activityId: z.string().uuid("Invalid activity ID"),
  notes: z.string().max(2000).optional(),
});

export type CompleteActivityResult =
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
 * Server Action: Mark an activity as completed
 *
 * @param activityId - UUID of the activity to complete
 * @param notes - Optional completion notes
 * @returns Result object with updated activity or error
 */
export async function completeActivityAction(
  activityId: string,
  notes?: string
): Promise<CompleteActivityResult> {
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

    // 3. Validate
    const validated = CompleteActivitySchema.safeParse({ activityId, notes });
    if (!validated.success) {
      return { success: false, error: "Invalid activity ID" };
    }

    // 4. Find activity and get lead_id for revalidation
    const existingActivity = await db.crm_lead_activities.findUnique({
      where: { id: activityId },
      select: { id: true, lead_id: true, metadata: true },
    });

    if (!existingActivity) {
      return { success: false, error: "Activity not found" };
    }

    // 5. Update activity
    const now = new Date();
    const existingMetadata =
      (existingActivity.metadata as Record<string, unknown>) || {};

    const activity = await db.crm_lead_activities.update({
      where: { id: activityId },
      data: {
        is_completed: true,
        completed_at: now,
        updated_at: now,
        metadata: (notes
          ? { ...existingMetadata, completion_notes: notes }
          : existingMetadata) as object,
      },
    });

    // 6. Revalidate
    revalidatePath(`/[locale]/(crm)/crm/leads/${existingActivity.lead_id}`);

    return {
      success: true,
      activity: {
        id: activity.id,
        is_completed: activity.is_completed ?? true,
        completed_at: activity.completed_at?.toISOString() || null,
      },
    };
  } catch (error) {
    logger.error({ error, activityId }, "[completeActivityAction] Error");
    return { success: false, error: "Failed to complete activity" };
  }
}
