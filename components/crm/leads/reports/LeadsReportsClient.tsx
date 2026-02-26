"use client";

/**
 * LeadsReportsClient - Main client component for Reports page
 *
 * Manager's BI dashboard:
 * - Quick search for prospect contact info
 * - KPIs with trends and charts
 * - Cold leads extraction
 * - Export for external BI
 * - Server-side pagination
 */

import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { QuickSearch } from "./QuickSearch";
import { StatsCards } from "./StatsCards";
import { ReportsTable } from "./ReportsTable";
import { ExportButton } from "./ExportButton";
import dynamic from "next/dynamic";

const ChartSection = dynamic(
  () => import("./ChartSection").then((mod) => mod.ChartSection),
  { ssr: false }
);
import { ColdLeadsFilter, type ColdLeadsFilterState } from "./ColdLeadsFilter";
import { Loader2 } from "lucide-react";

interface LeadsReportsClientProps {
  locale: "en" | "fr";
}

// Stats response type from API
interface LeadsStats {
  summary: {
    total: number;
    total_trend: number;
    by_status: Record<string, number>;
    by_stage: Record<string, number>;
    cold_leads: number;
    cold_threshold_months: number;
  };
  conversion: {
    rate: number;
    rate_previous: number;
    trend: number;
    avg_days_to_qualification: number;
    qualified_this_period: number;
    qualified_previous_period: number;
    converted_this_period: number;
    converted_previous_period: number;
  };
  quality: {
    avg_fit_score: number;
    avg_engagement_score: number;
    avg_qualification_score: number;
  };
  charts: {
    time_series: Array<{ week: string; count: number }>;
    status_distribution: Array<{ status: string; count: number }>;
    sources: Array<{ source: string; count: number }>;
  };
  period: {
    start: string;
    end: string;
    previous_start: string;
    previous_end: string;
  };
}

export function LeadsReportsClient({ locale }: LeadsReportsClientProps) {
  const { t } = useTranslation("crm");

  // State
  const [stats, setStats] = useState<LeadsStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [coldFilter, setColdFilter] = useState<ColdLeadsFilterState>({
    enabled: false,
    inactiveMonths: 6,
    includeLost: true,
  });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);
    try {
      const params = new URLSearchParams({
        inactive_months: coldFilter.inactiveMonths.toString(),
      });

      const response = await fetch(`/api/v1/crm/leads/stats?${params}`);
      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // Silent fail - stats will show as null
    } finally {
      setIsLoadingStats(false);
    }
  }, [coldFilter.inactiveMonths]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t("reports.title", "Leads Reports")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t(
                "reports.description",
                "Analytics, search, and export for business intelligence"
              )}
            </p>
          </div>
          <ExportButton
            filters={
              coldFilter.enabled
                ? {
                    include_cold: true,
                    inactive_months: coldFilter.inactiveMonths,
                  }
                : {}
            }
            locale={locale}
          />
        </div>

        {/* Quick Search - Prominent position */}
        <div className="mt-4">
          <QuickSearch locale={locale} />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-6">
        {isLoadingStats ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : stats ? (
          <>
            {/* KPIs Stats Cards */}
            <StatsCards stats={stats} locale={locale} />

            {/* Charts Section */}
            <ChartSection stats={stats} locale={locale} />

            {/* Cold Leads Filter */}
            <div className="mb-4">
              <ColdLeadsFilter
                value={coldFilter}
                onChange={setColdFilter}
                coldLeadsCount={stats.summary.cold_leads}
                locale={locale}
              />
            </div>

            {/* Data Table with server pagination */}
            <ReportsTable coldFilter={coldFilter} locale={locale} />
          </>
        ) : (
          <div className="flex h-64 items-center justify-center text-gray-500">
            {t("reports.error_loading", "Failed to load statistics")}
          </div>
        )}
      </main>
    </div>
  );
}
