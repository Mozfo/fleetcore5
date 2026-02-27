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
import type { SettingsMember } from "../types/member.types";

interface UseMembersTableProps {
  columns: ColumnDef<SettingsMember>[];
}

export function useMembersTable({ columns }: UseMembersTableProps) {
  const { query, result } = useList<SettingsMember>({
    resource: "members",
    pagination: { mode: "off" },
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
    React.useState<VisibilityState>({ select: true });
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
      fuzzy: fuzzyFilter as FilterFn<SettingsMember>,
      faceted: facetedFilter as FilterFn<SettingsMember>,
    },
    globalFilterFn: fuzzyFilter as FilterFn<SettingsMember>,
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
    errorMessage: query.error?.message ?? null,
    total,
    refetch: query.refetch,
  };
}
