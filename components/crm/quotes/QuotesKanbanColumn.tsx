/**
 * QuotesKanbanColumn - Single column in the Kanban board
 */

"use client";

import { useTranslation } from "react-i18next";
import { QuotesKanbanCard } from "./QuotesKanbanCard";
import { QUOTE_STATUS_CONFIG } from "./QuoteStatusBadge";
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
  const config = QUOTE_STATUS_CONFIG[status];
  const Icon = config.icon;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="flex w-72 flex-shrink-0 flex-col">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between rounded-t-lg p-3",
          config.bgColor,
          config.darkBgColor
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {t(`quotes.status.${status}`, status)}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              config.bgColor,
              config.color
            )}
          >
            {count}
          </span>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-2 overflow-y-auto rounded-b-lg border border-t-0 border-gray-200 bg-gray-50 p-2 dark:border-gray-800 dark:bg-gray-900/50">
        {quotes.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-gray-400">
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
