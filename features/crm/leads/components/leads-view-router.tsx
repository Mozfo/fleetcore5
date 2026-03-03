"use client";

import { Suspense, useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import PageContainer from "@/components/layout/page-container";
import { ViewToggle, type ViewMode } from "@/components/crm/leads/ViewToggle";

import { LeadsKanbanPage } from "./leads-kanban-page";
import { LeadsListPage } from "./leads-list-page";

const VIEW_MODE_STORAGE_KEY = "crm_leads_view";

// ── Inner component (needs Suspense for useSearchParams) ────────────

function LeadsViewRouterInner() {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [total, setTotal] = useState<number | null>(null);

  // View mode: URL param → localStorage fallback → default kanban
  const viewParam = searchParams.get("view");
  let viewMode: ViewMode = "kanban";
  if (viewParam === "table") {
    viewMode = "table";
  } else if (!viewParam) {
    try {
      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem(VIEW_MODE_STORAGE_KEY)
          : null;
      if (saved === "table") viewMode = "table";
    } catch {
      // localStorage not available
    }
  }

  // Manual view switch (toggle button) — uses replace (no history entry)
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      } catch {
        // localStorage not available
      }
      const params = new URLSearchParams(searchParams.toString());
      params.delete("status"); // Clear outcome filter on manual toggle
      if (mode === "table") {
        params.set("view", "table");
      } else {
        params.delete("view");
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  // Outcome click — navigates with view=table&status=xxx (creates history entry)
  const handleOutcomeClick = useCallback(
    (status: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "table");
      params.set("status", status);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

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
      <LeadsListPage onTotalChange={setTotal} />
    </PageContainer>
  );
}

// ── Exported wrapper with Suspense for useSearchParams ──────────────

export function LeadsViewRouter() {
  return (
    <Suspense>
      <LeadsViewRouterInner />
    </Suspense>
  );
}
