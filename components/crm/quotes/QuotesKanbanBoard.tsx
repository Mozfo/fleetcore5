/**
 * QuotesKanbanBoard - Kanban board for quotes by status
 */

"use client";

import { useTranslation } from "react-i18next";
import { QuotesKanbanColumn } from "./QuotesKanbanColumn";
import type { Quote } from "@/lib/repositories/crm/quote.repository";
import type { quote_status } from "@prisma/client";

interface KanbanColumn {
  id: quote_status;
  quotes: Quote[];
  count: number;
  totalValue: number;
}

interface QuotesKanbanBoardProps {
  columns: KanbanColumn[];
  onQuoteClick: (quote: Quote) => void;
  onSendQuote: (quote: Quote) => void;
  onConvertQuote: (quote: Quote) => void;
  onDeleteQuote: (quote: Quote) => void;
}

export function QuotesKanbanBoard({
  columns,
  onQuoteClick,
  onSendQuote,
  onConvertQuote,
  onDeleteQuote,
}: QuotesKanbanBoardProps) {
  useTranslation("crm"); // Load CRM namespace

  return (
    <div className="flex h-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <QuotesKanbanColumn
          key={column.id}
          status={column.id}
          quotes={column.quotes}
          count={column.count}
          totalValue={column.totalValue}
          onQuoteClick={onQuoteClick}
          onSendQuote={onSendQuote}
          onConvertQuote={onConvertQuote}
          onDeleteQuote={onDeleteQuote}
        />
      ))}
    </div>
  );
}
