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
