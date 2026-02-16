"use client";

import * as React from "react";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "../hooks/use-dashboard-data";
import { DateRangePicker } from "./date-range-picker";
import {
  TargetCard,
  TotalLeadsCard,
  ConversionRateCard,
  PipelineValueCard,
  AvgScoreCard,
  TimeToConvertCard,
  LeadBySourceCard,
  SalesPipelineCard,
  RecentTasksCard,
  LeadsOverTimeCard,
  TopSourcesCard,
} from "./widgets";

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[280px] rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function CrmDashboardPage() {
  const { t } = useTranslation("crm");
  const today = new Date();
  const [dateRange, setDateRange] = React.useState({
    from: startOfDay(subDays(today, 29)),
    to: endOfDay(today),
  });

  const { data, isLoading } = useDashboardData({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-row items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {t("dashboard.title")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t("dashboard.description")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {isLoading || !data ? (
        <DashboardSkeleton />
      ) : (
        <>
          {/* Row 1: 4 KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TargetCard
              conversionRate={data.conversion.rate}
              targetRate={30}
              qualifiedThisPeriod={data.conversion.qualified_this_period}
            />
            <TotalLeadsCard
              total={data.summary.total}
              trend={data.summary.total_trend}
            />
            <ConversionRateCard
              rate={data.conversion.rate}
              trend={data.conversion.trend}
              qualified={data.conversion.qualified_this_period}
            />
            <PipelineValueCard
              activeLeads={data.active_leads}
              byStatus={data.summary.by_status}
            />
          </div>

          {/* Row 2: 2 KPI cards */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <AvgScoreCard
              avgQualificationScore={data.quality.avg_qualification_score}
              avgFitScore={data.quality.avg_fit_score}
              avgEngagementScore={data.quality.avg_engagement_score}
            />
            <TimeToConvertCard
              avgDays={data.conversion.avg_days_to_qualification}
            />
          </div>

          {/* Row 3: 3 columns */}
          <div className="grid gap-4 xl:grid-cols-3">
            <LeadBySourceCard sources={data.charts.sources} />
            <SalesPipelineCard byStatus={data.summary.by_status} />
            <RecentTasksCard />
          </div>

          {/* Row 4: 2 columns */}
          <div className="grid gap-4 xl:grid-cols-2">
            <LeadsOverTimeCard timeSeries={data.charts.time_series} />
            <TopSourcesCard sources={data.charts.sources.slice(0, 5)} />
          </div>
        </>
      )}
    </div>
  );
}
