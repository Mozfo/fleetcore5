"use client";

import { Plus, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BulkActionsBar } from "@/components/crm/leads/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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

  const { table, isLoading, isError, total } = useLeadsTable({ columns });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

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

  if (total === 0 && table.getState().columnFilters.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-16" />}
        title={t("leads.empty.no_data")}
        description={t("leads.empty.no_data_desc")}
        action={{
          label: t("leads.actions.new_lead"),
          onClick: () => toast.info("Coming soon"),
          icon: <Plus className="size-4" />,
        }}
      />
    );
  }

  return (
    <DataTable
      table={table}
      actionBar={
        <BulkActionsBar
          selectedCount={selectedCount}
          onAssign={() => toast.info("Coming soon")}
          onChangeStatus={() => toast.info("Coming soon")}
          onExport={() => toast.info("Coming soon")}
          onDelete={() => toast.info("Coming soon")}
          onClearSelection={() => table.toggleAllRowsSelected(false)}
        />
      }
    >
      <DataTableToolbar table={table}>
        <Button size="sm" asChild>
          <Link href="/crm/leads/new">
            <Plus className="mr-2 size-4" />
            {t("leads.actions.new_lead")}
          </Link>
        </Button>
      </DataTableToolbar>
    </DataTable>
  );
}
