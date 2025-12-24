/**
 * QuoteSummaryCard - Summary card showing quote totals
 */

"use client";

import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, FileText, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteSummaryCardProps {
  totalQuotes: number;
  totalValue: number;
  acceptedValue: number;
  acceptedCount: number;
  currency?: string;
  className?: string;
}

export function QuoteSummaryCard({
  totalQuotes,
  totalValue,
  acceptedValue,
  acceptedCount,
  currency = "EUR",
  className,
}: QuoteSummaryCardProps) {
  const { t } = useTranslation("crm");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const acceptanceRate =
    totalQuotes > 0 ? Math.round((acceptedCount / totalQuotes) * 100) : 0;

  return (
    <div
      className={cn(
        "rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
        className
      )}
    >
      <h3 className="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
        {t("quotes.summary.title", "Quote Summary")}
      </h3>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Total Quotes */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <FileText className="h-4 w-4" />
            <span className="text-xs">
              {t("quotes.summary.total_quotes", "Total Quotes")}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalQuotes}
          </p>
        </div>

        {/* Total Value */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            <span className="text-xs">
              {t("quotes.summary.total_value", "Total Value")}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalValue)}
          </p>
        </div>

        {/* Accepted Value */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            <span className="text-xs">
              {t("quotes.summary.accepted_value", "Accepted Value")}
            </span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(acceptedValue)}
          </p>
        </div>

        {/* Acceptance Rate */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs">
              {t("quotes.summary.acceptance_rate", "Acceptance Rate")}
            </span>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {acceptanceRate}%
          </p>
        </div>
      </div>
    </div>
  );
}
