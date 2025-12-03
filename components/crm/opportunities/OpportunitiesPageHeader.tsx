/**
 * OpportunitiesPageHeader - Premium header with Stripe-style stats
 * Aligned with LeadsPageHeader for UX consistency
 */

"use client";

import { Plus, Download, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface Stats {
  total: number;
  totalValue: number;
  weightedValue: number;
  rottingCount: number;
  byStage: Record<string, { count: number; value: number }>;
}

interface OpportunitiesPageHeaderProps {
  stats: Stats;
  onNewOpportunity?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}

function formatCurrency(value: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

interface StatCardProps {
  value: string | number;
  label: string;
  trend?: number;
  accentColor?: "blue" | "green" | "purple" | "orange";
}

function StatCard({
  value,
  label,
  trend,
  accentColor = "blue",
}: StatCardProps) {
  const accentClasses = {
    blue: "border-l-blue-500",
    green: "border-l-emerald-500",
    purple: "border-l-purple-500",
    orange: "border-l-orange-500",
  };

  return (
    <div
      className={`flex flex-col rounded-lg border border-l-2 border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 ${accentClasses[accentColor]}`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 tabular-nums dark:text-white">
          {value}
        </span>
        {trend !== undefined && trend !== 0 && (
          <span
            className={`flex items-center text-xs font-medium ${
              trend > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            <TrendingUp
              className={`mr-0.5 h-3 w-3 ${trend < 0 ? "rotate-180" : ""}`}
            />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <span className="mt-0.5 text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}

export function OpportunitiesPageHeader({
  stats,
  onNewOpportunity,
  onExport,
  onSettings,
}: OpportunitiesPageHeaderProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="space-y-4">
      {/* Row 1: Title + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("opportunity.title", "Opportunities")}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {t(
              "opportunity.subtitle",
              "Track deals through your sales pipeline"
            )}
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {onSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettings}
              className="text-gray-500"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          {onExport && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="text-gray-500"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {onNewOpportunity && (
            <Button
              size="sm"
              onClick={onNewOpportunity}
              className="bg-blue-600 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] active:shadow-inner"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              {t("opportunity.actions.new_opportunity", "New Opportunity")}
            </Button>
          )}
        </div>
      </div>

      {/* Row 2: Stats Cards - Stripe style (same as Leads) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          value={stats.total}
          label={t("opportunity.stats.openDeals", "Open Deals")}
          accentColor="blue"
        />
        <StatCard
          value={formatCurrency(stats.totalValue)}
          label={t("opportunity.stats.pipelineValue", "Pipeline")}
          accentColor="green"
        />
        <StatCard
          value={formatCurrency(stats.weightedValue)}
          label={t("opportunity.stats.weightedValue", "Weighted")}
          accentColor="purple"
        />
        <StatCard
          value={stats.rottingCount}
          label={t("opportunity.stats.rottingDeals", "Rotting")}
          accentColor="orange"
        />
      </div>
    </div>
  );
}
