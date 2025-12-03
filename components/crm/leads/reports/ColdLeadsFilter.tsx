"use client";

/**
 * ColdLeadsFilter - Filter for cold/inactive leads
 * Combined filter: status=lost/disqualified OR inactive > X months
 */

import { useTranslation } from "react-i18next";
import { Snowflake, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColdLeadsFilterState {
  enabled: boolean;
  inactiveMonths: number;
  includeLost: boolean;
}

interface ColdLeadsFilterProps {
  value: ColdLeadsFilterState;
  onChange: (value: ColdLeadsFilterState) => void;
  coldLeadsCount: number;
  locale: "en" | "fr";
}

const MONTHS_OPTIONS = [3, 6, 12, 24];

export function ColdLeadsFilter({
  value,
  onChange,
  coldLeadsCount,
  locale,
}: ColdLeadsFilterProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      {/* Cold Leads Toggle */}
      <button
        onClick={() => onChange({ ...value, enabled: !value.enabled })}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          value.enabled
            ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        )}
      >
        <Snowflake className="h-4 w-4" />
        {t("reports.cold_filter.label", "Cold Leads")}
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs",
            value.enabled
              ? "bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200"
              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          )}
        >
          {coldLeadsCount.toLocaleString(locale)}
        </span>
      </button>

      {/* Inactivity threshold dropdown */}
      {value.enabled && (
        <>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />

          <div className="relative">
            <select
              value={value.inactiveMonths}
              onChange={(e) =>
                onChange({ ...value, inactiveMonths: parseInt(e.target.value) })
              }
              className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pr-8 pl-3 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {MONTHS_OPTIONS.map((months) => (
                <option key={months} value={months}>
                  {t("reports.cold_filter.inactive_since", {
                    defaultValue: `Inactive > ${months} months`,
                    months,
                  })}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {/* Quick segment buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onChange({ ...value, includeLost: true })}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                value.includeLost
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {t("reports.cold_filter.all_cold", "All Cold")}
            </button>
            <button
              onClick={() => onChange({ ...value, includeLost: false })}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                !value.includeLost
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              )}
            >
              {t("reports.cold_filter.inactive_only", "Inactive Only")}
            </button>
          </div>
        </>
      )}

      {/* Description */}
      <p className="ml-auto text-xs text-gray-500 dark:text-gray-400">
        {value.enabled
          ? value.includeLost
            ? t(
                "reports.cold_filter.desc_combined",
                "Lost/disqualified or no activity"
              )
            : t("reports.cold_filter.desc_inactive", "No activity only")
          : t("reports.cold_filter.desc_all", "Showing all leads")}
      </p>
    </div>
  );
}
