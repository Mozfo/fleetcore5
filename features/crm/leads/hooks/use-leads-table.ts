"use client";

import { useList, type CrudFilter, type CrudSort } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import { getSortingStateParser } from "@/lib/parsers";
import type { Lead } from "../types/lead.types";

interface UseLeadsTableProps {
  columns: ColumnDef<Lead>[];
  initialPageSize?: number;
}

/**
 * Bridge hook: Refine useList (data fetching) + Kiranism useDataTable (UI state).
 *
 * Flow: URL state (nuqs) → Refine params → API fetch → data + pageCount → DataTable.
 * Both useList params and useDataTable read from the same nuqs URL state (safe dedup).
 */
export function useLeadsTable({
  columns,
  initialPageSize = 20,
}: UseLeadsTableProps) {
  // ── Read URL state for Refine data fetching ───────────────────────────
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(initialPageSize)
  );
  const columnIds = React.useMemo(
    () => new Set(columns.map((c) => c.id).filter(Boolean) as string[]),
    [columns]
  );
  const [sorting] = useQueryState(
    "sort",
    getSortingStateParser<Lead>(columnIds).withDefault([])
  );

  const sorters = React.useMemo<CrudSort[]>(
    () => sorting.map((s) => ({ field: s.id, order: s.desc ? "desc" : "asc" })),
    [sorting]
  );

  // Build filter parsers from filterable columns (mirrors useDataTable logic)
  const filterParsers = React.useMemo(() => {
    return columns
      .filter((c) => c.enableColumnFilter)
      .reduce<Record<string, Parser<string> | Parser<string[]>>>((acc, col) => {
        acc[col.id ?? ""] = col.meta?.options
          ? parseAsArrayOf(parseAsString, ",")
          : parseAsString;
        return acc;
      }, {});
  }, [columns]);

  const [filterValues] = useQueryStates(filterParsers);

  const filters = React.useMemo<CrudFilter[]>(() => {
    return Object.entries(filterValues).reduce<CrudFilter[]>(
      (acc, [key, value]) => {
        if (value === null || value === undefined) return acc;
        if (Array.isArray(value) && value.length > 0) {
          acc.push({ field: key, operator: "in", value });
        } else if (typeof value === "string" && value) {
          acc.push({ field: key, operator: "contains", value });
        }
        return acc;
      },
      []
    );
  }, [filterValues]);

  // ── Refine data fetching ──────────────────────────────────────────────
  const { query, result } = useList<Lead>({
    resource: "leads",
    pagination: { currentPage: page, pageSize: perPage },
    sorters,
    filters,
  });

  const data = result.data;
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / perPage);

  // ── Kiranism DataTable (reads same URL state — nuqs deduplicates) ─────
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
  });

  return { table, isLoading: query.isLoading, isError: query.isError, total };
}
