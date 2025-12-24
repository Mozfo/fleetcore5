/**
 * Leads Kanban Page - Vue Kanban principale du CRM
 * Server Component: fetch initial SANS filtres
 * Filtres: gérés côté client avec useMemo (instantané)
 */

import { Suspense, cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { LeadsPageClient } from "@/components/crm/leads/LeadsPageClient";
import { LeadCardSkeleton } from "@/components/crm/leads/LeadCardSkeleton";
import { localizedRedirect } from "@/lib/navigation";
import { getMemberUuidFromClerkUserId } from "@/lib/utils/clerk-uuid-mapper";
import type { Lead, LeadStatus, LeadStage } from "@/types/crm";
import type { LeadsFilters } from "@/components/crm/leads/LeadsFilterBar";

interface LeadsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    lead_stage?: string;
    assigned_to?: string;
    assigned?: string; // Alias for assigned_to (supports "me" keyword)
    country_code?: string;
    min_score?: string;
    search?: string;
  }>;
}

/**
 * Parse URL search params into LeadsFilters (for initial hydration)
 * Supports `assigned=me` or `assigned_to=me` to filter by current user
 */
function parseFiltersFromURL(
  searchParams: {
    status?: string;
    lead_stage?: string;
    assigned_to?: string;
    assigned?: string; // Alias for assigned_to
    country_code?: string;
    min_score?: string;
    search?: string;
  },
  currentUserMemberUuid?: string
): LeadsFilters {
  // Handle assigned_to filter with "me" keyword support
  const assignedValue =
    searchParams.assigned_to || searchParams.assigned || "all";
  let resolvedAssignedTo: string = assignedValue;

  // If "me" is passed, replace with current user's member UUID
  if (assignedValue === "me" && currentUserMemberUuid) {
    resolvedAssignedTo = currentUserMemberUuid;
  } else if (assignedValue === "me" && !currentUserMemberUuid) {
    // Fallback to "all" if user member not found
    resolvedAssignedTo = "all";
  }

  return {
    status: (searchParams.status as LeadStatus | "all") || "all",
    lead_stage: (searchParams.lead_stage as LeadStage | "all") || "all",
    assigned_to: resolvedAssignedTo,
    country_code: searchParams.country_code || "all",
    min_score: searchParams.min_score
      ? parseInt(searchParams.min_score)
      : undefined,
    search: searchParams.search || undefined,
  };
}

/**
 * Fetch ALL leads from database (no filters - client handles filtering)
 * Wrapped with React cache() for automatic deduplication
 */
const fetchAllLeads = cache(
  async (): Promise<{
    leads: Lead[];
    countries: Array<{
      country_code: string;
      country_name_en: string;
      flag_emoji: string;
    }>;
    owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  }> => {
    // Fetch leads, operational countries, AND sales team members in parallel
    const [rawLeads, operationalCountries, salesTeamMembers] =
      await Promise.all([
        // Query ALL leads (client will filter)
        db.crm_leads.findMany({
          where: {
            deleted_at: null, // Exclude soft-deleted only
          },
          include: {
            adm_provider_employees_crm_leads_assigned_toToadm_provider_employees:
              {
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
                flag_emoji: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 100, // Limit to 100 for performance
        }),
        // Fetch countries from crm_countries with is_operational = true
        // Source unique: crm_countries table, trié par display_order
        db.crm_countries.findMany({
          where: {
            is_operational: true,
          },
          orderBy: { display_order: "asc" },
          select: {
            country_code: true,
            country_name_en: true,
            flag_emoji: true,
          },
        }),
        // Fetch sales team members from adm_provider_employees
        // Note: department is case-sensitive in database ('Sales' not 'sales')
        db.adm_provider_employees.findMany({
          where: {
            department: "Sales",
            status: "active",
            deleted_at: null,
          },
          orderBy: { first_name: "asc" },
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        }),
      ]);

    // Map to frontend-friendly format with ALL fields from schema
    const leads: Lead[] = rawLeads.map((lead) => {
      const assignedTo =
        lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees;

      return {
        // Core identifiers
        id: lead.id,
        lead_code: lead.lead_code,

        // Contact information
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,

        // Company information
        company_name: lead.company_name,
        industry: lead.industry,
        company_size: lead.company_size,
        fleet_size: lead.fleet_size,
        current_software: lead.current_software,
        website_url: lead.website_url,
        linkedin_url: lead.linkedin_url,

        // Location
        country_code: lead.country_code,
        country: lead.crm_countries || null,
        city: lead.city,

        // Status & Stage
        status: lead.status,
        lead_stage: lead.lead_stage as LeadStage | null,
        priority: lead.priority,

        // Scoring (convert Decimal to number)
        fit_score: lead.fit_score ? Number(lead.fit_score) : null,
        engagement_score: lead.engagement_score
          ? Number(lead.engagement_score)
          : null,
        qualification_score: lead.qualification_score
          ? Number(lead.qualification_score)
          : null,
        scoring: lead.scoring as Record<string, unknown> | null,

        // Source & Attribution
        source: lead.source,
        source_id: lead.source_id,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,

        // Message & Notes
        message: lead.message,
        qualification_notes: lead.qualification_notes,

        // Assignment
        assigned_to: assignedTo
          ? {
              id: assignedTo.id,
              first_name: assignedTo.first_name,
              last_name: assignedTo.last_name,
              email: assignedTo.email,
            }
          : null,

        // GDPR
        gdpr_consent: lead.gdpr_consent,
        consent_at: lead.consent_at?.toISOString() || null,
        consent_ip: lead.consent_ip,

        // Dates (must be serialized for RSC)
        created_at: lead.created_at.toISOString(),
        updated_at: lead.updated_at?.toISOString() || null,
        qualified_date: lead.qualified_date?.toISOString() || null,
        converted_date: lead.converted_date?.toISOString() || null,
        next_action_date: lead.next_action_date?.toISOString() || null,

        // Opportunity link
        opportunity_id: lead.opportunity_id,

        // Metadata
        metadata: lead.metadata as Record<string, unknown> | null,
      };
    });

    return {
      leads,
      countries: operationalCountries, // Source: crm_countries avec is_operational = true
      owners: salesTeamMembers, // Source: adm_provider_employees avec department = 'sales'
    };
  }
);

export default async function LeadsPage({
  params,
  searchParams,
}: LeadsPageProps) {
  // Authentication check
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const searchParamsData = await searchParams;

  // Get current user's member UUID for "assigned=me" filter support
  const member = await getMemberUuidFromClerkUserId(userId);
  const currentUserMemberUuid = member?.id;

  // Parse initial filters from URL (for hydration)
  // Supports "assigned=me" which resolves to current user's member UUID
  const initialFilters = parseFiltersFromURL(
    searchParamsData,
    currentUserMemberUuid
  );

  // Fetch ALL leads (no filters - client handles filtering)
  const { leads, countries, owners } = await fetchAllLeads();

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <LeadCardSkeleton />
                  <LeadCardSkeleton />
                  <LeadCardSkeleton />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <LeadsPageClient
          allLeads={leads}
          countries={countries}
          owners={owners}
          initialFilters={initialFilters}
        />
      </Suspense>
    </div>
  );
}
