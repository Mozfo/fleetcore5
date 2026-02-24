"use client";

import {
  Download,
  FileSpreadsheet,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

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
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { exportTableToCSV, exportTableToExcel } from "@/lib/utils/table-export";
import { useTablePreferences } from "@/hooks/use-table-preferences";

import { getInvitationsColumns } from "./invitations-columns";
import { InvitationExpandedRow } from "./invitation-expanded-row";
import { InviteFormDialog } from "./invite-form";
import { useInvitationsTable } from "../hooks/use-invitations-table";

export function InvitationsListPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [deleteInvId, setDeleteInvId] = React.useState<string | null>(null);

  // Table preferences
  const { preferences, save: savePreferences } =
    useTablePreferences("invitations");
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

  const handleResend = React.useCallback((invitationId: string) => {
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/invitations/${invitationId}/resend`,
          {
            method: "POST",
          }
        );
        if (!res.ok) throw new Error(await res.text());
        toast.success("Invitation resent");
      } catch {
        toast.error("Failed to resend invitation");
      }
    })();
  }, []);

  const handleRevoke = React.useCallback(
    (invitationId: string) => {
      void (async () => {
        try {
          const res = await fetch(`/api/admin/invitations/${invitationId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "canceled" }),
          });
          if (!res.ok) throw new Error(await res.text());
          toast.success("Invitation revoked");
          await refetch();
        } catch {
          toast.error("Failed to revoke invitation");
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const columns = React.useMemo(
    () =>
      getInvitationsColumns({
        onResend: handleResend,
        onRevoke: handleRevoke,
        onDelete: (id) => setDeleteInvId(id),
      }),
    [handleResend, handleRevoke]
  );

  const { table, isLoading, isError, total, refetch } = useInvitationsTable({
    columns,
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const handleDelete = React.useCallback(() => {
    if (!deleteInvId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/invitations/${deleteInvId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Invitation deleted");
        setDeleteInvId(null);
        await refetch();
      } catch {
        toast.error("Failed to delete invitation");
      }
    })();
  }, [deleteInvId, refetch]);

  // Bulk actions
  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: "Resend",
        icon: RefreshCw,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/invitations/${id}/resend`, { method: "POST" })
              )
            );
            toast.success(`${ids.length} invitations resent`);
            table.resetRowSelection();
          })();
        },
      },
      {
        label: "Revoke",
        icon: XCircle,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/invitations/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "canceled" }),
                })
              )
            );
            toast.success(`${ids.length} invitations revoked`);
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
                fetch(`/api/admin/invitations/${id}`, { method: "DELETE" })
              )
            );
            toast.success(`${ids.length} invitations deleted`);
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
    ],
    [table, refetch]
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} filterCount={1} rowCount={5} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">Failed to load invitations.</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <>
        <h1 className="text-lg font-semibold tracking-tight">Invitations</h1>
        <EmptyState
          icon={<Mail className="size-16" />}
          title="No invitations sent"
          description="Send your first invitation to onboard team members."
          action={{
            label: "Send your first invitation",
            onClick: () => setDialogOpen(true),
            icon: <Send className="size-4" />,
          }}
        />
        <InviteFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold tracking-tight">Invitations</h1>

      <DataTable
        table={table}
        density={density}
        renderExpandedRow={(row) => (
          <InvitationExpandedRow invitation={row.original} />
        )}
        actionBar={
          <DataTableBulkActions
            selectedCount={selectedCount}
            selectedLabel={`${selectedCount} selected`}
            actions={bulkActions}
            onClearSelection={() => table.toggleAllRowsSelected(false)}
          />
        }
      >
        <DataTableToolbar table={table}>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Send className="mr-2 size-4" />
            Send Invitation
          </Button>
          <DataTableDensityToggle
            density={density}
            onDensityChange={handleDensityChange}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              exportTableToCSV(table, {
                filename: "invitations",
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
                filename: "invitations",
                onlySelected: selectedCount > 0,
              })
            }
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </DataTableToolbar>
      </DataTable>

      <InviteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />

      <AlertDialog
        open={deleteInvId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteInvId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the invitation. The recipient will no
              longer be able to accept it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
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
