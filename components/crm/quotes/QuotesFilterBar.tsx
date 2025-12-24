/**
 * QuotesFilterBar - Filters and view toggle for quotes
 */

"use client";

import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ViewToggle, type ViewMode } from "../leads/ViewToggle";
import type { QuotesFilters } from "@/app/[locale]/(app)/crm/quotes/page";
import type { quote_status } from "@prisma/client";

const QUOTE_STATUSES: Array<{ value: quote_status | "all"; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "viewed", label: "Viewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
  { value: "converted", label: "Converted" },
];

interface QuotesFilterBarProps {
  filters: QuotesFilters;
  onFiltersChange: (filters: QuotesFilters) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function QuotesFilterBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
}: QuotesFilterBarProps) {
  const { t } = useTranslation("crm");

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({
      ...filters,
      status: e.target.value as quote_status | "all",
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      status: "all",
      search: undefined,
      min_value: undefined,
      max_value: undefined,
    });
  };

  const hasActiveFilters =
    filters.status !== "all" ||
    filters.search ||
    filters.min_value !== undefined ||
    filters.max_value !== undefined;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left side - Search and filters */}
      <div className="flex flex-1 items-center gap-2">
        {/* Search */}
        <div className="relative w-full max-w-xs">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={t("quotes.filters.search", "Search quotes...")}
            value={filters.search || ""}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter */}
        <Select
          value={filters.status}
          onChange={handleStatusChange}
          className="w-[150px]"
        >
          {QUOTE_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {t(`quotes.status.${status.value}`, status.label)}
            </option>
          ))}
        </Select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500"
          >
            <X className="mr-1 h-4 w-4" />
            {t("quotes.filters.reset", "Reset")}
          </Button>
        )}
      </div>

      {/* Right side - View toggle */}
      <ViewToggle value={viewMode} onChange={onViewModeChange} />
    </div>
  );
}
