/**
 * QuotesPageHeader - Header with title, stats, and new quote button
 */

"use client";

import { useTranslation } from "react-i18next";
import { Plus, FileText, Send, CheckCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { quote_status } from "@prisma/client";

interface QuotesStats {
  total: number;
  totalValue: number;
  draft: number;
  sent: number;
  accepted: number;
  byStatus: Record<quote_status, { count: number; value: number }>;
}

interface QuotesPageHeaderProps {
  stats: QuotesStats;
  onNewQuote: () => void;
}

export function QuotesPageHeader({ stats, onNewQuote }: QuotesPageHeaderProps) {
  const { t } = useTranslation("crm");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Title and action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("quotes.title", "Quotes")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("quotes.subtitle", "Manage quotes and proposals")}
          </p>
        </div>
        <Button onClick={onNewQuote}>
          <Plus className="mr-2 h-4 w-4" />
          {t("quotes.actions.new_quote", "New Quote")}
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Drafts */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              {t("quotes.stats.draft", "Drafts")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.draft}
          </p>
        </div>

        {/* Sent */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              {t("quotes.stats.sent", "Sent")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.sent}
          </p>
        </div>

        {/* Accepted */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              {t("quotes.stats.accepted", "Accepted")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {stats.accepted}
          </p>
        </div>

        {/* Total Value */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <DollarSign className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase dark:text-gray-400">
              {t("quotes.stats.totalValue", "Total Value")}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(stats.totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
