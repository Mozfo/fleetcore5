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
import type { Lead, LeadStatus, LeadStage } from "@/types/crm";
import type { LeadsFilters } from "@/components/crm/leads/LeadsFilterBar";

interface LeadsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    lead_stage?: string;
    assigned_to?: string;
    country_code?: string;
    min_score?: string;
    search?: string;
  }>;
}

/**
 * Parse URL search params into LeadsFilters (for initial hydration)
 */
function parseFiltersFromURL(searchParams: {
  status?: string;
  lead_stage?: string;
  assigned_to?: string;
  country_code?: string;
  min_score?: string;
  search?: string;
}): LeadsFilters {
  return {
    status: (searchParams.status as LeadStatus | "all") || "all",
    lead_stage: (searchParams.lead_stage as LeadStage | "all") || "all",
    assigned_to: searchParams.assigned_to || "all",
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
    // Query ALL leads (client will filter)
    const rawLeads = await db.crm_leads.findMany({
      where: {
        deleted_at: null, // Exclude soft-deleted only
      },
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
            flag_emoji: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100, // Limit to 100 for performance
    });

    // Map to frontend-friendly format
    const leads: Lead[] = rawLeads.map((lead) => {
      const assignedTo =
        lead.adm_provider_employees_crm_leads_assigned_toToadm_provider_employees;

      return {
        ...lead,
        status: lead.status as LeadStatus,
        lead_stage: lead.lead_stage as LeadStage,
        country: lead.crm_countries || null,
        assigned_to: assignedTo
          ? {
              id: assignedTo.id,
              first_name: assignedTo.first_name,
              last_name: assignedTo.last_name,
            }
          : null,
        // Convert Decimal to number
        fit_score: lead.fit_score ? Number(lead.fit_score) : null,
        engagement_score: lead.engagement_score
          ? Number(lead.engagement_score)
          : null,
        qualification_score: lead.qualification_score
          ? Number(lead.qualification_score)
          : null,
        created_at: lead.created_at.toISOString(),
        updated_at: lead.updated_at?.toISOString() || null,
      };
    });

    // Extract unique countries for filter dropdown
    const uniqueCountries = Array.from(
      new Map(
        leads
          .filter(
            (l): l is typeof l & { country: NonNullable<typeof l.country> } =>
              l.country !== null
          )
          .map((l) => [l.country.country_code, l.country])
      ).values()
    );

    // Extract unique owners for filter dropdown
    const uniqueOwners = Array.from(
      new Map(
        leads
          .filter(
            (
              l
            ): l is typeof l & {
              assigned_to: NonNullable<typeof l.assigned_to>;
            } => l.assigned_to !== null
          )
          .map((l) => [l.assigned_to.id, l.assigned_to])
      ).values()
    );

    return {
      leads,
      countries: uniqueCountries,
      owners: uniqueOwners,
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

  // Parse initial filters from URL (for hydration)
  const initialFilters = parseFiltersFromURL(searchParamsData);

  // Fetch ALL leads (no filters - client handles filtering)
  const { leads, countries, owners } = await fetchAllLeads();

  return (
    <div className="space-y-6">
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
