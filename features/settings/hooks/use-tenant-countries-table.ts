"use client";

import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsTenantCountry } from "../types/tenant-country.types";

interface UseTenantCountriesTableProps {
  columns: ColumnDef<SettingsTenantCountry>[];
}

export function useTenantCountriesTable({
  columns,
}: UseTenantCountriesTableProps) {
  const { query, result } = useList<SettingsTenantCountry>({
    resource: "tenant-countries",
    pagination: { mode: "off" },
    queryOptions: { refetchInterval: 30_000 },
  });

  const data = result.data;
  const total = result.total ?? 0;

  const { table } = useDataTable({
    data: data ?? [],
    columns,
    pageCount: -1,
    clientSide: true,
    shallow: true,
    disableUrlState: true,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: { select: true },
      columnPinning: { right: ["actions"] },
    },
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
