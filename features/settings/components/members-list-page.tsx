"use client";

import {
  Download,
  FileSpreadsheet,
  KeyRound,
  Plus,
  Power,
  Trash2,
  Users,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type TableDensity } from "@/components/ui/table/data-table";
import {
  DataTableBulkActions,
  type BulkAction,
} from "@/components/ui/table/data-table-bulk-actions";
import { DataTableDensityToggle } from "@/components/ui/table/data-table-density-toggle";
import { DataTableExpandToggle } from "@/components/ui/table/data-table-expand-toggle";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { exportTableToCSV, exportTableToExcel } from "@/lib/utils/table-export";
import { useTablePreferences } from "@/hooks/use-table-preferences";

import { getMembersColumns } from "./members-columns";
import { CreateMemberDialog } from "./create-member-dialog";
import { MemberExpandedRow } from "./member-expanded-row";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { useMembersTable } from "../hooks/use-members-table";

export function MembersListPage() {
  const { localizedPath } = useLocalizedPath();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [resetPwdMemberId, setResetPwdMemberId] = React.useState<string | null>(
    null
  );
  const [deleteMemberId, setDeleteMemberId] = React.useState<string | null>(
    null
  );

  // Table preferences
  const { preferences, save: savePreferences } = useTablePreferences("members");
  const [density, setDensity] = React.useState<TableDensity>(
    preferences.density ?? "normal"
  );

  const handleDensityChange = React.useCallback(
    (d: TableDensity) => {
      setDensity(d);
      savePreferences({ density: d });
    },
    [savePreferences]
  );

  const [expandEnabled, setExpandEnabled] = React.useState(
    preferences.expandEnabled ?? false
  );

  const handleExpandToggle = React.useCallback(
    (enabled: boolean) => {
      setExpandEnabled(enabled);
      savePreferences({ expandEnabled: enabled });
    },
    [savePreferences]
  );

  function handleToggleStatus(memberId: string, currentStatus: string) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    void (async () => {
      try {
        const res = await fetch(`/api/admin/members/${memberId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error ?? "Failed to update status");
          return;
        }
        toast.success(
          `Member ${newStatus === "active" ? "reactivated" : "deactivated"}`
        );
        await refetch();
      } catch {
        toast.error("Network error");
      }
    })();
  }

  function handleDelete() {
    if (!deleteMemberId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/members/${deleteMemberId}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error ?? "Failed to delete member");
          return;
        }
        toast.success("Member deleted");
        setDeleteMemberId(null);
        await refetch();
      } catch {
        toast.error("Network error");
      }
    })();
  }

  const columns = React.useMemo(
    () =>
      getMembersColumns({
        localizedPath,
        onResetPassword: (id) => setResetPwdMemberId(id),
        onToggleStatus: handleToggleStatus,
        onDelete: (id) => setDeleteMemberId(id),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { table, isLoading, isError, errorMessage, total, refetch } =
    useMembersTable({
      columns,
    });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Sync expand toggle with table state
  React.useEffect(() => {
    table.getColumn("expand")?.toggleVisibility(expandEnabled);
    if (!expandEnabled) table.toggleAllRowsExpanded(false);
  }, [expandEnabled, table]);

  // Bulk actions
  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: "Reset Password",
        icon: KeyRound,
        onClick: () => {
          void (async () => {
            const rows = table.getFilteredSelectedRowModel().rows;
            const ids = rows.map((r) => r.original.authUserId).filter(Boolean);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/members/${id}/reset-password`, {
                  method: "POST",
                })
              )
            );
            toast.success(`Reset links sent to ${ids.length} members`);
            table.resetRowSelection();
          })();
        },
      },
      {
        label: "Deactivate",
        icon: Power,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/members/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "inactive" }),
                })
              )
            );
            toast.success(`${ids.length} members deactivated`);
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
      {
        label: "Activate",
        icon: Power,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/members/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "active" }),
                })
              )
            );
            toast.success(`${ids.length} members activated`);
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
      {
        label: "Delete",
        icon: Trash2,
        variant: "destructive" as const,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/members/${id}`, { method: "DELETE" })
              )
            );
            toast.success(`${ids.length} members deleted`);
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
    ],
    [table, refetch]
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={10} filterCount={2} rowCount={8} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1">
        <p className="text-destructive text-sm">Failed to load members.</p>
        {errorMessage && (
          <p className="text-muted-foreground text-xs">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (total === 0) {
    return (
      <>
        <h1 className="text-lg font-semibold tracking-tight">Members</h1>
        <EmptyState
          icon={<Users className="size-16" />}
          title="No members yet"
          description="Add your first member to start managing your team."
          action={{
            label: "Add your first member",
            onClick: () => setCreateOpen(true),
            icon: <Plus className="size-4" />,
          }}
        />
        <CreateMemberDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold tracking-tight">Members</h1>

      <DataTable
        table={table}
        density={density}
        renderExpandedRow={
          expandEnabled
            ? (row) => <MemberExpandedRow member={row.original} />
            : undefined
        }
        actionBar={
          <DataTableBulkActions
            selectedCount={selectedCount}
            selectedLabel={`${selectedCount} selected`}
            actions={bulkActions}
            onClearSelection={() => table.toggleAllRowsSelected(false)}
          />
        }
      >
        <DataTableToolbar
          table={table}
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Member
            </Button>
          }
        >
          <DataTableDensityToggle
            density={density}
            onDensityChange={handleDensityChange}
          />
          <DataTableExpandToggle
            expandEnabled={expandEnabled}
            onExpandEnabledChange={handleExpandToggle}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              exportTableToCSV(table, {
                filename: "members",
                onlySelected: selectedCount > 0,
              })
            }
          >
            <Download className="mr-2 size-4" />
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              exportTableToExcel(table, {
                filename: "members",
                onlySelected: selectedCount > 0,
              })
            }
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </DataTableToolbar>
      </DataTable>

      <CreateMemberDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />

      <ResetPasswordDialog
        userId={resetPwdMemberId}
        open={resetPwdMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setResetPwdMemberId(null);
        }}
      />

      <AlertDialog
        open={deleteMemberId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMemberId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Member</AlertDialogTitle>
            <AlertDialogDescription>
              This will soft-delete the member. They will no longer appear in
              the members list. This action can be reversed by an administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
