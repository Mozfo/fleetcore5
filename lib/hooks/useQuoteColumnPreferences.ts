"use client";

/**
 * Hook pour gérer les préférences de colonnes Quotes avec persistance localStorage
 * SSR-safe avec pattern mounted state
 * Basé sur useOpportunityColumnPreferences.ts - même pattern pour cohérence UX
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { QuoteColumnConfig } from "@/lib/config/quotes-columns";
import {
  DEFAULT_QUOTE_COLUMN_ORDER,
  DEFAULT_QUOTE_COLUMN_WIDTHS,
} from "@/lib/config/quotes-columns";

const STORAGE_KEY = "crm_quotes_columns";

// Min/Max width constraints
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;

interface StoredPreferences {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
}

export function useQuoteColumnPreferences(defaultColumns: QuoteColumnConfig[]) {
  const [mounted, setMounted] = useState(false);
  const [columns, setColumns] = useState<QuoteColumnConfig[]>(defaultColumns);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    DEFAULT_QUOTE_COLUMN_ORDER
  );
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    DEFAULT_QUOTE_COLUMN_WIDTHS
  );

  // Load from localStorage on mount (SSR-safe)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const prefs: Partial<StoredPreferences> = JSON.parse(saved);
        // Load visibility
        if (prefs.visibleColumns) {
          const savedVisibleColumns = prefs.visibleColumns;
          setColumns((prev) =>
            prev.map((col) => ({
              ...col,
              // Locked columns stay visible, others use saved preference
              visible: col.locked
                ? true
                : savedVisibleColumns.includes(col.key),
            }))
          );
        }
        // Load column order
        if (prefs.columnOrder && prefs.columnOrder.length > 0) {
          setColumnOrder(prefs.columnOrder);
        }
        // Load column widths
        if (prefs.columnWidths && Object.keys(prefs.columnWidths).length > 0) {
          setColumnWidths((prev) => ({ ...prev, ...prefs.columnWidths }));
        }
      }
    } catch {
      // Silently fail - use defaults
    }
  }, []);

  // Save to localStorage on change (only after mount)
  useEffect(() => {
    if (!mounted) return;
    try {
      const visibleColumns = columns.filter((c) => c.visible).map((c) => c.key);
      const preferences: StoredPreferences = {
        visibleColumns,
        columnOrder,
        columnWidths,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Silently fail - localStorage not available
    }
  }, [columns, columnOrder, columnWidths, mounted]);

  // Toggle column visibility
  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key && !col.locked ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  // Reset to default visibility, order AND widths
  const resetToDefault = useCallback(() => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        visible: col.defaultVisible,
      }))
    );
    setColumnOrder(DEFAULT_QUOTE_COLUMN_ORDER);
    setColumnWidths(DEFAULT_QUOTE_COLUMN_WIDTHS);
  }, []);

  // Resize column with min/max constraints
  const resizeColumn = useCallback((key: string, width: number) => {
    const constrainedWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.min(MAX_COLUMN_WIDTH, width)
    );
    setColumnWidths((prev) => ({ ...prev, [key]: constrainedWidth }));
  }, []);

  // Get column width - returns custom width or default
  const getColumnWidth = useCallback(
    (key: string): number => {
      return columnWidths[key] ?? DEFAULT_QUOTE_COLUMN_WIDTHS[key] ?? 100;
    },
    [columnWidths]
  );

  // Reorder columns (accepts full order array from ColumnSelector)
  const reorderColumns = useCallback((newOrder: string[]) => {
    setColumnOrder(newOrder);
  }, []);

  // Get visible columns only
  const visibleColumns = useMemo(() => {
    return columns.filter((c) => c.visible);
  }, [columns]);

  // Get visible column keys
  const visibleColumnKeys = useMemo(() => {
    return columns.filter((c) => c.visible).map((c) => c.key);
  }, [columns]);

  // Get visible columns sorted by columnOrder
  const orderedVisibleColumns = useMemo(() => {
    const visible = columns.filter((c) => c.visible);
    return [...visible].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);
      // If not in order array, put at end
      const aPos = aIndex === -1 ? Infinity : aIndex;
      const bPos = bIndex === -1 ? Infinity : bIndex;
      return aPos - bPos;
    });
  }, [columns, columnOrder]);

  // Get columns sorted by columnOrder for ColumnSelector (includes hidden)
  const orderedColumns = useMemo(() => {
    return [...columns].sort((a, b) => {
      const aIndex = columnOrder.indexOf(a.key);
      const bIndex = columnOrder.indexOf(b.key);
      const aPos = aIndex === -1 ? Infinity : aIndex;
      const bPos = bIndex === -1 ? Infinity : bIndex;
      return aPos - bPos;
    });
  }, [columns, columnOrder]);

  // Check if a column is visible
  const isColumnVisible = useCallback(
    (key: string) => {
      const col = columns.find((c) => c.key === key);
      return col?.visible ?? false;
    },
    [columns]
  );

  return {
    columns,
    orderedColumns,
    visibleColumns,
    orderedVisibleColumns,
    visibleColumnKeys,
    columnOrder,
    columnWidths,
    toggleColumn,
    reorderColumns,
    resizeColumn,
    getColumnWidth,
    resetToDefault,
    isColumnVisible,
    mounted,
  };
}
