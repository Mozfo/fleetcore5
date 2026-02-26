"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import PageContainer from "@/components/layout/page-container";
import { ViewToggle, type ViewMode } from "@/components/crm/leads/ViewToggle";

import dynamic from "next/dynamic";

const LeadsListPage = dynamic(
  () => import("./leads-list-page").then((mod) => mod.LeadsListPage),
  { ssr: false }
);
const LeadsKanbanPage = dynamic(
  () => import("./leads-kanban-page").then((mod) => mod.LeadsKanbanPage),
  { ssr: false }
);

const VIEW_MODE_STORAGE_KEY = "crm_leads_view";

export function LeadsViewRouter() {
  const { t } = useTranslation("crm");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [total, setTotal] = useState<number | null>(null);

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
      <PageContainer
        pageTitle={t("leads.title")}
        pageDescription={t("leads.page_description", {
          defaultValue: "Manage your leads pipeline",
        })}
        pageHeaderAction={
          <ViewToggle value={viewMode} onChange={handleViewModeChange} />
        }
      >
        <LeadsKanbanPage />
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
      <LeadsListPage onTotalChange={setTotal} />
    </PageContainer>
  );
}
