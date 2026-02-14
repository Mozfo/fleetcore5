"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";

import { getLeadColumns } from "./lead-columns";
import { useLeadsTable } from "../hooks/use-leads-table";

export function LeadsListPage() {
  const { t } = useTranslation("crm");
  const { statuses, isLoading: statusesLoading } = useLeadStatuses();

  const columns = React.useMemo(
    () => getLeadColumns(t, statuses),
    [t, statuses]
  );

  const { table, isLoading, isError } = useLeadsTable({ columns });

  if (statusesLoading || isLoading) {
    return <DataTableSkeleton columnCount={9} filterCount={3} rowCount={10} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">Failed to load leads.</p>
      </div>
    );
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
