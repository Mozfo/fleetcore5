"use client";

import { useList } from "@refinedev/core";
import {
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ExpandedState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  type ColumnDef,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { FilterFn } from "@tanstack/react-table";
import * as React from "react";

import { fuzzyFilter, facetedFilter } from "@/lib/table-filters";
import type { SettingsTenant } from "../types/tenant.types";

interface UseTenantsTableProps {
  columns: ColumnDef<SettingsTenant>[];
}

export function useTenantsTable({ columns }: UseTenantsTableProps) {
  const { query, result } = useList<SettingsTenant>({
    resource: "tenants",
    pagination: { mode: "off" },
    queryOptions: { refetchInterval: 30_000 },
  });

  const data = result.data;
  const total = result.total ?? 0;

  // Local state — no URL sync (avoids nuqs/Next.js router conflicts)
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    left: [],
    right: [],
  });
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [globalFilter, setGlobalFilter] = React.useState<string>("");

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
      columnPinning,
      columnOrder,
      expanded,
      globalFilter,
    },
    defaultColumn: { enableColumnFilter: false },
    filterFns: {
      fuzzy: fuzzyFilter as FilterFn<SettingsTenant>,
      faceted: facetedFilter as FilterFn<SettingsTenant>,
    },
    globalFilterFn: fuzzyFilter as FilterFn<SettingsTenant>,
    enableColumnResizing: true,
    columnResizeMode: "onChange" as const,
    enableRowSelection: true,
    enableColumnPinning: true,
    enableRowPinning: true,
    keepPinnedRows: true,
    enableExpanding: true,
    enableGrouping: true,
    groupedColumnMode: "reorder" as const,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  return {
    table,
    isLoading: query.isLoading,
    isError: query.isError,
    total,
    refetch: query.refetch,
  };
}
