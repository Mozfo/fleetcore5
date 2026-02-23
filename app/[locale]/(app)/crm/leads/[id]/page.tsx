/**
 * Lead Detail Page - Server Component
 * Fetches lead data via Prisma and renders LeadDetailPage client component
 *
 * Performance optimizations:
 * - Parallel queries with Promise.all
 * - Selective field fetching (no full include)
 * - Single data fetch shared between metadata and page
 */

import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/prisma";
import { LeadDetailPage } from "@/components/crm/leads/LeadDetailPage";
import type { Lead } from "@/types/crm";
import type { Metadata } from "next";
import { cache } from "react";
import { unstable_cache } from "next/cache";

interface LeadPageProps {
  params: Promise<{ locale: string; id: string }>;
}

// Cache owners list for 5 minutes (doesn't change often)
const getOwners = unstable_cache(
  async () => {
    return db.clt_members.findMany({
      where: { deleted_at: null },
      select: { id: true, first_name: true, last_name: true },
      orderBy: { first_name: "asc" },
    });
  },
  ["crm-lead-owners"],
  { revalidate: 300, tags: ["crm-owners"] }
);

// Get lead data + navigation in a SINGLE SQL query (optimized for Supabase latency)
// This replaces separate getLeadData + getAdjacentLeads calls
const getLeadWithNavigation = cache(async (id: string) => {
  // Validate UUID format early
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return null;
  }

  // Single query that gets lead + navigation data using CTE
  const result = await db.$queryRaw<
    Array<{
      // Lead data
      id: string;
      lead_code: string | null;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      company_name: string | null;
      industry: string | null;
      company_size: string | null;
      fleet_size: number | null;
      current_software: string | null;
      website_url: string | null;
      linkedin_url: string | null;
      country_code: string | null;
      city: string | null;
      status: string;
      lead_stage: string | null;
      priority: string | null;
      fit_score: number | null;
      engagement_score: number | null;
      qualification_score: number | null;
      scoring: unknown;
      source: string | null;
      source_id: string | null;
      utm_source: string | null;
      utm_medium: string | null;
      utm_campaign: string | null;
      message: string | null;
      qualification_notes: string | null;
      assigned_to: string | null;
      gdpr_consent: boolean | null;
      consent_at: Date | null;
      consent_ip: string | null;
      created_at: Date;
      updated_at: Date | null;
      qualified_date: Date | null;
      converted_date: Date | null;
      next_action_date: Date | null;
      opportunity_id: string | null;
      metadata: unknown;
      // Country data
      country_name_en: string | null;
      flag_emoji: string | null;
      country_gdpr: boolean | null;
      // Assigned employee data
      emp_id: string | null;
      emp_first_name: string | null;
      emp_last_name: string | null;
      emp_email: string | null;
      // Navigation data (computed in SQL)
      prev_id: string | null;
      next_id: string | null;
      total_count: bigint;
      current_position: bigint;
    }>
  >`
    WITH target AS (
      SELECT id, created_at FROM crm_leads WHERE id = ${id}::uuid AND deleted_at IS NULL
    ),
    nav AS (
      SELECT
        (SELECT id FROM crm_leads WHERE deleted_at IS NULL AND created_at > (SELECT created_at FROM target) ORDER BY created_at ASC LIMIT 1) as prev_id,
        (SELECT id FROM crm_leads WHERE deleted_at IS NULL AND created_at < (SELECT created_at FROM target) ORDER BY created_at DESC LIMIT 1) as next_id,
        (SELECT COUNT(*) FROM crm_leads WHERE deleted_at IS NULL) as total_count,
        (SELECT COUNT(*) FROM crm_leads WHERE deleted_at IS NULL AND created_at >= (SELECT created_at FROM target)) as current_position
    )
    SELECT
      l.*,
      c.country_name_en, c.flag_emoji, c.country_gdpr,
      e.id as emp_id, e.first_name as emp_first_name, e.last_name as emp_last_name, e.email as emp_email,
      n.prev_id, n.next_id, n.total_count, n.current_position
    FROM crm_leads l
    LEFT JOIN crm_countries c ON l.country_code = c.country_code
    LEFT JOIN clt_members e ON l.assigned_to = e.id
    CROSS JOIN nav n
    WHERE l.id = ${id}::uuid AND l.deleted_at IS NULL
  `;

  if (!result || result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    lead: row,
    navigation: {
      prevId: row.prev_id,
      nextId: row.next_id,
      totalCount: Number(row.total_count),
      currentPosition: Number(row.current_position),
    },
  };
});

