"use client";

/**
 * StatsCards - KPIs dashboard for Reports page
 * Shows key metrics with trends (Salesforce best practice: 5-6 max KPIs)
 */

import { useTranslation } from "react-i18next";
import {
  Users,
  TrendingUp,
  TrendingDown,
  Snowflake,
  Target,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface StatsCardsProps {
  stats: LeadsStats;
  locale: "en" | "fr";
}

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: number;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor: string;
  bgColor: string;
}

function StatCard({
  title,
  value,
  trend,
  subtitle,
  icon,
  iconColor,
  bgColor,
}: StatCardProps) {
  const isPositiveTrend = trend !== undefined && trend > 0;
  const isNegativeTrend = trend !== undefined && trend < 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
            {title}
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {value}
            </p>
            {trend !== undefined && trend !== 0 && (
              <span
                className={cn(
                  "flex items-center text-xs font-medium",
                  isPositiveTrend && "text-emerald-600 dark:text-emerald-400",
                  isNegativeTrend && "text-red-600 dark:text-red-400"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                ) : (
                  <TrendingDown className="mr-0.5 h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            bgColor
          )}
        >
          <div className={iconColor}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export function StatsCards({ stats, locale }: StatsCardsProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Total Leads */}
      <StatCard
        title={t("reports.stats.total_leads", "Total Leads")}
        value={stats.summary.total.toLocaleString(locale)}
        trend={stats.summary.total_trend}
        subtitle={t("reports.stats.vs_previous", "vs previous period")}
        icon={<Users className="h-5 w-5" />}
        iconColor="text-blue-600 dark:text-blue-400"
        bgColor="bg-blue-50 dark:bg-blue-900/20"
      />

      {/* Conversion Rate */}
      <StatCard
        title={t("reports.stats.conversion_rate", "Conversion Rate")}
        value={`${stats.conversion.rate}%`}
        trend={stats.conversion.trend}
        subtitle={`${stats.conversion.qualified_this_period} ${t("reports.stats.qualified", "qualified")}`}
        icon={<Target className="h-5 w-5" />}
        iconColor="text-emerald-600 dark:text-emerald-400"
        bgColor="bg-emerald-50 dark:bg-emerald-900/20"
      />

      {/* Cold Leads */}
      <StatCard
        title={t("reports.stats.cold_leads", "Cold Leads")}
        value={stats.summary.cold_leads.toLocaleString(locale)}
        subtitle={`>${stats.summary.cold_threshold_months} ${t("reports.stats.months_inactive", "months inactive")}`}
        icon={<Snowflake className="h-5 w-5" />}
        iconColor="text-cyan-600 dark:text-cyan-400"
        bgColor="bg-cyan-50 dark:bg-cyan-900/20"
      />

      {/* Average Score */}
      <StatCard
        title={t("reports.stats.avg_score", "Avg. Score")}
        value={`${stats.quality.avg_qualification_score}/100`}
        subtitle={`${t("reports.stats.fit_abbr")}: ${stats.quality.avg_fit_score} | ${t("reports.stats.engagement_abbr")}: ${stats.quality.avg_engagement_score}`}
        icon={<TrendingUp className="h-5 w-5" />}
        iconColor="text-purple-600 dark:text-purple-400"
        bgColor="bg-purple-50 dark:bg-purple-900/20"
      />

      {/* Time to Convert */}
      <StatCard
        title={t("reports.stats.time_to_convert", "Time to Convert")}
        value={`${stats.conversion.avg_days_to_qualification} ${t("reports.stats.days", "days")}`}
        subtitle={t("reports.stats.avg_qualification", "avg. to qualification")}
        icon={<Clock className="h-5 w-5" />}
        iconColor="text-amber-600 dark:text-amber-400"
        bgColor="bg-amber-50 dark:bg-amber-900/20"
      />
    </div>
  );
}
