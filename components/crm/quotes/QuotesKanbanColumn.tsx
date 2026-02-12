/**
 * QuotesKanbanColumn - Single column in the Kanban board (fc-* design tokens)
 */

"use client";

import { useTranslation } from "react-i18next";
import { QuotesKanbanCard } from "./QuotesKanbanCard";
import { cn } from "@/lib/utils";
import type { Quote } from "@/lib/repositories/crm/quote.repository";
import type { quote_status } from "@prisma/client";

interface QuotesKanbanColumnProps {
  status: quote_status;
  quotes: Quote[];
  count: number;
  totalValue: number;
  onQuoteClick: (quote: Quote) => void;
  onSendQuote: (quote: Quote) => void;
  onConvertQuote: (quote: Quote) => void;
  onDeleteQuote: (quote: Quote) => void;
}

// Map quote status to fc-* pill colors
const STATUS_PILL_COLOR: Record<quote_status, string> = {
  draft: "bg-fc-neutral-500",
  sent: "bg-fc-primary-500",
  viewed: "bg-purple-500",
  accepted: "bg-fc-success-500",
  rejected: "bg-fc-danger-500",
  expired: "bg-fc-warning-500",
  converted: "bg-emerald-500",
};

export function QuotesKanbanColumn({
  status,
  quotes,
  count,
  totalValue,
  onQuoteClick,
  onSendQuote,
  onConvertQuote,
  onDeleteQuote,
}: QuotesKanbanColumnProps) {
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
    <div className="rounded-fc-lg border-fc-border-light flex w-72 flex-shrink-0 flex-col border dark:border-gray-700">
      {/* Column header */}
      <div className="border-fc-border-light bg-fc-bg-card/95 flex flex-col gap-2 rounded-t-lg border-b px-3 py-2.5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-5 w-1.5 rounded-full",
                STATUS_PILL_COLOR[status] || "bg-fc-neutral-500"
              )}
            />
            <h3 className="text-fc-text-primary text-sm font-semibold tracking-wide uppercase dark:text-gray-300">
              {t(`quotes.status.${status}`, status)}
            </h3>
          </div>
          <span
            className="bg-fc-neutral-500 inline-flex min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold text-white"
            style={{ height: 24 }}
          >
            {count}
          </span>
        </div>
        {/* Value summary */}
        <div className="text-fc-text-muted flex items-center justify-between text-xs dark:text-gray-500">
          <span>{t("quotes.column.value", "Value")}</span>
          <span className="text-fc-text-primary font-medium dark:text-gray-300">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div className="bg-fc-bg-card/50 flex-1 space-y-2 overflow-y-auto rounded-b-lg p-3 dark:bg-gray-800/50">
        {quotes.length === 0 ? (
          <div className="text-fc-text-muted flex h-24 items-center justify-center text-sm dark:text-gray-500">
            {t("quotes.empty.column", "No quotes")}
          </div>
        ) : (
          quotes.map((quote) => (
            <QuotesKanbanCard
              key={quote.id}
              quote={quote}
              onClick={() => onQuoteClick(quote)}
              onSend={() => onSendQuote(quote)}
              onConvert={() => onConvertQuote(quote)}
              onDelete={() => onDeleteQuote(quote)}
            />
          ))
        )}
      </div>
    </div>
  );
}
