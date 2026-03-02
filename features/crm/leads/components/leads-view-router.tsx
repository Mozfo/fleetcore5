"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import PageContainer from "@/components/layout/page-container";
import { ViewToggle, type ViewMode } from "@/components/crm/leads/ViewToggle";

import { LeadsKanbanPage } from "./leads-kanban-page";
import { LeadsListPage } from "./leads-list-page";

const VIEW_MODE_STORAGE_KEY = "crm_leads_view";

export function LeadsViewRouter() {
  const { t } = useTranslation("crm");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [total, setTotal] = useState<number | null>(null);
  const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null);

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

  // Manual view switch (toggle button) — clears outcome filter
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setOutcomeFilter(null);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // localStorage not available
    }
  }, []);

  // Outcome click (Nurturing/Disqualified badge) — sets filter + switches to table
  const handleOutcomeClick = useCallback((status: string) => {
    setOutcomeFilter(status);
    setViewMode("table");
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, "table");
    } catch {
      // localStorage not available
    }
  }, []);

  if (viewMode === "kanban") {
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
        <LeadsKanbanPage onOutcomeClick={handleOutcomeClick} />
      </PageContainer>
    );
  }

  const pageTitle: ReactNode = (
    <>
      {t("leads.title")}
      {total !== null && (
        <span className="text-muted-foreground ml-2 text-base font-normal">
          ({total})
        </span>
      )}
    </>
  );

  return (
    <PageContainer
      pageTitle={pageTitle}
      pageDescription={t("leads.page_description", {
        defaultValue: "Manage your leads pipeline",
      })}
      pageHeaderAction={
        <ViewToggle value={viewMode} onChange={handleViewModeChange} />
      }
    >
      <LeadsListPage
        onTotalChange={setTotal}
        initialStatusFilter={outcomeFilter}
      />
    </PageContainer>
  );
}
