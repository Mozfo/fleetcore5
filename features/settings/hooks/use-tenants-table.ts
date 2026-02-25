"use client";

import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsTenant } from "../types/tenant.types";

interface UseTenantsTableProps {
  columns: ColumnDef<SettingsTenant>[];
}

export function useTenantsTable({ columns }: UseTenantsTableProps) {
  const { query, result } = useList<SettingsTenant>({
    resource: "tenants",
    pagination: { mode: "off" },
  });

  const data = result.data;
  const total = result.total ?? 0;

  const { table } = useDataTable({
    data,
    columns,
    pageCount: -1,
    clientSide: true,
    shallow: true,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return {
    table,
    isLoading: query.isLoading,
    isError: query.isError,
    total,
    refetch: query.refetch,
  };
}
