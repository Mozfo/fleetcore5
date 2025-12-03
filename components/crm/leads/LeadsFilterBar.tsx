/**
 * LeadsFilterBar - Barre de filtres avec debounce et visual feedback
 * Affiche: search, status, stage, owner, country, min_score
 * Active state: badge avec compteur + reset button
 *
 * Uses dynamic lead stages from crm_settings via useLeadStages hook.
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import { AdvancedFilters } from "./AdvancedFilters";
import { SavedViews } from "./SavedViews";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import type {
  FilterGroup,
  LogicOperator,
  FilterCondition,
} from "@/lib/config/filter-config";
import type { LeadStatus, LeadStage } from "@/types/crm";
import type { SavedView, SavedViewConfig } from "@/lib/types/views";

export interface LeadsFilters {
  status?: LeadStatus | "all";
  lead_stage?: LeadStage | "all";
  assigned_to?: string | "all" | "unassigned";
  country_code?: string | "all";
  min_score?: number;
  search?: string;
}

interface LeadsFilterBarProps {
  filters: LeadsFilters;
  onFiltersChange: (filters: LeadsFilters) => void;
  countries?: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  // Advanced filters props (E2-A)
  advancedFilterGroup: FilterGroup;
  advancedFiltersActive: boolean;
  advancedConditionsCount: number;
  onAdvancedSetLogic: (logic: LogicOperator) => void;
  onAdvancedReset: () => void;
  onAdvancedAddCondition: (groupId?: string) => void;
  onAdvancedUpdateCondition: (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => void;
  onAdvancedRemoveCondition: (conditionId: string) => void;
  onAdvancedAddGroup: (parentGroupId?: string) => void;
  onAdvancedUpdateGroupLogic: (groupId: string, logic: LogicOperator) => void;
  onAdvancedRemoveGroup: (groupId: string) => void;
  // Saved Views props (E2-B)
  savedViews: SavedView[];
  activeViewId: string | null;
  onSelectView: (id: string) => void;
  onSaveView: (name: string, isDefault: boolean) => void;
  onDeleteView: (id: string) => void;
  onSetDefaultView: (id: string) => void;
  getCurrentConfig: () => SavedViewConfig;
}

export function LeadsFilterBar({
  filters,
  onFiltersChange,
  countries = [],
  owners = [],
  viewMode,
  onViewModeChange,
  // Advanced filters (E2-A)
  advancedFilterGroup,
  advancedFiltersActive,
  advancedConditionsCount,
  onAdvancedSetLogic,
  onAdvancedReset,
  onAdvancedAddCondition,
  onAdvancedUpdateCondition,
  onAdvancedRemoveCondition,
  onAdvancedAddGroup,
  onAdvancedUpdateGroupLogic,
  onAdvancedRemoveGroup,
  // Saved Views (E2-B)
  savedViews,
  activeViewId,
  onSelectView,
  onSaveView,
  onDeleteView,
  onSetDefaultView,
  getCurrentConfig,
}: LeadsFilterBarProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Load stages dynamically from crm_settings
  const { stages, getLabel } = useLeadStages();

  // Load statuses dynamically from crm_settings
  const { statuses: leadStatuses, getLabel: getStatusLabel } =
    useLeadStatuses();

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Count active filters (exclude search and "all" values)
  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === "search") return false;
    if (value === "all" || value === undefined) return false;
    return true;
  }).length;

  const handleReset = () => {
    setSearchInput("");
    onFiltersChange({
      status: "all",
      lead_stage: "all",
      assigned_to: "all",
      country_code: "all",
      min_score: undefined,
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
            placeholder={t("leads.filters.search")}
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
                {t("leads.filters.active_filters", {
                  count: activeFiltersCount,
                })}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8 text-xs"
              >
                {t("leads.filters.reset")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Views (E2-B) */}
        <SavedViews
          views={savedViews}
          activeViewId={activeViewId}
          onSelectView={onSelectView}
          onSaveView={onSaveView}
          onDeleteView={onDeleteView}
          onSetDefault={onSetDefaultView}
          getCurrentConfig={getCurrentConfig}
          advancedConditionsCount={advancedConditionsCount}
        />

        {/* Advanced Filters (E2-A) */}
        <AdvancedFilters
          filterGroup={advancedFilterGroup}
          isActive={advancedFiltersActive}
          conditionsCount={advancedConditionsCount}
          onSetLogic={onAdvancedSetLogic}
          onReset={onAdvancedReset}
          onAddCondition={onAdvancedAddCondition}
          onUpdateCondition={onAdvancedUpdateCondition}
          onRemoveCondition={onAdvancedRemoveCondition}
          onAddGroup={onAdvancedAddGroup}
          onUpdateGroupLogic={onAdvancedUpdateGroupLogic}
          onRemoveGroup={onAdvancedRemoveGroup}
          countries={countries}
        />

        {/* View Toggle (Kanban/Table) */}
        <div className="ml-auto">
          <ViewToggle value={viewMode} onChange={onViewModeChange} />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${viewMode === "kanban" ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}
      >
        {/* Status Filter - Hidden in Kanban (columns ARE statuses) */}
        {viewMode === "table" && (
          <Select
            value={filters.status || "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value,
              })
            }
            className={
              filters.status && filters.status !== "all"
                ? "border-blue-500 dark:border-blue-400"
                : ""
            }
          >
            <option value="all">{t("leads.filters.all_status")}</option>
            {leadStatuses
              .filter((status) => !status.is_terminal) // Only show non-terminal statuses in filter
              .map((status) => (
                <option key={status.value} value={status.value}>
                  {getStatusLabel(status.value, locale)}
                </option>
              ))}
          </Select>
        )}

        {/* Lead Stage Filter - Dynamic from crm_settings */}
        <Select
          value={filters.lead_stage || "all"}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              lead_stage: e.target.value,
            })
          }
          className={
            filters.lead_stage && filters.lead_stage !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">{t("leads.filters.all_stages")}</option>
          {stages
            .filter((stage) => stage.value !== "opportunity") // Exclude opportunity (handled separately)
            .map((stage) => (
              <option key={stage.value} value={stage.value}>
                {getLabel(stage.value, locale)}
              </option>
            ))}
        </Select>

        {/* Assigned To Filter */}
        <Select
          value={filters.assigned_to || "all"}
          onChange={(e) =>
            onFiltersChange({ ...filters, assigned_to: e.target.value })
          }
          className={
            filters.assigned_to && filters.assigned_to !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">{t("leads.filters.all_owners")}</option>
          <option value="unassigned">{t("leads.filters.unassigned")}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.first_name} {owner.last_name}
            </option>
          ))}
        </Select>

        {/* Country Filter */}
        <Select
          value={filters.country_code || "all"}
          onChange={(e) =>
            onFiltersChange({ ...filters, country_code: e.target.value })
          }
          className={
            filters.country_code && filters.country_code !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">{t("leads.filters.all_countries")}</option>
          {countries.map((country) => (
            <option key={country.country_code} value={country.country_code}>
              {country.flag_emoji} {country.country_name_en}
            </option>
          ))}
        </Select>

        {/* Min Score Filter */}
        <Input
          type="number"
          min="0"
          max="100"
          placeholder={t("leads.filters.min_score")}
          value={filters.min_score || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              min_score: e.target.value ? parseInt(e.target.value) : undefined,
            })
          }
          className={
            filters.min_score ? "border-blue-500 dark:border-blue-400" : ""
          }
        />
      </div>
    </motion.div>
  );
}
