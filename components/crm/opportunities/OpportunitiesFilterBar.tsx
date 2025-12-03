/**
 * OpportunitiesFilterBar - Barre de filtres pour le pipeline
 * Filtres: search, status, stage, assigned_to, value range, rotting
 * ViewToggle pour basculer entre Kanban et Table (comme Leads)
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { ViewToggle, type ViewMode } from "../leads/ViewToggle";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { useOpportunityStatuses } from "@/lib/hooks/useOpportunityStatuses";
// Types used implicitly via hooks
import type { OpportunitiesFilters } from "@/app/[locale]/(app)/crm/opportunities/page";

interface OpportunitiesFilterBarProps {
  filters: OpportunitiesFilters;
  onFilterChange: (filters: Partial<OpportunitiesFilters>) => void;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  rottingCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function OpportunitiesFilterBar({
  filters,
  onFilterChange,
  owners,
  rottingCount,
  viewMode,
  onViewModeChange,
}: OpportunitiesFilterBarProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Load stages dynamically from crm_settings
  const { stages, getLabel } = useOpportunityStages();

  // Load statuses dynamically from crm_settings
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

  // Count active filters (exclude search, "all" values, and undefined)
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search") return false;
    if (value === "all" || value === undefined) return false;
    return true;
  }).length;

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
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Search + Active Filters Badge */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder={t("opportunity.filters.search", "Search deals...")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9 pl-9"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Rotting Deals Quick Filter */}
        {rottingCount > 0 && (
          <Button
            variant={filters.is_rotting ? "destructive" : "outline"}
            size="sm"
            onClick={() => onFilterChange({ is_rotting: !filters.is_rotting })}
            className="gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {t("opportunity.filters.rotting", "Rotting")} ({rottingCount})
          </Button>
        )}

        {/* Active Filters Badge + Reset */}
        <AnimatePresence>
          {activeFiltersCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-2"
            >
              <Badge variant="secondary" className="gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                {t("opportunity.filters.activeFilters", {
                  count: activeFiltersCount,
                  defaultValue: `${activeFiltersCount} filter(s)`,
                })}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs"
              >
                {t("opportunity.filters.reset", "Reset")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* View Toggle (Kanban/Table) - Same position as Leads */}
        <div className="ml-auto">
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Status Filter */}
        <Select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({
              status: e.target.value,
            })
          }
          className={
            filters.status !== "open"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">
            {t("opportunity.filters.allStatus", "All Status")}
          </option>
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>
              {getStatusLabel(status.value, locale)}
            </option>
          ))}
        </Select>

        {/* Stage Filter */}
        <Select
          value={filters.stage}
          onChange={(e) =>
            onFilterChange({
              stage: e.target.value,
            })
          }
          className={
            filters.stage !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">
            {t("opportunity.filters.allStages", "All Stages")}
          </option>
          {stages.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {getLabel(stage.value, locale)}
            </option>
          ))}
        </Select>

        {/* Assigned To Filter */}
        <Select
          value={filters.assigned_to}
          onChange={(e) => onFilterChange({ assigned_to: e.target.value })}
          className={
            filters.assigned_to !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">
            {t("opportunity.filters.allOwners", "All Owners")}
          </option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.first_name} {owner.last_name}
            </option>
          ))}
        </Select>

        {/* Min Value Filter */}
        <Input
          type="number"
          min="0"
          step="1000"
          placeholder={t("opportunity.filters.minValue", "Min Value")}
          value={filters.min_value ?? ""}
          onChange={(e) =>
            onFilterChange({
              min_value: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            })
          }
          className={
            filters.min_value !== undefined
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        />

        {/* Max Value Filter */}
        <Input
          type="number"
          min="0"
          step="1000"
          placeholder={t("opportunity.filters.maxValue", "Max Value")}
          value={filters.max_value ?? ""}
          onChange={(e) =>
            onFilterChange({
              max_value: e.target.value
                ? parseFloat(e.target.value)
                : undefined,
            })
          }
          className={
            filters.max_value !== undefined
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        />
      </div>
    </motion.div>
  );
}
