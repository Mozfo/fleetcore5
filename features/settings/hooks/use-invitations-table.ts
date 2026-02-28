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
    pagination: { mode: "off" },
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
      columnPinning: { right: ["actions"] },
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
