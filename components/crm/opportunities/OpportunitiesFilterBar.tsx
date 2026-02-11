/**
 * OpportunitiesFilterBar - Inline filter bar (40px, Cosmos style)
 *
 * Aligned with LeadsFilterBar: compact, inline, fc-* design tokens.
 * Filters: search, status, stage, assigned_to, min_value, rotting
 */

"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronDown, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { useOpportunityStatuses } from "@/lib/hooks/useOpportunityStatuses";
import type { OpportunitiesFilters } from "@/app/[locale]/(app)/crm/opportunities/page";

interface OpportunitiesFilterBarProps {
  filters: OpportunitiesFilters;
  onFilterChange: (filters: Partial<OpportunitiesFilters>) => void;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  rottingCount: number;
}

// Cosmos-style FilterSelect (same as Leads)
function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative inline-flex">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-fc-md border-fc-border-light text-fc-text-primary hover:border-fc-border-medium hover:bg-fc-bg-hover focus:border-fc-primary-500 focus:ring-fc-primary-500/30 h-7 cursor-pointer appearance-none border bg-white py-0 pr-7 pl-3 text-sm font-medium transition-all duration-150 focus:ring-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
      >
        {children}
      </select>
      <ChevronDown className="text-fc-text-muted pointer-events-none absolute top-1/2 right-1.5 h-3.5 w-3.5 -translate-y-1/2" />
    </div>
  );
}

export function OpportunitiesFilterBar({
  filters,
  onFilterChange,
  owners,
  rottingCount,
}: OpportunitiesFilterBarProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const { stages, getLabel } = useOpportunityStages();
  const { statuses, getLabel: getStatusLabel } = useOpportunityStatuses();

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search, onFilterChange]);

  // Active filters detection
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "search") return !!value;
    if (key === "status" && value === "open") return false;
    if (value === "all" || value === undefined) return false;
    if (typeof value === "boolean" && value === false) return false;
    return true;
  });

  const handleReset = () => {
    setSearchInput("");
    onFilterChange({
      stage: "all",
      status: "open",
      assigned_to: "all",
      min_value: undefined,
      max_value: undefined,
      is_rotting: false,
      search: undefined,
    });
  };

  return (
    <div className="border-fc-border-light flex h-10 items-center gap-3 border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <div className="relative">
        <Search className="text-fc-text-muted pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("opportunity.filters.search", "Search deals...")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="rounded-fc-md border-fc-border-light text-fc-text-primary placeholder:text-fc-text-muted hover:border-fc-border-medium focus:border-fc-primary-500 focus:ring-fc-primary-500/30 h-7 w-44 border bg-white pr-7 pl-7 text-sm transition-all duration-150 focus:ring-2 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            className="text-fc-text-muted hover:text-fc-text-primary absolute top-1/2 right-2 -translate-y-1/2"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="bg-fc-border-light h-5 w-px" />

      {/* Status */}
      <FilterSelect
        value={filters.status}
        onChange={(val) => onFilterChange({ status: val })}
      >
        <option value="all">
          {t("opportunity.filters.allStatus", "All Status")}
        </option>
        {statuses.map((status) => (
          <option key={status.value} value={status.value}>
            {getStatusLabel(status.value, locale)}
          </option>
        ))}
      </FilterSelect>

      {/* Stage */}
      <FilterSelect
        value={filters.stage}
        onChange={(val) => onFilterChange({ stage: val })}
      >
        <option value="all">
          {t("opportunity.filters.allStages", "All Stages")}
        </option>
        {stages.map((stage) => (
          <option key={stage.value} value={stage.value}>
            {getLabel(stage.value, locale)}
          </option>
        ))}
      </FilterSelect>

      {/* Owner */}
      <FilterSelect
        value={filters.assigned_to}
        onChange={(val) => onFilterChange({ assigned_to: val })}
      >
        <option value="all">
          {t("opportunity.filters.allOwners", "All Owners")}
        </option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.first_name} {owner.last_name}
          </option>
        ))}
      </FilterSelect>

      {/* Min Value */}
      <FilterSelect
        value={
          filters.min_value === undefined ? "any" : String(filters.min_value)
        }
        onChange={(val) =>
          onFilterChange({
            min_value: val === "any" ? undefined : parseInt(val),
          })
        }
      >
        <option value="any">
          {t("opportunity.filters.minValue", "Min Value")}
        </option>
        <option value="10000">€10K+</option>
        <option value="50000">€50K+</option>
        <option value="100000">€100K+</option>
        <option value="500000">€500K+</option>
      </FilterSelect>

      {/* Rotting Quick Filter */}
      {rottingCount > 0 && (
        <button
          onClick={() => onFilterChange({ is_rotting: !filters.is_rotting })}
          className={cn(
            "rounded-fc-md flex h-7 items-center gap-1.5 px-2.5 text-xs font-medium transition-all duration-150",
            filters.is_rotting
              ? "bg-fc-danger-500 text-white"
              : "border-fc-border-light text-fc-text-muted hover:border-fc-border-medium hover:bg-fc-bg-hover border"
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {t("opportunity.filters.rotting", "Rotting")} ({rottingCount})
        </button>
      )}

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="text-fc-text-muted hover:text-fc-text-primary text-xs transition-colors"
        >
          <X className="mr-0.5 inline h-3 w-3" />
          {t("opportunity.filters.reset", "Reset")}
        </button>
      )}
    </div>
  );
}
