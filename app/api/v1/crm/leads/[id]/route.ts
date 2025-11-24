/**
 * /api/v1/crm/leads/[id]
 * Lead detail operations (GET, PATCH, DELETE)
 *
 * Authentication: Required (Clerk)
 * Tenant Isolation: Required (Clerk Organizations - orgId)
 *
 * @module app/api/v1/crm/leads/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UpdateLeadSchema } from "@/lib/validators/crm/lead.validators";
import { ZodError } from "zod";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * GET /api/v1/crm/leads/[id]
 * Retrieve detailed information for a specific lead
 *
 * Authentication: Required (Clerk)
 * Tenant Isolation: Via assigned_to → employee → tenant
 *
 * Response 200: Lead with full relations (employee, country, source)
 * Response 401: Unauthorized
 * Response 404: Lead not found or soft-deleted
 * Response 500: Internal server error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // STEP 1: Authentication
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // STEP 2: Tenant isolation
    const tenantId = orgId;
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_TENANT",
            message:
              "No organization context found. Please select an organization.",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Validate ID (already extracted above)
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
        adm_provider_employees_crm_leads_assigned_toToadm_provider_employees: true,
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
    const assignedEmployee =
      lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees;

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
          fit_score: lead.fit_score,
          engagement_score: lead.engagement_score,
          qualification_score: lead.qualification_score,
          assigned_to: assignedEmployee
            ? {
                id: assignedEmployee.id,
                first_name: assignedEmployee.first_name,
                last_name: assignedEmployee.last_name,
                email: assignedEmployee.email,
                title: assignedEmployee.title,
                department: assignedEmployee.department,
              }
            : null,
          source: lead.crm_lead_sources
            ? {
                id: lead.crm_lead_sources.id,
                name: lead.crm_lead_sources.name,
                description: lead.crm_lead_sources.description,
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
 * Authentication: Required (Clerk)
 * Tenant Isolation: Via assigned_to → employee → tenant
 *
 * Request Body: UpdateLeadInput (validated with Zod)
 * Response 200: Updated lead data
 * Response 400: Validation error or invalid status transition
 * Response 401: Unauthorized
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
    // STEP 1: Authentication
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // STEP 2: Tenant isolation
    const tenantId = orgId;
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_TENANT",
            message:
              "No organization context found. Please select an organization.",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Validate ID (already extracted above)
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

    // STEP 4: Parse request body
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

    // STEP 8: Update lead
    const updatedLead = await db.crm_leads.update({
      where: { id },
      data: updateData,
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

    // STEP 10: Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          id: updatedLead.id,
          lead_code: updatedLead.lead_code,
          status: updatedLead.status,
          lead_stage: updatedLead.lead_stage,
          priority: updatedLead.priority,
          assigned_to: updatedLead.assigned_to,
          notes: updatedLead.qualification_notes,
          updated_at: updatedLead.updated_at?.toISOString() || null,
          qualified_date: updatedLead.qualified_date?.toISOString() || null,
        },
        message: "Lead updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    // ERROR HANDLING

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
 * Authentication: Required (Clerk)
 * Tenant Isolation: Via assigned_to → employee → tenant
 *
 * Response 204: No Content (successful soft delete)
 * Response 401: Unauthorized
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
    // STEP 1: Authentication
    const { userId, orgId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        },
        { status: 401 }
      );
    }

    // STEP 2: Tenant isolation
    const tenantId = orgId;
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NO_TENANT",
            message:
              "No organization context found. Please select an organization.",
          },
        },
        { status: 400 }
      );
    }

    // STEP 3: Validate ID (already extracted above)
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

    // STEP 4: Check lead exists and not already soft-deleted
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
