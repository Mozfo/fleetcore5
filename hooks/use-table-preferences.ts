"use client";

import type {
  ColumnOrderState,
  ColumnPinningState,
  VisibilityState,
} from "@tanstack/react-table";
import * as React from "react";

import type { TableDensity } from "@/components/ui/table/data-table";

interface TablePreferences {
  columnVisibility?: VisibilityState;
  columnOrder?: ColumnOrderState;
  columnPinning?: ColumnPinningState;
  density?: TableDensity;
}

function readFromStorage(storageKey: string): TablePreferences {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(storageKey);
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  return typeof parsed === "object" && parsed !== null
    ? (parsed as TablePreferences)
    : {};
}

function writeToStorage(storageKey: string, data: TablePreferences) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

export function useTablePreferences(key: string) {
  const storageKey = `fleetcore_table_${key}`;

  const [preferences, setPreferences] = React.useState<TablePreferences>(() =>
    readFromStorage(storageKey)
  );

  const save = React.useCallback(
    (updates: Partial<TablePreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates };
        writeToStorage(storageKey, next);
        return next;
      });
    },
    [storageKey]
  );

  const reset = React.useCallback(() => {
    setPreferences({});
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return { preferences, save, reset };
}
