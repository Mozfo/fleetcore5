/**
 * Opportunities Pipeline Page - Vue Kanban principale du CRM
 * Server Component: fetch initial SANS filtres
 * Filtres: gérés côté client avec useMemo (instantané)
 */

import { Suspense, cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { OpportunitiesPageClient } from "@/components/crm/opportunities/OpportunitiesPageClient";
import { localizedRedirect } from "@/lib/navigation";
import { getMemberUuidFromClerkUserId } from "@/lib/utils/clerk-uuid-mapper";
import type {
  Opportunity,
  OpportunityStage,
  OpportunityStatus,
} from "@/types/crm";
import { getStageMaxDays } from "@/lib/config/opportunity-stages";

export interface OpportunitiesFilters {
  stage: OpportunityStage | "all";
  status: OpportunityStatus | "all";
  assigned_to: string;
  min_value?: number;
  max_value?: number;
  is_rotting?: boolean;
  search?: string;
}

interface OpportunitiesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    stage?: string;
    status?: string;
    assigned_to?: string;
    assigned?: string;
    min_value?: string;
    max_value?: string;
    is_rotting?: string;
    search?: string;
  }>;
}

/**
 * Parse URL search params into OpportunitiesFilters
 */
function parseFiltersFromURL(
  searchParams: {
    stage?: string;
    status?: string;
    assigned_to?: string;
    assigned?: string;
    min_value?: string;
    max_value?: string;
    is_rotting?: string;
    search?: string;
  },
  currentUserMemberUuid?: string
): OpportunitiesFilters {
  const assignedValue =
    searchParams.assigned_to || searchParams.assigned || "all";
  let resolvedAssignedTo: string = assignedValue;

  if (assignedValue === "me" && currentUserMemberUuid) {
    resolvedAssignedTo = currentUserMemberUuid;
  } else if (assignedValue === "me" && !currentUserMemberUuid) {
    resolvedAssignedTo = "all";
  }

  return {
    stage: (searchParams.stage as OpportunityStage | "all") || "all",
    status: (searchParams.status as OpportunityStatus | "all") || "open",
    assigned_to: resolvedAssignedTo,
    min_value: searchParams.min_value
      ? parseFloat(searchParams.min_value)
      : undefined,
    max_value: searchParams.max_value
      ? parseFloat(searchParams.max_value)
      : undefined,
    is_rotting: searchParams.is_rotting === "true",
    search: searchParams.search || undefined,
  };
}

/**
 * Fetch ALL opportunities from database (client handles filtering)
 */
const fetchAllOpportunities = cache(
  async (): Promise<{
    opportunities: Array<
      Opportunity & { days_in_stage: number; is_rotting: boolean }
    >;
    owners: Array<{ id: string; first_name: string; last_name: string | null }>;
    leads: Array<{
      id: string;
      company_name: string | null;
      first_name: string | null;
      last_name: string | null;
      email: string;
      phone: string | null;
    }>;
  }> => {
    const now = new Date();

    const [rawOpportunities, salesTeamMembers, qualifiedLeads] =
      await Promise.all([
        db.crm_opportunities.findMany({
          where: {
            deleted_at: null,
          },
          include: {
            xva1wvf: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                company_name: true,
                country_code: true,
                crm_countries: {
                  select: {
                    country_code: true,
                    country_name_en: true,
                    flag_emoji: true,
                  },
                },
              },
            },
            mfiaerr: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
              },
            },
          },
          orderBy: { created_at: "desc" },
          take: 200,
        }),
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
        // Fetch qualified leads for manual opportunity creation
        db.crm_leads.findMany({
          where: {
            status: "qualified",
            deleted_at: null,
          },
          orderBy: { company_name: "asc" },
          select: {
            id: true,
            company_name: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
          take: 500, // Limit for performance
        }),
      ]);

    const opportunities: Array<
      Opportunity & { days_in_stage: number; is_rotting: boolean }
    > = rawOpportunities.map((opp) => {
      const lead = opp.xva1wvf;
      const assignedTo = opp.mfiaerr;

      // Calculate days in stage
      const stageEnteredAt = new Date(opp.stage_entered_at);
      const daysInStage = Math.floor(
        (now.getTime() - stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      const maxDays = opp.max_days_in_stage ?? getStageMaxDays(opp.stage);

      return {
        id: opp.id,
        lead_id: opp.lead_id,
        stage: opp.stage,
        status: opp.status as OpportunityStatus,
        expected_value: opp.expected_value ? Number(opp.expected_value) : null,
        probability_percent: opp.probability_percent
          ? Number(opp.probability_percent)
          : null,
        forecast_value: opp.forecast_value ? Number(opp.forecast_value) : null,
        won_value: opp.won_value ? Number(opp.won_value) : null,
        currency: opp.currency,
        discount_amount: opp.discount_amount
          ? Number(opp.discount_amount)
          : null,
        close_date: opp.close_date?.toISOString() ?? null,
        expected_close_date: opp.expected_close_date?.toISOString() ?? null,
        won_date: opp.won_date?.toISOString() ?? null,
        lost_date: opp.lost_date?.toISOString() ?? null,
        created_at: opp.created_at.toISOString(),
        updated_at: opp.updated_at?.toISOString() ?? null,
        stage_entered_at: opp.stage_entered_at.toISOString(),
        max_days_in_stage: maxDays,
        assigned_to: opp.assigned_to,
        owner_id: opp.owner_id,
        pipeline_id: opp.pipeline_id,
        plan_id: opp.plan_id,
        contract_id: opp.contract_id,
        loss_reason: opp.loss_reason,
        notes: opp.notes,
        metadata: opp.metadata as Record<string, unknown>,
        // Computed fields
        days_in_stage: daysInStage,
        is_rotting: daysInStage > maxDays && opp.status === "open",
        // Relations
        lead: lead
          ? {
              id: lead.id,
              first_name: lead.first_name,
              last_name: lead.last_name,
              email: lead.email,
              company_name: lead.company_name,
              country_code: lead.country_code,
              country: lead.crm_countries ?? null,
            }
          : undefined,
        assignedTo: assignedTo
          ? {
              id: assignedTo.id,
              first_name: assignedTo.first_name,
              last_name: assignedTo.last_name,
              email: assignedTo.email,
            }
          : null,
      } as Opportunity & { days_in_stage: number; is_rotting: boolean };
    });

    return {
      opportunities,
      owners: salesTeamMembers,
      leads: qualifiedLeads,
    };
  }
);

export default async function OpportunitiesPage({
  params,
  searchParams,
}: OpportunitiesPageProps) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const searchParamsData = await searchParams;

  const member = await getMemberUuidFromClerkUserId(userId);
  const currentUserMemberUuid = member?.id;

  const initialFilters = parseFiltersFromURL(
    searchParamsData,
    currentUserMemberUuid
  );

  const { opportunities, owners, leads } = await fetchAllOpportunities();

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <OpportunitiesPageClient
          allOpportunities={opportunities}
          owners={owners}
          leads={leads}
          initialFilters={initialFilters}
        />
      </Suspense>
    </div>
  );
}
