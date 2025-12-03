"use client";

import { useMemo, useState, useCallback } from "react";
import { Responsive, WidthProvider, type Layout } from "react-grid-layout";
import { useTranslation } from "react-i18next";
import useSWR from "swr";
import {
  Settings,
  RotateCcw,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  Activity,
  ArrowRight,
  Loader2,
  AlertCircle,
  AlertTriangle,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useHasPermission } from "@/lib/hooks/useHasPermission";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

// API fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Types for stats API response
interface LeadStats {
  success: boolean;
  data: {
    summary: {
      total: number;
      total_trend: number;
      by_status: Record<string, number>;
      by_stage: Record<string, number>;
      cold_leads: number;
    };
    conversion: {
      rate: number;
      trend: number;
      avg_days_to_qualification: number;
      qualified_this_period: number;
      converted_this_period: number;
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
    my_leads: {
      total: number;
      active: number;
    };
    // RÈGLE MÉTIER: Active leads = all leads EXCEPT lost/disqualified/converted
    active_leads: number;
  };
}

// Color palette (consistent across dashboard)
const COLORS = {
  new: "#3b82f6", // blue
  contacted: "#8b5cf6", // purple
  qualified: "#10b981", // emerald
  proposal: "#f59e0b", // amber
  negotiation: "#f97316", // orange
  converted: "#22c55e", // green
  lost: "#ef4444", // red
  disqualified: "#6b7280", // gray
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  converted: "Converted",
  lost: "Lost",
  disqualified: "Disqualified",
};

// =============================================================================
// KPI CARD COMPONENT (Tremor-inspired design)
// =============================================================================
function KPICard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconColor,
  isLoading,
  href,
}: {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  iconColor: string;
  isLoading?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={cn(
        "flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900",
        href &&
          "cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconColor
          )}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        {change !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium",
              change >= 0
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(change)}%
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4 flex-1">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {title}
            </p>
            {changeLabel && (
              <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                {changeLabel}
              </p>
            )}
          </>
        )}
      </div>

      {/* Clickable indicator - subtle cursor change only */}
      {href && <div className="mt-3 h-1" />}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// =============================================================================
