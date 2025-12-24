/**
 * QuotesTable - DataTable for quotes list view
 */

"use client";

import { useTranslation } from "react-i18next";
import { QuotesTableRow } from "./QuotesTableRow";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Quote } from "@/lib/repositories/crm/quote.repository";
import type { QuoteColumnConfig } from "@/lib/config/quotes-columns";

interface QuotesTableProps {
  quotes: Quote[];
  columns: QuoteColumnConfig[];
  selectedIds: string[];
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onQuoteClick: (quote: Quote) => void;
  onSort: (column: string) => void;
  onSelectAll: () => void;
  onSelectQuote: (quoteId: string) => void;
  getColumnWidth: (key: string) => number;
  onResizeColumn: (key: string, width: number) => void;
  onSendQuote: (quote: Quote) => void;
  onConvertQuote: (quote: Quote) => void;
  onDeleteQuote: (quote: Quote) => void;
}

export function QuotesTable({
  quotes,
  columns,
  selectedIds,
  sortColumn,
  sortDirection,
  onQuoteClick,
  onSort,
  onSelectAll,
  onSelectQuote,
  getColumnWidth,
  onResizeColumn: _onResizeColumn,
  onSendQuote,
  onConvertQuote,
  onDeleteQuote,
}: QuotesTableProps) {
  const { t } = useTranslation("crm");

  const allSelected = quotes.length > 0 && selectedIds.length === quotes.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < quotes.length;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "border-b border-gray-200 px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase dark:border-gray-800 dark:text-gray-400",
                  column.sortable &&
                    "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
                style={{ width: getColumnWidth(column.key) }}
                onClick={() => column.sortable && onSort(column.key)}
              >
                {column.key === "checkbox" ? (
                  <Checkbox
                    checked={someSelected ? "indeterminate" : allSelected}
                    onCheckedChange={onSelectAll}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span>{t(column.labelKey, column.key)}</span>
                    {sortColumn === column.key && (
                      <span className="text-blue-600 dark:text-blue-400">
                        {sortDirection === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-800 dark:bg-gray-900">
          {quotes.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
              >
                {t("quotes.table.empty", "No quotes found")}
              </td>
            </tr>
          ) : (
            quotes.map((quote) => (
              <QuotesTableRow
                key={quote.id}
                quote={quote}
                columns={columns}
                isSelected={selectedIds.includes(quote.id)}
                onClick={() => onQuoteClick(quote)}
                onSelect={() => onSelectQuote(quote.id)}
                onSend={() => onSendQuote(quote)}
                onConvert={() => onConvertQuote(quote)}
                onDelete={() => onDeleteQuote(quote)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
