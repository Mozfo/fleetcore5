"use client";

import { Plus } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table/data-table";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";

import { getUsersColumns } from "./users-columns";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { useUsersTable } from "../hooks/use-users-table";

export function UsersListPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resetPwdUserId, setResetPwdUserId] = React.useState<string | null>(
    null
  );

  const columns = React.useMemo(
    () =>
      getUsersColumns({
        onResetPassword: (id) => setResetPwdUserId(id),
      }),
    []
  );

  const { table, isLoading, isError, total, refetch } = useUsersTable({
    columns,
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={7} filterCount={2} rowCount={8} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">Failed to load users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Users</h3>
          <p className="text-muted-foreground text-sm">
            {total} user{total !== 1 ? "s" : ""} total
          </p>
        </div>
      </div>

      <DataTable table={table}>
        <DataTableToolbar table={table}>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 size-4" />
            Create User
          </Button>
        </DataTableToolbar>
      </DataTable>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />

      <ResetPasswordDialog
        userId={resetPwdUserId}
        open={resetPwdUserId !== null}
        onOpenChange={(open) => {
          if (!open) setResetPwdUserId(null);
        }}
      />
    </div>
  );
}