// STATUS DISTRIBUTION CHART (Horizontal Bar)
// =============================================================================
function StatusChart({
  data,
  isLoading,
}: {
  data: Array<{ status: string; count: number }>;
  isLoading?: boolean;
}) {
  const { t } = useTranslation("common");

  // Sort by count descending and take top 6
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)
      .map((d) => ({
        ...d,
        label: STATUS_LABELS[d.status] || d.status,
        fill: COLORS[d.status as keyof typeof COLORS] || "#6b7280",
      }));
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {t("widgets.crm_leads_by_status")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Pipeline distribution
          </p>
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {total} total
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">No data available</p>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sortedData}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="label"
                axisLine={false}
                tickLine={false}
                width={80}
                tick={{ fontSize: 12, fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#9ca3af" }}
                formatter={(value: number) => [value, "Leads"]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {sortedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SOURCES DONUT CHART
// =============================================================================
function SourcesChart({
  data,
  isLoading,
}: {
  data: Array<{ source: string; count: number }>;
  isLoading?: boolean;
}) {
  const { t } = useTranslation("common");

  const chartData = useMemo(() => {
    const SOURCE_COLORS = [
      "#3b82f6",
      "#8b5cf6",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#ec4899",
      "#14b8a6",
      "#f97316",
    ];
    return data.slice(0, 5).map((d, i) => ({
      name: d.source.charAt(0).toUpperCase() + d.source.slice(1),
      value: d.count,
      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {t("widgets.crm_top_sources")}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Lead acquisition channels
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">No data available</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center gap-4">
          {/* Donut Chart */}
          <div className="relative h-32 w-32 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [value, "Leads"]}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {total}
              </span>
              <span className="text-[10px] text-gray-500">total</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-1 flex-col gap-2">
            {chartData.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-gray-600 dark:text-gray-400">
                    {item.name}
                  </span>
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LEADS TREND AREA CHART
// =============================================================================
function TrendChart({
  data,
  isLoading,
}: {
  data: Array<{ week: string; count: number }>;
  isLoading?: boolean;
}) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      week: new Date(d.week).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      leads: d.count,
    }));
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Leads Trend
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Last 12 weeks
          </p>
        </div>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
          {total} leads
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-gray-400">
          <div className="text-center">
            <Activity className="mx-auto h-8 w-8" />
            <p className="mt-2 text-sm">No data available</p>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                tickMargin={8}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#fff", fontWeight: 600 }}
                itemStyle={{ color: "#9ca3af" }}
              />
              <Area
                type="monotone"
                dataKey="leads"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#leadGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// QUALITY SCORES WIDGET
// =============================================================================
function QualityScores({
  data,
  isLoading,
}: {
  data: {
    avg_fit_score: number;
    avg_engagement_score: number;
    avg_qualification_score: number;
  };
  isLoading?: boolean;
}) {
  const scores = [
    { label: "Fit Score", value: data.avg_fit_score, color: "bg-blue-500" },
    {
      label: "Engagement",
      value: data.avg_engagement_score,
      color: "bg-purple-500",
    },
    {
      label: "Qualification",
      value: data.avg_qualification_score,
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Lead Quality
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Average scores across all leads
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-4">
          {scores.map((score, i) => (
            <div key={i}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {score.label}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {score.value.toFixed(1)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    score.color
                  )}
                  style={{ width: `${Math.min(score.value * 10, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// QUICK ACTIONS WIDGET
// =============================================================================
function QuickActionsCard() {
  const { t } = useTranslation("common");

  const actions = [
    {
      icon: Users,
      label: t("widgets.quick_action_new_lead"),
      href: "/en/crm/leads?action=new",
      color: "bg-blue-500",
    },
    {
      icon: BarChart3,
      label: t("widgets.quick_action_reports"),
      href: "/en/crm/leads/reports",
      color: "bg-purple-500",
    },
    {
      icon: Activity,
      label: t("widgets.quick_action_pipeline"),
      href: "/en/crm/leads",
      color: "bg-emerald-500",
    },
  ];

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
        {t("widgets.quick_actions")}
      </h3>
      <div className="flex flex-1 flex-col gap-2">
        {actions.map((action, idx) => (
          <Link
            key={idx}
            href={action.href}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-950/50"
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg text-white",
                action.color
              )}
            >
              <action.icon className="h-4 w-4" />
            </div>
            {action.label}
            <ArrowRight className="ml-auto h-4 w-4 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN DASHBOARD GRID
// =============================================================================
export function DashboardGrid() {
  const { t } = useTranslation("common");
  const [isEditing, setIsEditing] = useState(false);
  const { orgRole } = useHasPermission();

  // Determine if user is a commercial (sees only their leads)
  // Commercial = org:adm_commercial role
  // Admin/Manager/Support = sees all leads
  const isCommercial = orgRole === "org:adm_commercial";

  // Fetch real data from stats API
  const {
    data: statsData,
    error,
    isLoading,
  } = useSWR<LeadStats>("/api/v1/crm/leads/stats", fetcher, {
    refreshInterval: 60000, // Refresh every minute
    revalidateOnFocus: false,
  });

  const stats = statsData?.data;

  // Default layout - 5 KPI cards on first row, "My Leads" prominent
  const defaultLayouts = {
    lg: [
      { i: "my_leads", x: 0, y: 0, w: 3, h: 2 }, // My Leads first (personal)
      { i: "leads_total", x: 3, y: 0, w: 2, h: 2 },
      { i: "conversion", x: 5, y: 0, w: 2, h: 2 },
      { i: "qualified", x: 7, y: 0, w: 3, h: 2 },
      { i: "avg_time", x: 10, y: 0, w: 2, h: 2 },
      { i: "trend_chart", x: 0, y: 2, w: 8, h: 3 },
      { i: "quick_actions", x: 8, y: 2, w: 4, h: 3 },
      { i: "status_chart", x: 0, y: 5, w: 6, h: 3 },
      { i: "sources_chart", x: 6, y: 5, w: 3, h: 3 },
      { i: "quality_scores", x: 9, y: 5, w: 3, h: 3 },
    ],
    md: [
      { i: "my_leads", x: 0, y: 0, w: 5, h: 2 },
      { i: "leads_total", x: 5, y: 0, w: 5, h: 2 },
      { i: "conversion", x: 0, y: 2, w: 5, h: 2 },
      { i: "qualified", x: 5, y: 2, w: 5, h: 2 },
      { i: "avg_time", x: 0, y: 4, w: 10, h: 2 },
      { i: "trend_chart", x: 0, y: 6, w: 10, h: 3 },
      { i: "quick_actions", x: 0, y: 9, w: 5, h: 3 },
      { i: "status_chart", x: 5, y: 9, w: 5, h: 3 },
      { i: "sources_chart", x: 0, y: 12, w: 5, h: 3 },
      { i: "quality_scores", x: 5, y: 12, w: 5, h: 3 },
    ],
    sm: [
      { i: "my_leads", x: 0, y: 0, w: 6, h: 2 },
      { i: "leads_total", x: 0, y: 2, w: 3, h: 2 },
      { i: "conversion", x: 3, y: 2, w: 3, h: 2 },
      { i: "qualified", x: 0, y: 4, w: 3, h: 2 },
      { i: "avg_time", x: 3, y: 4, w: 3, h: 2 },
      { i: "trend_chart", x: 0, y: 6, w: 6, h: 3 },
      { i: "quick_actions", x: 0, y: 9, w: 6, h: 3 },
      { i: "status_chart", x: 0, y: 12, w: 6, h: 3 },
      { i: "sources_chart", x: 0, y: 15, w: 6, h: 3 },
      { i: "quality_scores", x: 0, y: 18, w: 6, h: 3 },
    ],
  };

  const [layouts, setLayouts] = useState(defaultLayouts);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
      if (isEditing) {
        setLayouts(allLayouts as typeof defaultLayouts);
      }
    },
    [isEditing]
  );

  // Memoize children - MUST be before any conditional returns (React hooks rules)
  const gridChildren = useMemo(
    () => [
      <div key="my_leads">
        <KPICard
          title={
            isCommercial
              ? t("widgets.crm_my_leads")
              : t("widgets.crm_all_active_leads")
          }
          // RÈGLE MÉTIER: Admin/Manager voit les leads actifs (exclut lost/disqualified/converted)
          value={
            isCommercial
              ? (stats?.my_leads?.active ?? 0)
              : (stats?.active_leads ?? 0)
          }
          changeLabel={
            isCommercial
              ? `${stats?.my_leads?.total ?? 0} ${t("widgets.total_assigned")}`
              : t("widgets.all_leads_in_pipeline")
          }
          icon={isCommercial ? UserCheck : UsersRound}
          iconColor={isCommercial ? "bg-indigo-500" : "bg-blue-600"}
          isLoading={isLoading}
          href={isCommercial ? "/en/crm/leads?assigned=me" : "/en/crm/leads"}
        />
      </div>,
      <div key="leads_total">
        <KPICard
          title={t("widgets.crm_leads_total")}
          value={stats?.summary.total ?? "-"}
          change={stats?.summary.total_trend}
          changeLabel="vs previous period"
          icon={Users}
          iconColor="bg-blue-500"
          isLoading={isLoading}
          href="/en/crm/leads"
        />
      </div>,
      <div key="conversion">
        <KPICard
          title={t("widgets.crm_conversion_rate")}
          value={stats ? `${stats.conversion.rate}%` : "-"}
          change={stats?.conversion.trend}
          changeLabel="vs previous period"
          icon={Target}
          iconColor="bg-emerald-500"
          isLoading={isLoading}
          href="/en/crm/leads/reports"
        />
      </div>,
      <div key="qualified">
        {(() => {
          // RÈGLE MÉTIER: Alerte si leads qualifiés en retard (anciens non convertis)
          const totalQualified = stats?.summary.by_status.qualified ?? 0;
          const qualifiedThisPeriod =
            stats?.conversion.qualified_this_period ?? 0;
          const staleQualified = totalQualified - qualifiedThisPeriod;
          const hasStaleLeads = staleQualified > 0;

          return (
            <KPICard
              title={t("widgets.crm_qualified_leads")}
              value={totalQualified}
              icon={hasStaleLeads ? AlertTriangle : TrendingUp}
              iconColor={hasStaleLeads ? "bg-amber-500" : "bg-emerald-500"}
              isLoading={isLoading}
              changeLabel={
                hasStaleLeads
                  ? `${staleQualified} ${t("widgets.stale")} · ${qualifiedThisPeriod} ${t("widgets.recent")}`
                  : `+${qualifiedThisPeriod} ${t("widgets.this_period")}`
              }
              href="/en/crm/leads?status=qualified"
            />
          );
        })()}
      </div>,
      <div key="avg_time">
        <KPICard
          title={t("widgets.crm_avg_conversion_time")}
          value={
            stats ? `${stats.conversion.avg_days_to_qualification} days` : "-"
          }
          icon={Clock}
          iconColor="bg-orange-500"
          isLoading={isLoading}
          changeLabel="to qualification"
          href="/en/crm/leads/reports"
        />
      </div>,
      <div key="trend_chart">
        <TrendChart
          data={stats?.charts.time_series ?? []}
          isLoading={isLoading}
        />
      </div>,
      <div key="quick_actions">
        <QuickActionsCard />
      </div>,
      <div key="status_chart">
        <StatusChart
          data={stats?.charts.status_distribution ?? []}
          isLoading={isLoading}
        />
      </div>,
      <div key="sources_chart">
        <SourcesChart
          data={stats?.charts.sources ?? []}
          isLoading={isLoading}
        />
      </div>,
      <div key="quality_scores">
        <QualityScores
          data={
            stats?.quality ?? {
              avg_fit_score: 0,
              avg_engagement_score: 0,
              avg_qualification_score: 0,
            }
          }
          isLoading={isLoading}
        />
      </div>,
    ],
    [t, stats, isLoading, isCommercial]
  );

  // Show error state if fetch failed (after all hooks)
  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950/20">
        <AlertCircle className="mb-4 h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
          Failed to load dashboard
        </h3>
        <p className="mt-1 text-sm text-red-600 dark:text-red-500">
          Please try refreshing the page
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={() => setIsEditing(!isEditing)}
        >
          <Settings className="mr-2 h-4 w-4" />
          {isEditing ? "Done" : t("dashboard_page.customize")}
        </Button>
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLayouts(defaultLayouts)}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("dashboard_page.reset_layout")}
          </Button>
        )}
      </div>

      {/* Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={80}
        isDraggable={isEditing}
        isResizable={isEditing}
        onLayoutChange={handleLayoutChange}
        margin={[16, 16]}
        containerPadding={[0, 0]}
      >
        {gridChildren}
      </ResponsiveGridLayout>
    </div>
  );
}
