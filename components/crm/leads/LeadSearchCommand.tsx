/**
 * LeadSearchCommand - Inline search with dropdown suggestions
 * Type directly to search leads with real-time autocomplete
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, Loader2, Building2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadSearchResult {
  id: string;
  lead_code: string | null;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string | null;
  status: string;
}

interface LeadSearchCommandProps {
  locale: "en" | "fr";
}

export function LeadSearchCommand({ locale }: LeadSearchCommandProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut to focus (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Search with debounce
  const searchLeads = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/crm/leads?search=${encodeURIComponent(searchQuery)}&limit=8`
      );
      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
        setSelectedIndex(0);
      }
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle query change with debounce
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void searchLeads(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, searchLeads]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateToLead(results[selectedIndex].id);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Navigate to selected lead
  const navigateToLead = (leadId: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/${locale}/crm/leads/${leadId}`);
  };

  // Status colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "working":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "qualified":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "lost":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const showDropdown = isOpen && (query.length > 0 || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Inline Search Input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t("leads.search.placeholder_short")}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-8 w-48 rounded-md border border-gray-200 bg-gray-50 pr-8 pl-9 text-sm transition-all outline-none placeholder:text-gray-400 focus:w-64 focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:border-blue-600 dark:focus:bg-gray-900 dark:focus:ring-blue-900/30"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-gray-200 bg-white px-1 font-mono text-[10px] text-gray-400 select-none sm:flex dark:border-gray-600 dark:bg-gray-700">
            <span>⌘</span>K
          </kbd>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[320px] overflow-y-auto p-1">
              {results.map((lead, index) => (
                <button
                  key={lead.id}
                  onClick={() => navigateToLead(lead.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    index === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  {/* Avatar */}
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white">
                    {lead.first_name.charAt(0)}
                    {lead.last_name.charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {lead.first_name} {lead.last_name}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                          getStatusColor(lead.status)
                        )}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {lead.company_name && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="h-3 w-3" />
                          {lead.company_name}
                        </span>
                      )}
                      {!lead.company_name && (
                        <span className="truncate">{lead.email}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              {t("leads.search.no_results")}
            </div>
          ) : query.length > 0 ? (
            <div className="py-6 text-center text-sm text-gray-500">
              {t("leads.search.min_chars")}
            </div>
          ) : null}

          {/* Keyboard hint */}
          {results.length > 0 && (
            <div className="border-t border-gray-100 px-3 py-2 text-[11px] text-gray-400 dark:border-gray-800">
              <span className="mr-3">↑↓ navigate</span>
              <span>↵ select</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