// Generate metadata for SEO (uses cached lead data)
export async function generateMetadata({
  params,
}: LeadPageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getLeadWithNavigation(id);

  if (!result) {
    return { title: "Lead Not Found" };
  }

  const { lead } = result;
  const name = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
  return {
    title: lead.company_name ? `${name} - ${lead.company_name}` : name,
  };
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { locale, id } = await params;

  // Run auth, lead+navigation, and owners ALL in parallel (single DB round-trip for lead+nav)
  const [session, leadResult, owners] = await Promise.all([
    getSession(),
    getLeadWithNavigation(id),
    getOwners(),
  ]);

  // Require authentication
  if (!session) {
    notFound();
  }

  if (!leadResult) {
    notFound();
  }

  const { lead: leadData, navigation } = leadResult;

  // Transform to Lead type (data comes from raw SQL query)
  const lead: Lead = {
    id: leadData.id,
    lead_code: leadData.lead_code,
    email: leadData.email,
    first_name: leadData.first_name ?? "",
    last_name: leadData.last_name ?? "",
    phone: leadData.phone,
    company_name: leadData.company_name,
    industry: leadData.industry,
    company_size: leadData.company_size ? Number(leadData.company_size) : null,
    fleet_size: leadData.fleet_size ? String(leadData.fleet_size) : null,
    current_software: leadData.current_software,
    website_url: leadData.website_url,
    linkedin_url: leadData.linkedin_url,
    country_code: leadData.country_code,
    country:
      leadData.country_name_en && leadData.country_code
        ? {
            country_code: leadData.country_code,
            country_name_en: leadData.country_name_en,
            flag_emoji: leadData.flag_emoji ?? "",
            country_gdpr: leadData.country_gdpr ?? undefined,
          }
        : null,
    city: leadData.city,
    status: leadData.status,
    lead_stage: leadData.lead_stage,
    priority: leadData.priority,
    fit_score: leadData.fit_score ? Number(leadData.fit_score) : null,
    engagement_score: leadData.engagement_score
      ? Number(leadData.engagement_score)
      : null,
    qualification_score: leadData.qualification_score
      ? Number(leadData.qualification_score)
      : null,
    scoring: leadData.scoring as Record<string, unknown> | null,
    source: leadData.source,
    source_id: leadData.source_id,
    utm_source: leadData.utm_source,
    utm_medium: leadData.utm_medium,
    utm_campaign: leadData.utm_campaign,
    message: leadData.message,
    qualification_notes: leadData.qualification_notes,
    assigned_to:
      leadData.emp_id && leadData.emp_first_name
        ? {
            id: leadData.emp_id,
            first_name: leadData.emp_first_name,
            last_name: leadData.emp_last_name,
            email: leadData.emp_email ?? undefined,
          }
        : null,
    assigned_to_id: leadData.assigned_to,
    gdpr_consent: leadData.gdpr_consent,
    consent_at: leadData.consent_at?.toISOString() ?? null,
    consent_ip: leadData.consent_ip,
    created_at: leadData.created_at.toISOString(),
    updated_at: leadData.updated_at?.toISOString() ?? null,
    qualified_date: leadData.qualified_date?.toISOString() ?? null,
    converted_date: leadData.converted_date?.toISOString() ?? null,
    next_action_date: leadData.next_action_date?.toISOString() ?? null,
    opportunity_id: leadData.opportunity_id,
    metadata: leadData.metadata as Record<string, unknown> | null,
  };

  return (
    <LeadDetailPage
      lead={lead}
      owners={owners.map((o) => ({ ...o, first_name: o.first_name ?? "" }))}
      locale={locale as "en" | "fr"}
      navigation={navigation}
    />
  );
}
