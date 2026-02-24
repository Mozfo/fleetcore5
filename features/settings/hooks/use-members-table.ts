"use client";

import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsMember } from "../types/member.types";

interface UseMembersTableProps {
  columns: ColumnDef<SettingsMember>[];
}

export function useMembersTable({ columns }: UseMembersTableProps) {
  const { query, result } = useList<SettingsMember>({
    resource: "members",
  });

  const data = result.data;
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / 20) || 1;

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
      columnVisibility: { select: true },
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
