"use client";

import { useList } from "@refinedev/core";
import type { ColumnDef } from "@tanstack/react-table";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsInvitation } from "../types/invitation.types";

interface UseInvitationsTableProps {
  columns: ColumnDef<SettingsInvitation>[];
}

export function useInvitationsTable({ columns }: UseInvitationsTableProps) {
  const { query, result } = useList<SettingsInvitation>({
    resource: "invitations",
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
