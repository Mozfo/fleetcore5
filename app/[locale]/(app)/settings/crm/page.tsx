/**
 * CRM Settings Page - Configuration Center
 *
 * Server Component: fetches all settings from database
 * Tab navigation with 7 sections (Phase 1: Pipeline + Loss Reasons)
 *
 * URL: /[locale]/crm/settings
 *
 * @module app/[locale]/(app)/crm/settings
 */

import { Suspense, cache } from "react";
import { getSession } from "@/lib/auth/server";
import { db } from "@/lib/prisma";
import { CrmSettingsPageClient } from "@/components/crm/settings/CrmSettingsPageClient";
import { localizedRedirect } from "@/lib/navigation";
import type { CrmSettingsData } from "@/components/crm/settings/types";

interface CrmSettingsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

/**
 * Fetch all CRM settings from database
 * Cached for deduplication within request
 */
const fetchCrmSettings = cache(async (): Promise<CrmSettingsData> => {
  const [leadStages, opportunityStages, lossReasons] = await Promise.all([
    db.crm_settings.findFirst({
      where: {
        setting_key: "lead_stages",
        is_active: true,
        deleted_at: null,
      },
    }),
    db.crm_settings.findFirst({
      where: {
        setting_key: "opportunity_stages",
        is_active: true,
        deleted_at: null,
      },
    }),
    db.crm_settings.findFirst({
      where: {
        setting_key: "opportunity_loss_reasons",
        is_active: true,
        deleted_at: null,
      },
    }),
  ]);

  return {
    leadStages: leadStages
      ? {
          id: leadStages.id,
          setting_key: leadStages.setting_key,
          setting_value: leadStages.setting_value as Record<string, unknown>,
          version: leadStages.version,
          updated_at: leadStages.updated_at?.toISOString() ?? null,
        }
      : null,
    opportunityStages: opportunityStages
      ? {
          id: opportunityStages.id,
          setting_key: opportunityStages.setting_key,
          setting_value: opportunityStages.setting_value as Record<
            string,
            unknown
          >,
          version: opportunityStages.version,
          updated_at: opportunityStages.updated_at?.toISOString() ?? null,
        }
      : null,
    lossReasons: lossReasons
      ? {
          id: lossReasons.id,
          setting_key: lossReasons.setting_key,
          setting_value: lossReasons.setting_value as Record<string, unknown>,
          version: lossReasons.version,
          updated_at: lossReasons.updated_at?.toISOString() ?? null,
        }
      : null,
  };
});

export default async function CrmSettingsPage({
  params,
  searchParams,
}: CrmSettingsPageProps) {
  const session = await getSession();
  const { locale } = await params;
  const { tab } = await searchParams;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const settings = await fetchCrmSettings();
  const initialTab = tab || "pipeline";

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="space-y-6 p-6">
            <div className="bg-fc-neutral-100 h-12 w-64 animate-pulse rounded-lg dark:bg-gray-800" />
            <div className="bg-fc-neutral-100 h-10 w-full animate-pulse rounded-lg dark:bg-gray-800" />
            <div className="bg-fc-neutral-100 h-96 animate-pulse rounded-lg dark:bg-gray-800" />
          </div>
        }
      >
        <CrmSettingsPageClient settings={settings} initialTab={initialTab} />
      </Suspense>
    </div>
  );
}
