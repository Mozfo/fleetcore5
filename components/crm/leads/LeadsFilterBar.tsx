/**
 * LeadsFilterBar - Barre de filtres avec debounce et visual feedback
 * Affiche: search, status, stage, owner, country, min_score
 * Active state: badge avec compteur + reset button
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
import type { LeadStatus, LeadStage } from "@/types/crm";

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
  viewMode?: "kanban" | "list";
}

export function LeadsFilterBar({
  filters,
  onFiltersChange,
  countries = [],
  owners = [],
  viewMode = "kanban",
}: LeadsFilterBarProps) {
  const { t } = useTranslation("crm");
  const [searchInput, setSearchInput] = useState(filters.search || "");

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
      className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
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
      </div>

      {/* Filter Dropdowns */}
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${viewMode === "kanban" ? "lg:grid-cols-4" : "lg:grid-cols-5"}`}
      >
        {/* Status Filter - Hidden in Kanban (columns ARE statuses) */}
        {viewMode === "list" && (
          <Select
            value={filters.status || "all"}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                status: e.target.value as LeadStatus | "all",
              })
            }
            className={
              filters.status && filters.status !== "all"
                ? "border-blue-500 dark:border-blue-400"
                : ""
            }
          >
            <option value="all">{t("leads.filters.all_status")}</option>
            <option value="new">{t("leads.columns.new")}</option>
            <option value="working">{t("leads.columns.working")}</option>
            <option value="qualified">{t("leads.columns.qualified")}</option>
            <option value="lost">{t("leads.columns.lost")}</option>
          </Select>
        )}

        {/* Lead Stage Filter */}
        <Select
          value={filters.lead_stage || "all"}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              lead_stage: e.target.value as LeadStage | "all",
            })
          }
          className={
            filters.lead_stage && filters.lead_stage !== "all"
              ? "border-blue-500 dark:border-blue-400"
              : ""
          }
        >
          <option value="all">{t("leads.filters.all_stages")}</option>
          <option value="top_of_funnel">
            {t("leads.card.stage.top_of_funnel")}
          </option>
          <option value="marketing_qualified">
            {t("leads.card.stage.marketing_qualified")}
          </option>
          <option value="sales_qualified">
            {t("leads.card.stage.sales_qualified")}
          </option>
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
