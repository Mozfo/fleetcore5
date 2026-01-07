"use client";

/**
 * QuickSearch - Prominent search bar for Reports page
 * HubSpot-style prominent search with quick actions (copy email, call)
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Search,
  Loader2,
  Building2,
  Mail,
  Phone,
  Copy,
  ExternalLink,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LeadSearchResult {
  id: string;
  lead_code: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  country: { flag_emoji: string; country_name_en: string } | null;
  status: string;
  qualification_score: number | null;
}

interface QuickSearchProps {
  locale: "en" | "fr";
}

export function QuickSearch({ locale }: QuickSearchProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  // Keyboard shortcut (Cmd+K / Ctrl+K)
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
        `/api/v1/crm/leads?search=${encodeURIComponent(searchQuery)}&limit=10`
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

  // Navigate to lead detail
  const navigateToLead = (leadId: string) => {
    setIsOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/${locale}/crm/leads/${leadId}`);
  };

  // Copy email to clipboard
  const copyEmail = async (e: React.MouseEvent, email: string, id: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
      case "converted":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  const showDropdown = isOpen && (query.length > 0 || results.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      {/* Prominent Search Input */}
      <div className="relative">
        <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={t(
            "reports.search.placeholder",
            "Search by name, email, or company..."
          )}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="h-12 w-full rounded-lg border border-gray-200 bg-white pr-20 pl-12 text-base transition-all outline-none placeholder:text-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/30"
        />
        <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
          <kbd className="pointer-events-none hidden items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-400 select-none sm:flex dark:border-gray-600 dark:bg-gray-700">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto">
              {results.map((lead, index) => (
                <div
                  key={lead.id}
                  className={cn(
                    "border-b border-gray-100 p-3 transition-colors last:border-b-0 dark:border-gray-800",
                    index === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      onClick={() => navigateToLead(lead.id)}
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white"
                    >
                      {lead.first_name?.charAt(0) || "?"}
                      {lead.last_name?.charAt(0) || ""}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateToLead(lead.id)}
                          className="truncate text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                        >
                          {lead.first_name} {lead.last_name}
                        </button>
                        {lead.country?.flag_emoji && (
                          <span className="text-sm">
                            {lead.country.flag_emoji}
                          </span>
                        )}
                        <span
                          className={cn(
                            "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase",
                            getStatusColor(lead.status)
                          )}
                        >
                          {t(`leads.status.${lead.status}`, lead.status)}
                        </span>
                      </div>

                      {/* Company */}
                      {lead.company_name && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{lead.company_name}</span>
                        </div>
                      )}

                      {/* Contact info with quick actions */}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        {/* Email with copy */}
                        <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                          <Mail className="h-3.5 w-3.5 text-gray-400" />
                          <span className="truncate">{lead.email}</span>
                          <button
                            onClick={(e) => copyEmail(e, lead.email, lead.id)}
                            className="rounded p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700"
                            title={t("reports.search.copy_email", "Copy email")}
                          >
                            {copiedId === lead.id ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Phone with call */}
                        {lead.phone && (
                          <a
                            href={`tel:${lead.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                          >
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            <span>{lead.phone}</span>
                          </a>
                        )}

                        {/* Score */}
                        {lead.qualification_score !== null && (
                          <span className="text-xs text-gray-500">
                            {t("reports.search.score_label")}:{" "}
                            {lead.qualification_score}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Open full page button */}
                    <button
                      onClick={() => navigateToLead(lead.id)}
                      className="shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                      title={t("reports.search.view_details", "View details")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {t("leads.search.no_results")}
            </div>
          ) : query.length > 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              {t("leads.search.min_chars")}
            </div>
          ) : null}

          {/* Keyboard hint */}
          {results.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2 text-xs text-gray-400 dark:border-gray-800">
              <span className="mr-4">{t("leads.search.hint_navigate")}</span>
              <span>{t("leads.search.hint_select")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
