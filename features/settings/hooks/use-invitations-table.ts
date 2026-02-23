"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type {
  SettingsInvitation,
  SettingsInvitationsResponse,
} from "../types/invitation.types";

interface UseInvitationsTableProps {
  columns: ColumnDef<SettingsInvitation>[];
}

export function useInvitationsTable({ columns }: UseInvitationsTableProps) {
  const [data, setData] = React.useState<SettingsInvitation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  const fetchInvitations = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch("/api/adm/settings/invitations");
      if (!res.ok) throw new Error("Failed to fetch invitations");
      const json: SettingsInvitationsResponse = await res.json();
      setData(json.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  const pageCount = Math.ceil(data.length / 20);

  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    getRowId: (row) => row.id,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
  });

  return {
    table,
    isLoading,
    isError,
    total: data.length,
    refetch: fetchInvitations,
  };
}
