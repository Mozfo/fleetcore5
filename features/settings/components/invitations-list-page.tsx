"use client";

import * as React from "react";

import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";

import { getInvitationsColumns } from "./invitations-columns";
import { InviteForm } from "./invite-form";
import { useInvitationsTable } from "../hooks/use-invitations-table";

export function InvitationsListPage() {
  const columns = React.useMemo(() => getInvitationsColumns(), []);

  const { table, isLoading, isError, total, refetch } = useInvitationsTable({
    columns,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DataTableSkeleton columnCount={7} filterCount={1} rowCount={5} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">Failed to load invitations.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite form at top */}
      <InviteForm onSuccess={refetch} />

      {/* Invitations table */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Invitations</h3>
          <p className="text-muted-foreground text-sm">
            {total} invitation{total !== 1 ? "s" : ""} total
          </p>
        </div>

        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      </div>
    </div>
  );
}
