/**
 * QuotesFilterBar - Inline filter bar (40px, Cosmos style)
 *
 * Aligned with LeadsFilterBar / OpportunitiesFilterBar: compact, inline, fc-* design tokens.
 * Filters: search, status
 */

"use client";

import { useState, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuotesFilters } from "@/app/[locale]/(app)/crm/quotes/page";
import type { quote_status } from "@prisma/client";

const QUOTE_STATUSES: Array<{
  value: quote_status | "all";
  labelKey: string;
  fallback: string;
}> = [
  {
    value: "all",
    labelKey: "quotes.filters.allStatus",
    fallback: "All Status",
  },
  { value: "draft", labelKey: "quotes.status.draft", fallback: "Draft" },
  { value: "sent", labelKey: "quotes.status.sent", fallback: "Sent" },
  { value: "viewed", labelKey: "quotes.status.viewed", fallback: "Viewed" },
  {
    value: "accepted",
    labelKey: "quotes.status.accepted",
    fallback: "Accepted",
  },
  {
    value: "rejected",
    labelKey: "quotes.status.rejected",
    fallback: "Rejected",
  },
  { value: "expired", labelKey: "quotes.status.expired", fallback: "Expired" },
  {
    value: "converted",
    labelKey: "quotes.status.converted",
    fallback: "Converted",
  },
];

interface QuotesFilterBarProps {
  filters: QuotesFilters;
  onFiltersChange: (filters: QuotesFilters) => void;
}

// Cosmos-style FilterSelect (same as Leads/Opportunities)
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

export function QuotesFilterBar({
  filters,
  onFiltersChange,
}: QuotesFilterBarProps) {
  const { t } = useTranslation("crm");
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Debounced search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || "")) {
        onFiltersChange({ ...filters, search: searchInput || undefined });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, filters, onFiltersChange]);

  const hasActiveFilters =
    filters.status !== "all" ||
    !!filters.search ||
    filters.min_value !== undefined ||
    filters.max_value !== undefined;

  const handleReset = () => {
    setSearchInput("");
    onFiltersChange({
      status: "all",
      search: undefined,
      min_value: undefined,
      max_value: undefined,
    });
  };

  return (
    <div className="border-fc-border-light flex h-10 shrink-0 items-center gap-3 border-b bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Search */}
      <div className="relative">
        <Search className="text-fc-text-muted pointer-events-none absolute top-1/2 left-2 h-3.5 w-3.5 -translate-y-1/2" />
        <input
          type="text"
          placeholder={t("quotes.filters.search", "Search quotes...")}
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
        onChange={(val) =>
          onFiltersChange({
            ...filters,
            status: val as quote_status | "all",
          })
        }
      >
        {QUOTE_STATUSES.map((status) => (
          <option key={status.value} value={status.value}>
            {t(status.labelKey, status.fallback)}
          </option>
        ))}
      </FilterSelect>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={handleReset}
          className="text-fc-text-muted hover:text-fc-text-primary text-xs transition-colors"
        >
          <X className="mr-0.5 inline h-3 w-3" />
          {t("quotes.filters.reset", "Reset")}
        </button>
      )}
    </div>
  );
}
