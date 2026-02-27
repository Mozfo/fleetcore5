/**
 * /api/v1/crm/leads/[id]
 * Lead detail operations (GET, PATCH, DELETE)
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Context: This API manages prospects/leads BEFORE they become clients.
 * Prospects do NOT have a tenantId (they're not clients yet).
 *
 * Authentication flow:
 * 1. Middleware validates: userId + FleetCore Admin org membership + CRM role
 * 2. Middleware injects: x-user-id, x-org-id headers
 * 3. This route trusts middleware validation (no redundant tenantId check)
 *
 * Security: Access restricted to FleetCore Admin users with CRM roles
 * (org:adm_admin, org:adm_commercial) - enforced at middleware level.
 *
 * @module app/api/v1/crm/leads/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { UpdateLeadSchema } from "@/lib/validators/crm/lead.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { requireCrmApiAuth } from "@/lib/auth/api-guard";
import { AppError } from "@/lib/core/errors";
import { getValidFleetSizeValues } from "@/lib/helpers/fleet-size.server";

/**
 * GET /api/v1/crm/leads/[id]
 * Retrieve detailed information for a specific lead
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 * Tenant Isolation: N/A (CRM manages prospects without tenant)
 *
 * Response 200: Lead with full relations (employee, country, source)
 * Response 401: Unauthorized (middleware handles this)
 * Response 404: Lead not found or soft-deleted
 * Response 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate via direct auth helper
    await requireCrmApiAuth();
    const { id } = await params;

    // STEP 2: Validate ID format
    // Basic UUID format validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // STEP 4: Query lead with relations
    const lead = await db.crm_leads.findFirst({
      where: {
        id,
        deleted_at: null, // Exclude soft-deleted
      },
      include: {
        // Assigned employee
        assigned_member: true,
        // Country
        crm_countries: true,
        // Source
        crm_lead_sources: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Lead not found or has been deleted",
          },
        },
        { status: 404 }
      );
    }

    // STEP 5: Format response
    const assignedEmployee = lead.assigned_member;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: lead.id,
          lead_code: lead.lead_code,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          company_name: lead.company_name,
          phone: lead.phone,
          country_code: lead.country_code,
          country: lead.crm_countries
            ? {
                country_code: lead.crm_countries.country_code,
                country_name_en: lead.crm_countries.country_name_en,
                country_name_fr: lead.crm_countries.country_name_fr,
                country_name_ar: lead.crm_countries.country_name_ar,
                flag_emoji: lead.crm_countries.flag_emoji,
                is_operational: lead.crm_countries.is_operational,
                country_gdpr: lead.crm_countries.country_gdpr,
              }
            : null,
          fleet_size: lead.fleet_size,
          status: lead.status,
          lead_stage: lead.lead_stage,
          priority: lead.priority,
          fit_score: lead.fit_score ? Number(lead.fit_score) : null,
          engagement_score: lead.engagement_score
            ? Number(lead.engagement_score)
            : null,
          qualification_score: lead.qualification_score
            ? Number(lead.qualification_score)
            : null,
          assigned_to: assignedEmployee
            ? {
                id: assignedEmployee.id,
                first_name: assignedEmployee.first_name,
                last_name: assignedEmployee.last_name,
                email: assignedEmployee.email,
                role: assignedEmployee.role,
              }
            : null,
          source: lead.crm_lead_sources
            ? {
                id: lead.crm_lead_sources.id,
                name_translations: lead.crm_lead_sources.name_translations,
                description_translations:
                  lead.crm_lead_sources.description_translations,
              }
            : null,
          notes: lead.qualification_notes,
          message: lead.message,
          metadata: lead.metadata as Record<string, unknown> | null,
          gdpr_consent: lead.gdpr_consent,
          consent_ip: lead.consent_ip,
          consent_at: lead.consent_at?.toISOString() || null,
          created_at: lead.created_at.toISOString(),
          updated_at: lead.updated_at?.toISOString() || null,
          qualified_date: lead.qualified_date?.toISOString() || null,
          converted_date: lead.converted_date?.toISOString() || null,
        },
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

    logger.error({ error }, "[Lead Detail] Error fetching lead");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while fetching the lead",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/crm/leads/[id]
 * Update an existing lead
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 * Tenant Isolation: N/A (CRM manages prospects without tenant)
 *
 * Request Body: UpdateLeadInput (validated with Zod)
 * Response 200: Updated lead data
 * Response 400: Validation error or invalid status transition
 * Response 401: Unauthorized (middleware handles this)
 * Response 404: Lead not found
 * Response 500: Internal server error
 *
 * PROTECTED TRANSITIONS:
 * - status="converted" is FORBIDDEN (use POST /leads/[id]/convert)
 * - lead_stage="opportunity" is FORBIDDEN (use POST /leads/[id]/convert)
 *
 * Business Logic:
 * - lead_stage="sales_qualified" → set qualified_date if not already set
 * - updated_at automatically set to NOW()
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate via direct auth helper
    const { userId } = await requireCrmApiAuth();
    const { id } = await params;

    // STEP 2: Validate ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Parse request body
    const body = await request.json();

    // PROTECTION #1: Forbid status="converted" (must use dedicated convert endpoint)
    if (body.status === "converted") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STATUS_TRANSITION",
            message:
              'Cannot set status to "converted" manually. Use POST /api/v1/crm/leads/[id]/convert endpoint instead.',
          },
        },
        { status: 400 }
      );
    }

    // PROTECTION #2: Forbid lead_stage="opportunity" (must use dedicated convert endpoint)
    if (body.lead_stage === "opportunity") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_STAGE_TRANSITION",
            message:
              'Cannot set lead_stage to "opportunity" manually. Use POST /api/v1/crm/leads/[id]/convert endpoint instead.',
          },
        },
        { status: 400 }
      );
    }

    // STEP 5: Validate with Zod
    const validatedData = UpdateLeadSchema.parse(body);

    // STEP 5b: Dynamic fleet_size validation against crm_settings
    if (validatedData.fleet_size) {
      const validSizes = await getValidFleetSizeValues();
      if (!validSizes.includes(validatedData.fleet_size)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "VALIDATION_ERROR",
              message: `Invalid fleet_size "${validatedData.fleet_size}". Valid values: ${validSizes.join(", ")}`,
            },
          },
          { status: 422 }
        );
      }
    }

    // Handle assigned_to_id -> assigned_to mapping
    // Frontend may send assigned_to_id, map it to assigned_to for database
    if (
      validatedData.assigned_to_id !== undefined &&
      validatedData.assigned_to === undefined
    ) {
      validatedData.assigned_to = validatedData.assigned_to_id;
    }
    // Remove assigned_to_id as it's not a database field
    delete validatedData.assigned_to_id;

    // STEP 6: Check lead exists and not soft-deleted
    const existingLead = await db.crm_leads.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Lead not found or has been deleted",
          },
        },
        { status: 404 }
      );
    }

    // STEP 7: Build update data with business logic
    const updateData: Record<string, unknown> = {
      ...validatedData,
      updated_at: new Date(),
    };

    // Business logic: Set qualified_date when lead_stage changes to "sales_qualified"
    if (
      validatedData.lead_stage === "sales_qualified" &&
      existingLead.lead_stage !== "sales_qualified" &&
      !existingLead.qualified_date
    ) {
      updateData.qualified_date = new Date();
    }

    // STEP 8: Update lead with full relations for response
    const updatedLead = await db.crm_leads.update({
      where: { id },
      data: updateData,
      include: {
        assigned_member: true,
        crm_countries: true,
        crm_lead_sources: true,
      },
    });

    // STEP 9: Audit log
    logger.info(
      {
        leadId: id,
        userId,
        changes: Object.keys(validatedData),
        oldStatus: existingLead.status,
        newStatus: validatedData.status || existingLead.status,
      },
      "[Lead Update] Lead modified"
    );

    // STEP 10: Success response with FULL lead data (same format as GET)
    const assignedEmployee = updatedLead.assigned_member;

    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedLead.id,
          lead_code: updatedLead.lead_code,
          email: updatedLead.email,
          first_name: updatedLead.first_name,
          last_name: updatedLead.last_name,
          company_name: updatedLead.company_name,
          phone: updatedLead.phone,
          country_code: updatedLead.country_code,
          country: updatedLead.crm_countries
            ? {
                country_code: updatedLead.crm_countries.country_code,
                country_name_en: updatedLead.crm_countries.country_name_en,
                country_name_fr: updatedLead.crm_countries.country_name_fr,
                country_name_ar: updatedLead.crm_countries.country_name_ar,
                flag_emoji: updatedLead.crm_countries.flag_emoji,
                is_operational: updatedLead.crm_countries.is_operational,
                country_gdpr: updatedLead.crm_countries.country_gdpr,
              }
            : null,
          fleet_size: updatedLead.fleet_size,
          current_software: updatedLead.current_software,
          website_url: updatedLead.website_url,
          linkedin_url: updatedLead.linkedin_url,
          city: updatedLead.city,
          industry: updatedLead.industry,
          company_size: updatedLead.company_size,
          status: updatedLead.status,
          lead_stage: updatedLead.lead_stage,
          priority: updatedLead.priority,
          fit_score: updatedLead.fit_score
            ? Number(updatedLead.fit_score)
            : null,
          engagement_score: updatedLead.engagement_score
            ? Number(updatedLead.engagement_score)
            : null,
          qualification_score: updatedLead.qualification_score
            ? Number(updatedLead.qualification_score)
            : null,
          assigned_to: assignedEmployee
            ? {
                id: assignedEmployee.id,
                first_name: assignedEmployee.first_name,
                last_name: assignedEmployee.last_name,
                email: assignedEmployee.email,
                role: assignedEmployee.role,
              }
            : null,
          assigned_to_id: updatedLead.assigned_to,
          source: updatedLead.crm_lead_sources
            ? {
                id: updatedLead.crm_lead_sources.id,
                name_translations:
                  updatedLead.crm_lead_sources.name_translations,
                description_translations:
                  updatedLead.crm_lead_sources.description_translations,
              }
            : null,
          qualification_notes: updatedLead.qualification_notes,
          message: updatedLead.message,
          next_action_date: updatedLead.next_action_date?.toISOString() || null,
          metadata: updatedLead.metadata as Record<string, unknown> | null,
          gdpr_consent: updatedLead.gdpr_consent,
          consent_ip: updatedLead.consent_ip,
          consent_at: updatedLead.consent_at?.toISOString() || null,
          created_at: updatedLead.created_at.toISOString(),
          updated_at: updatedLead.updated_at?.toISOString() || null,
          qualified_date: updatedLead.qualified_date?.toISOString() || null,
          converted_date: updatedLead.converted_date?.toISOString() || null,
        },
        message: "Lead updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // ERROR HANDLING

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

    // Generic server error
    logger.error({ error }, "[Lead Update] Error updating lead");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while updating the lead",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/crm/leads/[id]
 * Soft delete a lead (set deleted_at timestamp)
 *
 * Authentication: Via middleware (FleetCore Admin + CRM role)
 * Tenant Isolation: N/A (CRM manages prospects without tenant)
 *
 * Response 204: No Content (successful soft delete)
 * Response 401: Unauthorized (middleware handles this)
 * Response 404: Lead not found or already deleted
 * Response 500: Internal server error
 *
 * IMPORTANT: This is a SOFT DELETE only. The lead record remains in the database
 * with deleted_at set to NOW() and deleted_by set to userId.
 *
 * Hard deletes are FORBIDDEN for audit trail compliance.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authenticate via direct auth helper
    const { userId } = await requireCrmApiAuth();
    const { id } = await params;

    // STEP 2: Validate ID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_UUID",
            message: "Invalid lead ID format",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Check lead exists and not already soft-deleted
    const existingLead = await db.crm_leads.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Lead not found or already deleted",
          },
        },
        { status: 404 }
      );
    }

    // STEP 5: Soft delete (set deleted_at and deleted_by)
    await db.crm_leads.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
      },
    });

    // STEP 6: Audit log
    logger.warn(
      {
        leadId: id,
        deletedBy: userId,
        leadEmail: existingLead.email,
        leadCode: existingLead.lead_code,
      },
      "[Lead Delete] Lead soft-deleted"
    );

    // STEP 7: Return 204 No Content
    return new NextResponse(null, { status: 204 });
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

    // Error handling
    logger.error({ error }, "[Lead Delete] Error deleting lead");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while deleting the lead",
        },
      },
      { status: 500 }
    );
  }
}
