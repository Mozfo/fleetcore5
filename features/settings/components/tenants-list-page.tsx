"use client";

import { Download, FileSpreadsheet, Plus, Building2 } from "lucide-react";
import { Power, Trash2 } from "lucide-react";
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
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
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

import { getTenantsColumns } from "./tenants-columns";
import { CreateTenantDialog } from "./create-tenant-dialog";
import { useTenantsTable } from "../hooks/use-tenants-table";

export function TenantsListPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [deleteTenantId, setDeleteTenantId] = React.useState<string | null>(
    null
  );
  const { localizedPath } = useLocalizedPath();

  // Table preferences
  const { preferences, save: savePreferences } = useTablePreferences("tenants");
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

  const handleToggleStatus = React.useCallback(
    (tenantId: string, currentStatus: string) => {
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      void (async () => {
        try {
          const res = await fetch(`/api/admin/tenants/${tenantId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          });
          if (!res.ok) throw new Error(await res.text());
          toast.success(
            `Tenant ${newStatus === "active" ? "activated" : "suspended"}`
          );
          await refetch();
        } catch {
          toast.error("Failed to update tenant status");
        }
      })();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const columns = React.useMemo(
    () =>
      getTenantsColumns({
        localizedPath,
        onToggleStatus: handleToggleStatus,
        onDelete: (id) => setDeleteTenantId(id),
      }),
    [localizedPath, handleToggleStatus]
  );

  const { table, isLoading, isError, total, refetch } = useTenantsTable({
    columns,
  });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const handleDelete = React.useCallback(() => {
    if (!deleteTenantId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/admin/tenants/${deleteTenantId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success("Tenant deleted");
        setDeleteTenantId(null);
        await refetch();
      } catch {
        toast.error("Failed to delete tenant");
      }
    })();
  }, [deleteTenantId, refetch]);

  // Bulk actions
  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: "Suspend",
        icon: Power,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            await Promise.allSettled(
              ids.map((id) =>
                fetch(`/api/admin/tenants/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "suspended" }),
                })
              )
            );
            toast.success(`${ids.length} tenants suspended`);
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
                fetch(`/api/admin/tenants/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "active" }),
                })
              )
            );
            toast.success(`${ids.length} tenants activated`);
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
                fetch(`/api/admin/tenants/${id}`, { method: "DELETE" })
              )
            );
            toast.success(`${ids.length} tenants deleted`);
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
    ],
    [table, refetch]
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={9} filterCount={2} rowCount={6} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center">
        <p className="text-destructive text-sm">Failed to load tenants.</p>
      </div>
    );
  }

  if (total === 0) {
    return (
      <>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        </div>
        <EmptyState
          icon={<Building2 className="size-16" />}
          title="No tenants yet"
          description="Create your first tenant to get started with multi-tenant management."
          action={{
            label: "Create your first tenant",
            onClick: () => setCreateOpen(true),
            icon: <Plus className="size-4" />,
          }}
        />
        <CreateTenantDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Tenant
        </Button>
      </div>

      <DataTable
        table={table}
        density={density}
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
                filename: "tenants",
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
                filename: "tenants",
                onlySelected: selectedCount > 0,
              })
            }
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </DataTableToolbar>
      </DataTable>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />

      <AlertDialog
        open={deleteTenantId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTenantId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the tenant and all associated data.
              This action cannot be undone.
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
