"use client";

/**
 * Hook pour gérer les préférences de colonnes avec persistance localStorage
 * SSR-safe avec pattern mounted state
 * Supporte visibilité + ordre des colonnes (E1-D) + largeurs (E1-E)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { ColumnConfig } from "@/lib/config/leads-columns";
import {
  DEFAULT_COLUMN_ORDER,
  DEFAULT_COLUMN_WIDTHS,
} from "@/lib/config/leads-columns";

const STORAGE_KEY = "crm_leads_columns";

// Min/Max width constraints (E1-E best practice)
const MIN_COLUMN_WIDTH = 50;
const MAX_COLUMN_WIDTH = 500;

interface StoredPreferences {
  visibleColumns: string[];
  columnOrder: string[];
  columnWidths: Record<string, number>;
}

export function useColumnPreferences(defaultColumns: ColumnConfig[]) {
  const [mounted, setMounted] = useState(false);
  const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
  const [columnOrder, setColumnOrder] =
    useState<string[]>(DEFAULT_COLUMN_ORDER);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    DEFAULT_COLUMN_WIDTHS
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
        // Load column widths (E1-E)
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

  // Reset to default visibility, order AND widths (E1-E)
  const resetToDefault = useCallback(() => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        visible: col.defaultVisible,
      }))
    );
    setColumnOrder(DEFAULT_COLUMN_ORDER);
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
  }, []);

  // Resize column (E1-E) with min/max constraints
  const resizeColumn = useCallback((key: string, width: number) => {
    const constrainedWidth = Math.max(
      MIN_COLUMN_WIDTH,
      Math.min(MAX_COLUMN_WIDTH, width)
    );
    setColumnWidths((prev) => ({ ...prev, [key]: constrainedWidth }));
  }, []);

  // Get column width (E1-E) - returns custom width or default
  const getColumnWidth = useCallback(
    (key: string): number => {
      return columnWidths[key] ?? DEFAULT_COLUMN_WIDTHS[key] ?? 100;
    },
    [columnWidths]
  );

  // Reorder columns (E1-D drag & drop)
  const reorderColumns = useCallback((activeKey: string, overKey: string) => {
    setColumnOrder((prev) => {
      const oldIndex = prev.indexOf(activeKey);
      const newIndex = prev.indexOf(overKey);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  // Get visible columns only
  const visibleColumns = useMemo(() => {
    return columns.filter((c) => c.visible);
  }, [columns]);

  // Get visible column keys
  const visibleColumnKeys = useMemo(() => {
    return columns.filter((c) => c.visible).map((c) => c.key);
  }, [columns]);

  // Get visible columns sorted by columnOrder (E1-D)
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

  // Import preferences from saved view (E2-B)
  const importPreferences = useCallback(
    (prefs: {
      visibleColumns: string[];
      columnOrder: string[];
      columnWidths: Record<string, number>;
    }) => {
      // Update visibility
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          visible: col.locked ? true : prefs.visibleColumns.includes(col.key),
        }))
      );
      // Update order
      if (prefs.columnOrder.length > 0) {
        setColumnOrder(prefs.columnOrder);
      }
      // Update widths
      if (Object.keys(prefs.columnWidths).length > 0) {
        setColumnWidths(prefs.columnWidths);
      }
    },
    []
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
    importPreferences,
  };
}
