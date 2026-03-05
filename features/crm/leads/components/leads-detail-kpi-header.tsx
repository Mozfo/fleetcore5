"use client";

import { Activity, Clock, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardData } from "../../dashboard/hooks/use-dashboard-data";

export function LeadsDetailKpiHeader() {
  const { t } = useTranslation("crm");
  const { data, isLoading } = useDashboardData();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const totalLeads = data.summary.total;
  const totalTrend = data.summary.total_trend;
  const conversionRate = data.conversion.rate;
  const conversionTrend = data.conversion.trend;
  const activeLeads = data.active_leads;
  const avgDays = data.conversion.avg_days_to_qualification;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {/* Total Leads */}
      <Card>
        <CardHeader>
          <CardDescription>
            {t("leads_detail.kpi.total_leads", { defaultValue: "Total Leads" })}
          </CardDescription>
          <div className="flex flex-col gap-2">
            <h4 className="font-display text-2xl lg:text-3xl">
              {totalLeads.toLocaleString()}
            </h4>
            <div className="text-muted-foreground text-sm">
              <span
                className={totalTrend >= 0 ? "text-green-600" : "text-red-600"}
              >
                {totalTrend >= 0 ? "+" : ""}
                {totalTrend.toFixed(1)}%
              </span>{" "}
              {t("dashboard.from_previous")}
            </div>
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Users className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Conversion Rate */}
      <Card>
        <CardHeader>
          <CardDescription>
            {t("leads_detail.kpi.conversion_rate", {
              defaultValue: "Conversion Rate",
            })}
          </CardDescription>
          <div className="flex flex-col gap-2">
            <h4 className="font-display text-2xl lg:text-3xl">
              {conversionRate.toFixed(1)}%
            </h4>
            <div className="text-muted-foreground text-sm">
              <span
                className={
                  conversionTrend >= 0 ? "text-green-600" : "text-red-600"
                }
              >
                {conversionTrend >= 0 ? "+" : ""}
                {conversionTrend.toFixed(1)}%
              </span>{" "}
              {t("dashboard.from_previous")}
            </div>
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <TrendingUp className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Active Leads */}
      <Card>
        <CardHeader>
          <CardDescription>
            {t("leads_detail.kpi.active_leads", {
              defaultValue: "Active Leads",
            })}
          </CardDescription>
          <div className="flex flex-col gap-2">
            <h4 className="font-display text-2xl lg:text-3xl">
              {activeLeads.toLocaleString()}
            </h4>
            <div className="text-muted-foreground text-sm">
              {t("dashboard.active_in_pipeline")}
            </div>
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Activity className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
      </Card>

      {/* Avg. Qualification Time */}
      <Card>
        <CardHeader>
          <CardDescription>
            {t("leads_detail.kpi.avg_qualification_days", {
              defaultValue: "Avg. Qualification Time",
            })}
          </CardDescription>
          <div className="flex flex-col gap-2">
            <h4 className="font-display text-2xl lg:text-3xl">
              {avgDays.toFixed(0)} {t("dashboard.days")}
            </h4>
            <div className="text-muted-foreground text-sm">
              {t("dashboard.avg_to_qualification")}
            </div>
          </div>
          <CardAction>
            <div className="bg-muted flex size-12 items-center justify-center rounded-full border">
              <Clock className="size-5" />
            </div>
          </CardAction>
        </CardHeader>
      </Card>
    </div>
  );
}
