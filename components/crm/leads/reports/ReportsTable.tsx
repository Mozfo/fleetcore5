"use client";

/**
 * ReportsTable - Server-side paginated table for Reports
 * Supports 10k+ leads with efficient pagination
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import {
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColdLeadsFilterState } from "./ColdLeadsFilter";

interface Lead {
  id: string;
  lead_code: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  company_name: string | null;
  country: {
    flag_emoji: string;
    country_name_en: string;
    country_code: string;
  } | null;
  fleet_size: string | null;
  status: string;
  lead_stage: string | null;
  qualification_score: number | null;
  created_at: string;
  updated_at: string | null;
}

interface ReportsTableProps {
  coldFilter: ColdLeadsFilterState;
  locale: "en" | "fr";
}

const PAGE_SIZES = [25, 50, 100];

export function ReportsTable({ coldFilter, locale }: ReportsTableProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch leads with pagination
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        sort: "created_at",
        order: "desc",
      });

      if (coldFilter.enabled) {
        params.set("include_cold", "true");
        params.set("inactive_months", coldFilter.inactiveMonths.toString());
      }

      const response = await fetch(`/api/v1/crm/leads?${params}`);
      const data = await response.json();

      if (data.success) {
        setLeads(data.data || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, coldFilter]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [coldFilter.enabled, coldFilter.inactiveMonths]);

  const totalPages = Math.ceil(total / pageSize);

  // Copy email
  const copyEmail = async (email: string, id: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Navigate to lead
  const navigateToLead = (leadId: string) => {
    router.push(`/${locale}/crm/leads/${leadId}`);
  };

  // V6.3: 8 statuts
  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
      case "demo":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "proposal_sent":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
      case "payment_pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
      case "converted":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      case "lost":
        return "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400";
      case "nurturing":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "disqualified":
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    }
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      locale === "fr" ? "fr-FR" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-xs font-medium tracking-wide text-gray-500 uppercase dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400">
              <th className="px-4 py-3 text-left">
                {t("reports.table.company", "Company")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.contact", "Contact")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.email", "Email")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.phone", "Phone")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.status", "Status")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.score", "Score")}
              </th>
              <th className="px-4 py-3 text-left">
                {t("reports.table.created", "Created")}
              </th>
              <th className="px-4 py-3 text-right">
                {t("reports.table.actions", "Actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-sm text-gray-500"
                >
                  {t("reports.table.no_results", "No leads found")}
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {/* Company */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {lead.country?.flag_emoji && (
                        <span className="text-sm">
                          {lead.country.flag_emoji}
                        </span>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {lead.company_name || (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                        {lead.fleet_size && (
                          <div className="text-xs text-gray-500">
                            {lead.fleet_size}{" "}
                            {t("leads.card.vehicles", "vehicles")}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigateToLead(lead.id)}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {lead.first_name} {lead.last_name}
                    </button>
                  </td>

                  {/* Email with copy */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {lead.email}
                      </span>
                      <button
                        onClick={() => copyEmail(lead.email, lead.id)}
                        className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700"
                      >
                        {copiedId === lead.id ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-sm text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded px-2 py-0.5 text-xs font-medium uppercase",
                        getStatusColor(lead.status)
                      )}
                    >
                      {t(`leads.status.${lead.status}`, lead.status)}
                    </span>
                  </td>

                  {/* Score */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {lead.qualification_score !== null
                        ? lead.qualification_score
                        : "-"}
                    </span>
                  </td>

                  {/* Created */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(lead.created_at)}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => navigateToLead(lead.id)}
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        {/* Page size selector */}
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{t("leads.pagination.rows_per_page", "Rows per page")}:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value));
              setPage(1);
            }}
            className="rounded border border-gray-200 bg-white px-2 py-1 text-sm outline-none focus:border-blue-400 dark:border-gray-700 dark:bg-gray-800"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page info */}
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t("leads.pagination.showing", {
            start: (page - 1) * pageSize + 1,
            end: Math.min(page * pageSize, total),
            total,
            defaultValue: `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`,
          })}
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="px-2 text-sm text-gray-600 dark:text-gray-300">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
