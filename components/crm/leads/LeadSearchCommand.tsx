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
import { getStatusBadgeColor } from "@/lib/utils/status-colors";

interface LeadSearchResult {
  id: string;
  lead_code: string | null;
  first_name: string | null;
  last_name: string | null;
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

  // Status colors from centralized mapping
  const getStatusColor = getStatusBadgeColor;

  const showDropdown = isOpen && (query.length > 0 || results.length > 0);

  return (
    <div ref={containerRef} className="relative">
      {/* Inline Search Input */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
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
          className="border-input bg-muted placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:ring-primary/20 h-8 w-48 rounded-md border pr-8 pl-9 text-sm transition-all outline-none focus:w-64 focus:ring-2"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!query && (
          <kbd className="border-border bg-background text-muted-foreground pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 rounded border px-1 font-mono text-[10px] select-none sm:flex">
            <span>⌘</span>K
          </kbd>
        )}
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="border-border bg-popover absolute top-full right-0 z-50 mt-1 w-80 overflow-hidden rounded-lg border shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
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
                      ? "bg-primary/10"
                      : "hover:bg-accent"
                  )}
                >
                  {/* Avatar */}
                  <div className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
                    {(lead.first_name ?? "").charAt(0)}
                    {(lead.last_name ?? "").charAt(0)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    {/* Lead code — first line, prominent */}
                    {lead.lead_code && (
                      <span className="text-primary font-mono text-xs font-medium">
                        {lead.lead_code}
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-foreground truncate text-sm font-medium">
                        {lead.first_name ?? ""} {lead.last_name ?? ""}
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
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
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
            <div className="text-muted-foreground py-6 text-center text-sm">
              {t("leads.search.no_results")}
            </div>
          ) : query.length > 0 ? (
            <div className="text-muted-foreground py-6 text-center text-sm">
              {t("leads.search.min_chars")}
            </div>
          ) : null}

          {/* Keyboard hint */}
          {results.length > 0 && (
            <div className="border-border text-muted-foreground/70 border-t px-3 py-2 text-[11px]">
              <span className="mr-3">↑↓ navigate</span>
              <span>↵ select</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
