/**
 * LeadsFilterBar - Salesforce Cosmos inline filter bar (40px)
 *
 * Always visible, compact. Inline FilterDropdown buttons.
 * No Sheet/Drawer. No Quick Filter toggle buttons.
 */

"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import type {
  FilterGroup,
  LogicOperator,
  FilterCondition,
} from "@/lib/config/filter-config";
import type { LeadStatus, LeadStage } from "@/types/crm";
import type { SavedView, SavedViewConfig } from "@/lib/types/views";
import type { ViewMode } from "./ViewToggle";

export interface LeadsFilters {
  status?: LeadStatus | "all";
  lead_stage?: LeadStage | "all";
  assigned_to?: string | "all" | "unassigned";
  country_code?: string | "all";
  min_score?: number;
  search?: string;
  has_booking?: boolean;
  wizard_completed?: boolean;
  payment_pending?: boolean;
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
  totalCount?: number;
  // Backward compat (Phase 2 cleanup)
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  isSheetOpen?: boolean;
  onSheetOpenChange?: (open: boolean) => void;
  advancedFilterGroup?: FilterGroup;
  advancedFiltersActive?: boolean;
  advancedConditionsCount?: number;
  onAdvancedSetLogic?: (logic: LogicOperator) => void;
  onAdvancedReset?: () => void;
  onAdvancedAddCondition?: (groupId?: string) => void;
  onAdvancedUpdateCondition?: (
    conditionId: string,
    updates: Partial<Omit<FilterCondition, "id">>
  ) => void;
  onAdvancedRemoveCondition?: (conditionId: string) => void;
  onAdvancedAddGroup?: (parentGroupId?: string) => void;
  onAdvancedUpdateGroupLogic?: (groupId: string, logic: LogicOperator) => void;
  onAdvancedRemoveGroup?: (groupId: string) => void;
  savedViews?: SavedView[];
  activeViewId?: string | null;
  onSelectView?: (id: string) => void;
  onSaveView?: (name: string, isDefault: boolean) => void;
  onDeleteView?: (id: string) => void;
  onSetDefaultView?: (id: string) => void;
  getCurrentConfig?: () => SavedViewConfig;
}

// Cosmos-style FilterSelect
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

export function LeadsFilterBar({
  filters,
  onFiltersChange,
  countries = [],
  owners = [],
  totalCount,
  onAdvancedReset,
}: LeadsFilterBarProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const { stages, getLabel } = useLeadStages();

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ ...filters, search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  // Active filters detection
  const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "search") return !!value;
    if (value === "all" || value === undefined) return false;
    if (typeof value === "boolean" && value === false) return false;
    return true;
  });

  const handleReset = () => {
    setSearchInput("");
    onFiltersChange({
      status: "all",
      lead_stage: "all",
      assigned_to: "all",
      country_code: "all",
      min_score: undefined,
      search: undefined,
      has_booking: undefined,
      wizard_completed: undefined,
      payment_pending: undefined,
    });
    onAdvancedReset?.();
  };

  return (
    <div className="border-fc-border-light flex h-10 items-center gap-3 border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <div className="relative">
        <Search className="text-fc-text-muted pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("leads.filters.search")}
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

      {/* Stage */}
      <FilterSelect
        value={filters.lead_stage || "all"}
        onChange={(val) => onFiltersChange({ ...filters, lead_stage: val })}
      >
        <option value="all">{t("leads.filters.all_stages")}</option>
        {stages
          .filter((stage) => stage.value !== "opportunity")
          .map((stage) => (
            <option key={stage.value} value={stage.value}>
              {getLabel(stage.value, locale)}
            </option>
          ))}
      </FilterSelect>

      {/* Owner */}
      <FilterSelect
        value={filters.assigned_to || "all"}
        onChange={(val) => onFiltersChange({ ...filters, assigned_to: val })}
      >
        <option value="all">{t("leads.filters.all_owners")}</option>
        <option value="unassigned">{t("leads.filters.unassigned")}</option>
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.first_name} {owner.last_name}
          </option>
        ))}
      </FilterSelect>

      {/* Country */}
      <FilterSelect
        value={filters.country_code || "all"}
        onChange={(val) => onFiltersChange({ ...filters, country_code: val })}
      >
        <option value="all">{t("leads.filters.all_countries")}</option>
        {countries.map((country) => (
          <option key={country.country_code} value={country.country_code}>
            {country.flag_emoji} {country.country_name_en}
          </option>
        ))}
      </FilterSelect>

      {/* Score */}
      <FilterSelect
        value={
          filters.min_score === undefined ? "any" : String(filters.min_score)
        }
        onChange={(val) =>
          onFiltersChange({
            ...filters,
            min_score: val === "any" ? undefined : parseInt(val),
          })
        }
      >
        <option value="any">{t("leads.filters.min_score")}</option>
        <option value="40">40+</option>
        <option value="70">70+</option>
        <option value="90">90+</option>
      </FilterSelect>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="text-fc-text-muted hover:text-fc-text-primary text-xs transition-colors"
        >
          <X className="mr-0.5 inline h-3 w-3" />
          {t("leads.filters.reset")}
        </button>
      )}

      {/* Lead count */}
      {totalCount !== undefined && (
        <div className="text-fc-text-muted ml-auto text-sm font-medium dark:text-gray-400">
          {totalCount} leads
        </div>
      )}
    </div>
  );
}
