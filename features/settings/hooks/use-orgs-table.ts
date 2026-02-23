"use client";

import type { ColumnDef } from "@tanstack/react-table";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import type { SettingsOrg, SettingsOrgsResponse } from "../types/org.types";

interface UseOrgsTableProps {
  columns: ColumnDef<SettingsOrg>[];
}

export function useOrgsTable({ columns }: UseOrgsTableProps) {
  const [data, setData] = React.useState<SettingsOrg[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isError, setIsError] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      setIsError(false);
      try {
        const res = await fetch("/api/adm/settings/organizations");
        if (!res.ok) throw new Error("Failed to fetch organizations");
        const json: SettingsOrgsResponse = await res.json();
        setData(json.data);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

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

  return { table, isLoading, isError, total: data.length };
}
