"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";

import PageContainer from "@/components/layout/page-container";
import { LeadsPageClient } from "@/components/crm/leads/LeadsPageClient";
import { ViewToggle, type ViewMode } from "@/components/crm/leads/ViewToggle";

import { LeadsListPage } from "./leads-list-page";

const VIEW_MODE_STORAGE_KEY = "crm_leads_view";

interface LeadsViewRouterProps {
  allLeads: Parameters<typeof LeadsPageClient>[0]["allLeads"];
  countries: Parameters<typeof LeadsPageClient>[0]["countries"];
  owners: Parameters<typeof LeadsPageClient>[0]["owners"];
  initialFilters: Parameters<typeof LeadsPageClient>[0]["initialFilters"];
}

export function LeadsViewRouter({
  allLeads,
  countries,
  owners,
  initialFilters,
}: LeadsViewRouterProps) {
  const { t } = useTranslation("crm");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Load viewMode from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "kanban" || saved === "table") {
        setViewMode(saved);
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage not available
    }
  }, []);

  if (viewMode === "kanban") {
    return (
      <LeadsPageClient
        allLeads={allLeads}
        countries={countries}
        owners={owners}
        initialFilters={initialFilters}
        onViewModeChange={handleViewModeChange}
      />
    );
  }

  return (
    <PageContainer
      pageTitle={t("leads.title")}
      pageDescription={t("leads.page_description", {
        defaultValue: "Manage your leads pipeline",
      })}
      pageHeaderAction={
        <ViewToggle value={viewMode} onChange={handleViewModeChange} />
      }
    >
      <LeadsListPage />
    </PageContainer>
  );
}
