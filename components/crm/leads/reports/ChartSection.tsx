"use client";

/**
 * ChartSection - Charts for Reports page using Recharts
 * - Pie chart: Status distribution
 * - Line chart: Leads over time
 * - Bar chart: Sources distribution
 */

import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

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

interface ChartSectionProps {
  stats: LeadsStats;
  locale: "en" | "fr";
}

// Status colors
const STATUS_COLORS: Record<string, string> = {
  new: "#3B82F6", // blue
  working: "#F59E0B", // amber
  qualified: "#10B981", // emerald
  lost: "#6B7280", // gray
  converted: "#8B5CF6", // purple
  disqualified: "#EF4444", // red
};

export function ChartSection({ stats, locale }: ChartSectionProps) {
  const { t } = useTranslation("crm");

  // Prepare pie chart data
  const pieData = stats.charts.status_distribution.map((item) => ({
    name: t(`leads.status.${item.status}`, item.status),
    value: item.count,
    fill: STATUS_COLORS[item.status] || "#9CA3AF",
  }));

  // Prepare line chart data (format dates)
  const lineData = stats.charts.time_series.map((item) => ({
    week: new Date(item.week).toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-US",
      {
        month: "short",
        day: "numeric",
      }
    ),
    count: item.count,
  }));

  // Prepare bar chart data (top 5 sources)
  const barData = stats.charts.sources.slice(0, 5).map((item) => ({
    source:
      item.source === "website"
        ? t("reports.sources.website", "Website")
        : item.source === "referral"
          ? t("reports.sources.referral", "Referral")
          : item.source === "linkedin"
            ? t("reports.sources.linkedin", "LinkedIn")
            : item.source === "event"
              ? t("reports.sources.event", "Event")
              : item.source,
    count: item.count,
  }));

  return (
    <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Status Distribution - Pie Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
          {t("reports.charts.status_distribution", "Status Distribution")}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(locale),
                  t("reports.charts.leads", "Leads"),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          {pieData.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5 text-xs">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.fill }}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Leads Over Time - Line Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
          {t("reports.charts.leads_over_time", "Leads Over Time (12 weeks)")}
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11 }}
                className="text-gray-500"
              />
              <YAxis tick={{ fontSize: 11 }} className="text-gray-500" />
              <Tooltip
                formatter={(value: number) => [
                  value.toLocaleString(locale),
                  t("reports.charts.new_leads", "New Leads"),
                ]}
                labelStyle={{ color: "#374151" }}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#2563EB" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sources Distribution - Bar Chart */}
      {barData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 lg:col-span-2 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-medium text-gray-900 dark:text-white">
            {t("reports.charts.top_sources", "Top Sources")}
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-gray-200 dark:stroke-gray-700"
                />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="source"
                  tick={{ fontSize: 11 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value: number) => [
                    value.toLocaleString(locale),
                    t("reports.charts.leads", "Leads"),
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
