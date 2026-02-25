/**
 * Leads Browser - Split view: Master list (left) + Detail (right)
 * Instant search and selection without page navigation
 */

import { Suspense, cache } from "react";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/prisma";
import { LeadsBrowserClient } from "@/components/crm/leads/LeadsBrowserClient";
import { localizedRedirect } from "@/lib/navigation";
import type { Lead, LeadStage } from "@/types/crm";

interface BrowserPageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Fetch ALL leads from database for browser view
 */
const fetchAllLeads = cache(
  async (): Promise<{
    leads: Lead[];
    owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  }> => {
    const [rawLeads, salesTeamMembers] = await Promise.all([
      db.crm_leads.findMany({
        where: { deleted_at: null },
        include: {
          assigned_member: {
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
        take: 200,
      }),
      db.adm_members.findMany({
        where: {
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

    const leads: Lead[] = rawLeads.map((lead) => {
      const assignedTo = lead.assigned_member;

      return {
        id: lead.id,
        lead_code: lead.lead_code,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        phone: lead.phone,
        company_name: lead.company_name,
        industry: lead.industry,
        company_size: lead.company_size,
        fleet_size: lead.fleet_size,
        current_software: lead.current_software,
        website_url: lead.website_url,
        linkedin_url: lead.linkedin_url,
        country_code: lead.country_code,
        country: lead.crm_countries || null,
        city: lead.city,
        status: lead.status,
        lead_stage: lead.lead_stage as LeadStage | null,
        priority: lead.priority,
        fit_score: lead.fit_score ? Number(lead.fit_score) : null,
        engagement_score: lead.engagement_score
          ? Number(lead.engagement_score)
          : null,
        qualification_score: lead.qualification_score
          ? Number(lead.qualification_score)
          : null,
        scoring: lead.scoring as Record<string, unknown> | null,
        source: lead.source,
        source_id: lead.source_id,
        utm_source: lead.utm_source,
        utm_medium: lead.utm_medium,
        utm_campaign: lead.utm_campaign,
        message: lead.message,
        qualification_notes: lead.qualification_notes,
        assigned_to: assignedTo
          ? {
              id: assignedTo.id,
              first_name: assignedTo.first_name ?? "",
              last_name: assignedTo.last_name,
              email: assignedTo.email,
            }
          : null,
        gdpr_consent: lead.gdpr_consent,
        consent_at: lead.consent_at?.toISOString() || null,
        consent_ip: lead.consent_ip,
        created_at: lead.created_at.toISOString(),
        updated_at: lead.updated_at?.toISOString() || null,
        qualified_date: lead.qualified_date?.toISOString() || null,
        converted_date: lead.converted_date?.toISOString() || null,
        next_action_date: lead.next_action_date?.toISOString() || null,
        opportunity_id: lead.opportunity_id,
        metadata: lead.metadata as Record<string, unknown> | null,
      };
    });

    return {
      leads,
      owners: salesTeamMembers.map((m) => ({
        ...m,
        first_name: m.first_name ?? "",
      })),
    };
  }
);

export default async function LeadsBrowserPage({ params }: BrowserPageProps) {
  const session = await getSession();
  const { locale } = await params;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const { leads, owners } = await fetchAllLeads();

  return (
    <Suspense
      fallback={
        <div className="flex h-full">
          <div className="w-80 animate-pulse border-r bg-gray-100 dark:bg-gray-900" />
          <div className="flex-1 animate-pulse bg-gray-50 dark:bg-gray-950" />
        </div>
      }
    >
      <LeadsBrowserClient
        leads={leads}
        owners={owners}
        locale={locale as "en" | "fr"}
      />
    </Suspense>
  );
}
