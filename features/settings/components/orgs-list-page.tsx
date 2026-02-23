"use client";

import * as React from "react";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";

import { getOrgsColumns } from "./orgs-columns";
import { useOrgsTable } from "../hooks/use-orgs-table";

export function OrgsListPage() {
  const columns = React.useMemo(() => getOrgsColumns(), []);

  const { table, isLoading, isError, total } = useOrgsTable({ columns });

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} filterCount={1} rowCount={6} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">
          Failed to load organizations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Organizations</h3>
        <p className="text-muted-foreground text-sm">
          {total} organization{total !== 1 ? "s" : ""} total
        </p>
      </div>

      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}
