/**
 * QuotesPageClient - Client Component pour Pipeline Kanban/Table
 *
 * Architecture:
 * - Reçoit TOUS les quotes du Server Component
 * - Filtre côté client avec useMemo (~5ms)
 * - Optimistic updates pour les actions
 * - 7 colonnes Kanban: draft -> sent -> viewed -> accepted/rejected/expired -> converted
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { QuotesPageHeader } from "./QuotesPageHeader";
import { QuotesFilterBar } from "./QuotesFilterBar";
import { QuotesKanbanBoard } from "./QuotesKanbanBoard";
import { QuotesTable } from "./QuotesTable";
import { QuoteColumnSelector } from "./QuoteColumnSelector";
import { QuoteDrawer } from "./QuoteDrawer";
import { TablePagination } from "../leads/TablePagination";
import { SendQuoteModal } from "./SendQuoteModal";
import { ConvertToOrderModal } from "./ConvertToOrderModal";
import { DeleteQuoteModal } from "./DeleteQuoteModal";
import { useQuoteColumnPreferences } from "@/lib/hooks/useQuoteColumnPreferences";
import { DEFAULT_QUOTE_COLUMNS } from "@/lib/config/quotes-columns";
import type { Quote } from "@/lib/repositories/crm/quote.repository";
import type { quote_status } from "@prisma/client";
import type { QuotesFilters } from "@/app/[locale]/(app)/crm/quotes/page";

const VIEW_MODE_STORAGE_KEY = "crm_quotes_view";

// Quote status order for Kanban
const QUOTE_STATUS_ORDER: quote_status[] = [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "rejected",
  "expired",
  "converted",
];

interface QuotesPageClientProps {
  allQuotes: Quote[];
  stats: Partial<Record<quote_status, number>>;
  initialFilters: QuotesFilters;
}

export function QuotesPageClient({
  allQuotes,
  stats: _stats,
  initialFilters,
}: QuotesPageClientProps) {
  const router = useRouter();
  useTranslation("crm"); // Load CRM namespace

  // Local state for optimistic updates
  const [localQuotes, setLocalQuotes] = useState(allQuotes);

  // Filter state
  const [filters, setFilters] = useState<QuotesFilters>(initialFilters);

  // View mode (kanban or table)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Table state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Drawer state
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal states
  const [sendModalQuote, setSendModalQuote] = useState<Quote | null>(null);
  const [convertModalQuote, setConvertModalQuote] = useState<Quote | null>(
    null
  );
  const [deleteModalQuote, setDeleteModalQuote] = useState<Quote | null>(null);

  // Column preferences
  const {
    orderedColumns,
    orderedVisibleColumns,
    visibleColumnKeys,
    getColumnWidth,
    toggleColumn,
    reorderColumns,
    resizeColumn,
    resetToDefault: resetColumns,
  } = useQuoteColumnPreferences(DEFAULT_QUOTE_COLUMNS);

  // Load viewMode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "kanban" || saved === "table") {
        setViewMode(saved);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleViewModeChange = useCallback((mode: "kanban" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Silently fail
    }
  }, []);

  // Filter quotes client-side
  const filteredQuotes = useMemo(() => {
    return localQuotes.filter((quote) => {
      // Status filter
      if (filters.status !== "all" && quote.status !== filters.status) {
        return false;
      }

      // Value range filter
      if (filters.min_value !== undefined && quote.total_value !== null) {
        if (Number(quote.total_value) < filters.min_value) return false;
      }
      if (filters.max_value !== undefined && quote.total_value !== null) {
        if (Number(quote.total_value) > filters.max_value) return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [quote.quote_reference, quote.quote_code]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableFields.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [localQuotes, filters]);

  // Calculate stats
  const computedStats = useMemo(() => {
    const byStatus = QUOTE_STATUS_ORDER.reduce(
      (acc, status) => {
        const statusQuotes = filteredQuotes.filter((q) => q.status === status);
        acc[status] = {
          count: statusQuotes.length,
          value: statusQuotes.reduce(
            (sum, q) => sum + Number(q.total_value || 0),
            0
          ),
        };
        return acc;
      },
      {} as Record<quote_status, { count: number; value: number }>
    );

    const totalValue = filteredQuotes.reduce(
      (sum, q) => sum + Number(q.total_value || 0),
      0
    );

    return {
      total: filteredQuotes.length,
      totalValue,
      byStatus,
      draft: byStatus.draft?.count || 0,
      sent: byStatus.sent?.count || 0,
      accepted: byStatus.accepted?.count || 0,
    };
  }, [filteredQuotes]);

  // Transform for Kanban view
  const kanbanColumns = useMemo(() => {
    return QUOTE_STATUS_ORDER.map((status) => ({
      id: status,
      quotes: filteredQuotes.filter((q) => q.status === status),
      count: computedStats.byStatus[status]?.count || 0,
      totalValue: computedStats.byStatus[status]?.value || 0,
    }));
  }, [filteredQuotes, computedStats]);

  // Sort and paginate for table view
  const sortedAndPaginatedQuotes = useMemo(() => {
    const sorted = [...filteredQuotes].sort((a, b) => {
      const aValue = a[sortColumn as keyof Quote];
      const bValue = b[sortColumn as keyof Quote];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      let comparison = 0;
      if (typeof aValue === "string" && typeof bValue === "string") {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredQuotes, sortColumn, sortDirection, currentPage, pageSize]);

  // Handlers
  const handleQuoteClick = useCallback((quote: Quote) => {
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedQuote(null), 300);
  }, []);

  const handleSendQuote = useCallback((quote: Quote) => {
    setSendModalQuote(quote);
  }, []);

  const handleConvertToOrder = useCallback((quote: Quote) => {
    setConvertModalQuote(quote);
  }, []);

  const handleDeleteQuote = useCallback((quote: Quote) => {
    setDeleteModalQuote(quote);
  }, []);

  const handleSort = useCallback((column: string) => {
    setSortColumn((prev) => {
      if (prev === column) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
        return column;
      }
      setSortDirection("desc");
      return column;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === sortedAndPaginatedQuotes.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedAndPaginatedQuotes.map((q) => q.id));
    }
  }, [selectedIds, sortedAndPaginatedQuotes]);

  const handleSelectQuote = useCallback((quoteId: string) => {
    setSelectedIds((prev) =>
      prev.includes(quoteId)
        ? prev.filter((id) => id !== quoteId)
        : [...prev, quoteId]
    );
  }, []);

  return (
    <div className="flex h-full flex-col space-y-4 p-6">
      {/* Header with stats */}
      <QuotesPageHeader
        stats={computedStats}
        onNewQuote={() => router.push("/crm/quotes/new")}
      />

      {/* Filter bar */}
      <QuotesFilterBar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
      />

      {/* Column selector for table view */}
      {viewMode === "table" && (
        <div className="flex justify-end">
          <QuoteColumnSelector
            columns={orderedColumns}
            visibleColumns={visibleColumnKeys}
            columnOrder={orderedColumns.map((c) => c.key)}
            onToggleColumn={toggleColumn}
            onReorderColumns={reorderColumns}
            onResetColumns={resetColumns}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <QuotesKanbanBoard
            columns={kanbanColumns}
            onQuoteClick={handleQuoteClick}
            onSendQuote={handleSendQuote}
            onConvertQuote={handleConvertToOrder}
            onDeleteQuote={handleDeleteQuote}
          />
        ) : (
          <>
            <QuotesTable
              quotes={sortedAndPaginatedQuotes}
              columns={orderedVisibleColumns}
              selectedIds={selectedIds}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onQuoteClick={handleQuoteClick}
              onSort={handleSort}
              onSelectAll={handleSelectAll}
              onSelectQuote={handleSelectQuote}
              getColumnWidth={getColumnWidth}
              onResizeColumn={resizeColumn}
              onSendQuote={handleSendQuote}
              onConvertQuote={handleConvertToOrder}
              onDeleteQuote={handleDeleteQuote}
            />
            <TablePagination
              currentPage={currentPage}
              totalItems={filteredQuotes.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      {/* Drawer */}
      <QuoteDrawer
        quote={selectedQuote}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        onSend={handleSendQuote}
        onConvert={handleConvertToOrder}
        onDelete={handleDeleteQuote}
      />

      {/* Modals */}
      <SendQuoteModal
        quote={sendModalQuote}
        isOpen={!!sendModalQuote}
        onClose={() => setSendModalQuote(null)}
        onSuccess={(updatedQuote) => {
          setLocalQuotes((prev) =>
            prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
          );
          setSendModalQuote(null);
          router.refresh();
        }}
      />

      <ConvertToOrderModal
        quote={convertModalQuote}
        isOpen={!!convertModalQuote}
        onClose={() => setConvertModalQuote(null)}
        onSuccess={({ quote: updatedQuote }) => {
          setLocalQuotes((prev) =>
            prev.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
          );
          setConvertModalQuote(null);
          router.refresh();
        }}
      />

      <DeleteQuoteModal
        quote={deleteModalQuote}
        isOpen={!!deleteModalQuote}
        onClose={() => setDeleteModalQuote(null)}
        onSuccess={(deletedId) => {
          setLocalQuotes((prev) => prev.filter((q) => q.id !== deletedId));
          setDeleteModalQuote(null);
          handleCloseDrawer();
          router.refresh();
        }}
      />
    </div>
  );
}
