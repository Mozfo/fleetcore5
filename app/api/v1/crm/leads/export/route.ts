/**
 * /api/v1/crm/leads/export
 * Export leads to CSV or JSON for BI tools
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * INTERNAL CRM API - FleetCore Admin Backoffice
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Exports filtered leads data in CSV or JSON format.
 * Supports the same filters as the main leads API plus cold leads filter.
 * Designed for external BI tools (Power BI, Excel, etc.)
 *
 * @module app/api/v1/crm/leads/export
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// CSV field definitions with labels
const CSV_FIELDS = [
  { key: "lead_code", label: "Lead Code" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "company_name", label: "Company" },
  { key: "industry", label: "Industry" },
  { key: "company_size", label: "Company Size" },
  { key: "fleet_size", label: "Fleet Size" },
  { key: "current_software", label: "Current Software" },
  { key: "website_url", label: "Website" },
  { key: "linkedin_url", label: "LinkedIn" },
  { key: "country_code", label: "Country Code" },
  { key: "country_name", label: "Country" },
  { key: "city", label: "City" },
  { key: "status", label: "Status" },
  { key: "lead_stage", label: "Stage" },
  { key: "priority", label: "Priority" },
  { key: "fit_score", label: "Fit Score" },
  { key: "engagement_score", label: "Engagement Score" },
  { key: "qualification_score", label: "Qualification Score" },
  { key: "source", label: "Source" },
  { key: "utm_source", label: "UTM Source" },
  { key: "utm_medium", label: "UTM Medium" },
  { key: "utm_campaign", label: "UTM Campaign" },
  { key: "assigned_to_name", label: "Assigned To" },
  { key: "assigned_to_email", label: "Assigned Email" },
  { key: "message", label: "Message" },
  { key: "qualification_notes", label: "Qualification Notes" },
  { key: "gdpr_consent", label: "GDPR Consent" },
  { key: "consent_at", label: "Consent Date" },
  { key: "created_at", label: "Created At" },
  { key: "updated_at", label: "Updated At" },
  { key: "qualified_date", label: "Qualified Date" },
  { key: "converted_date", label: "Converted Date" },
];

/**
 * Escape CSV value (handle quotes, commas, newlines)
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format date for CSV
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

/**
 * POST /api/v1/crm/leads/export
 *
 * Request Body:
 * - format: "csv" | "json" (default: "csv")
 * - filters: Object with filter criteria
 *   - status: Lead status
 *   - lead_stage: Lead stage
 *   - assigned_to: Assigned employee ID
 *   - country_code: Country code
 *   - min_score: Minimum qualification score
 *   - search: Search term
 *   - inactive_months: Cold lead threshold (only include leads inactive > X months)
 *   - include_cold: Boolean to include cold leads only
 * - columns: Array of column keys to include (default: all)
 * - ids: Array of specific lead IDs to export (optional)
 *
 * @example
 * POST /api/v1/crm/leads/export
 * Body: {
 *   "format": "csv",
 *   "filters": {
 *     "status": "lost",
 *     "inactive_months": 6
 *   },
 *   "columns": ["lead_code", "company_name", "email", "status"]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // STEP 1: Auth from middleware headers
    const userId = request.headers.get("x-user-id");
    const orgId = request.headers.get("x-org-id");

    if (!userId || !orgId) {
      logger.error({ userId, orgId }, "[CRM Lead Export] Missing auth headers");
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "Authentication required" },
        },
        { status: 401 }
      );
    }

    // STEP 2: Parse request body
    const body = await request.json();
    const {
      format = "csv",
      filters = {},
      columns = CSV_FIELDS.map((f) => f.key),
      ids,
    } = body;

    // STEP 3: Build where clause
    const where: Record<string, unknown> = {
      deleted_at: null,
    };

    // Apply filters
    if (filters.status) where.status = filters.status;
    if (filters.lead_stage) where.lead_stage = filters.lead_stage;
    if (filters.assigned_to) where.assigned_to = filters.assigned_to;
    if (filters.country_code) where.country_code = filters.country_code;
    if (filters.min_score !== undefined) {
      where.qualification_score = { gte: filters.min_score };
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search, mode: "insensitive" } },
        { company_name: { contains: filters.search, mode: "insensitive" } },
        { first_name: { contains: filters.search, mode: "insensitive" } },
        { last_name: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Cold leads filter (inactive for X months)
    if (filters.inactive_months) {
      const coldThreshold = new Date();
      coldThreshold.setMonth(
        coldThreshold.getMonth() - filters.inactive_months
      );
      where.updated_at = { lt: coldThreshold };
    }

    // Include cold leads only (status OR inactivity)
    if (filters.include_cold) {
      const coldThreshold = new Date();
      coldThreshold.setMonth(
        coldThreshold.getMonth() - (filters.inactive_months || 6)
      );
      where.OR = [
        { status: { in: ["lost", "disqualified"] } },
        { updated_at: { lt: coldThreshold } },
      ];
    }

    // Specific IDs filter
    if (ids && Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids };
    }

    // STEP 4: Query leads (max 10,000 for export)
    const leads = await db.crm_leads.findMany({
      where,
      include: {
        adm_provider_employees_crm_leads_assigned_toToadm_provider_employees: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        crm_countries: {
          select: {
            country_code: true,
            country_name_en: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 10000,
    });

    // STEP 5: Transform data
    const exportData = leads.map((lead) => {
      const assigned =
        lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees;
      const country = lead.crm_countries;

      return {
        lead_code: lead.lead_code,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        company_name: lead.company_name,
        industry: lead.industry,
        company_size: lead.company_size,
        fleet_size: lead.fleet_size,
        current_software: lead.current_software,
        website_url: lead.website_url,
        linkedin_url: lead.linkedin_url,
        country_code: lead.country_code,
        country_name: country?.country_name_en || "",
        city: lead.city,
        status: lead.status,
        lead_stage: lead.lead_stage,
        priority: lead.priority,
        fit_score: lead.fit_score,
        engagement_score: lead.engagement_score,
        qualification_score: lead.qualification_score,
        source: lead.source,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        assigned_to_name: assigned
          ? `${assigned.first_name} ${assigned.last_name || ""}`.trim()
          : "",
        assigned_to_email: assigned?.email || "",
        message: lead.message,
        qualification_notes: lead.qualification_notes,
        gdpr_consent: lead.gdpr_consent ? "Yes" : "No",
        consent_at: formatDate(lead.consent_at),
        created_at: formatDate(lead.created_at),
        updated_at: formatDate(lead.updated_at),
        qualified_date: formatDate(lead.qualified_date),
        converted_date: formatDate(lead.converted_date),
      };
    });

    // STEP 6: Format output based on requested format
    if (format === "json") {
      // Filter columns if specified
      const filteredData = exportData.map((row) => {
        const filtered: Record<string, unknown> = {};
        columns.forEach((col: string) => {
          if (col in row) {
            filtered[col] = row[col as keyof typeof row];
          }
        });
        return filtered;
      });

      return NextResponse.json(
        {
          success: true,
          data: filteredData,
          meta: {
            total: filteredData.length,
            exported_at: new Date().toISOString(),
          },
        },
        { status: 200 }
      );
    }

    // CSV format
    const selectedFields = CSV_FIELDS.filter((f) => columns.includes(f.key));
    const headerRow = selectedFields.map((f) => f.label).join(",");

    const dataRows = exportData.map((row) =>
      selectedFields
        .map((f) => escapeCSV(row[f.key as keyof typeof row]))
        .join(",")
    );

    const csvContent = [headerRow, ...dataRows].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-export-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    logger.error({ error }, "[CRM Lead Export] Error exporting leads");

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to export leads",
          details: error instanceof Error ? error.message : undefined,
        },
      },
      { status: 500 }
    );
  }
}
