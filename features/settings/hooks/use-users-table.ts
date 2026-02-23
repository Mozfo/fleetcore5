"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsUser, SettingsUsersResponse } from "../types/user.types";

interface UseUsersTableProps {
  columns: ColumnDef<SettingsUser>[];
}

/**
 * Bridge hook: fetch Settings users API + Kiranism useDataTable (UI state).
 *
 * Simpler than use-leads-table because Settings users is a smaller dataset
 * without sidebar filters or Refine. Uses direct fetch + client-side pagination.
 */
export function useUsersTable({ columns }: UseUsersTableProps) {
  const [data, setData] = React.useState<SettingsUser[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await fetch("/api/adm/settings/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      const json: SettingsUsersResponse = await res.json();
      setData(json.data);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const pageCount = Math.ceil(data.length / 20);

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

  return { table, isLoading, isError, total: data.length, refetch: fetchUsers };
}
