"use client";

import { Download, FileSpreadsheet, Globe, Plus, Trash2 } from "lucide-react";
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
import { DataTableExpandToggle } from "@/components/ui/table/data-table-expand-toggle";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { exportTableToCSV, exportTableToExcel } from "@/lib/utils/table-export";
import { useTablePreferences } from "@/hooks/use-table-preferences";

import { getTenantCountriesColumns } from "./tenant-countries-columns";
import { TenantCountryDialog } from "./tenant-country-dialog";
import { useTenantCountriesTable } from "../hooks/use-tenant-countries-table";

export function TenantCountriesListPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [deleteMappingId, setDeleteMappingId] = React.useState<string | null>(
    null
  );

  // Table preferences
  const { preferences, save: savePreferences } =
    useTablePreferences("tenant-countries");
  const [density, setDensity] = React.useState<TableDensity>(
    preferences.density ?? "normal"
  );

  const [expandEnabled, setExpandEnabled] = React.useState(
    preferences.expandEnabled ?? false
  );

  const handleDensityChange = React.useCallback(
    (d: TableDensity) => {
      setDensity(d);
      savePreferences({ density: d });
    },
    [savePreferences]
  );

  const handleExpandToggle = React.useCallback(
    (enabled: boolean) => {
      setExpandEnabled(enabled);
      savePreferences({ expandEnabled: enabled });
    },
    [savePreferences]
  );

  const columns = React.useMemo(
    () =>
      getTenantCountriesColumns({
        onEdit: (id) => setEditId(id),
        onDelete: (id) => setDeleteMappingId(id),
      }),
    []
  );

  const { table, isLoading, isError, errorMessage, total, refetch } =
    useTenantCountriesTable({ columns });

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // Sync expand toggle with table state
  React.useEffect(() => {
    table.getColumn("expand")?.toggleVisibility(expandEnabled);
    if (!expandEnabled) table.toggleAllRowsExpanded(false);
  }, [expandEnabled, table]);

  // Get edit data from table rows
  const editData = React.useMemo(() => {
    if (!editId) return undefined;
    const row = table.getRowModel().rows.find((r) => r.original.id === editId);
    if (!row) return undefined;
    return {
      tenantId: row.original.tenantId,
      countryCode: row.original.countryCode,
      isPrimary: row.original.isPrimary,
    };
  }, [editId, table]);

  const handleDelete = React.useCallback(() => {
    if (!deleteMappingId) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/tenant-countries/${deleteMappingId}`,
          { method: "DELETE" }
        );
        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error ?? "Failed to remove country routing");
          setDeleteMappingId(null);
          return;
        }
        toast.success("Country routing removed");
        setDeleteMappingId(null);
        await refetch();
      } catch {
        toast.error("Network error");
      }
    })();
  }, [deleteMappingId, refetch]);

  // Bulk actions
  const bulkActions: BulkAction[] = React.useMemo(
    () => [
      {
        label: "Remove",
        icon: Trash2,
        variant: "destructive" as const,
        onClick: () => {
          void (async () => {
            const ids = table
              .getFilteredSelectedRowModel()
              .rows.map((r) => r.original.id);
            const results = await Promise.allSettled(
              ids.map(async (id) => {
                const res = await fetch(`/api/admin/tenant-countries/${id}`, {
                  method: "DELETE",
                });
                if (!res.ok) {
                  const json = await res.json();
                  throw new Error(json.error ?? "Delete failed");
                }
              })
            );
            const succeeded = results.filter(
              (r) => r.status === "fulfilled"
            ).length;
            const failed = results.filter(
              (r): r is PromiseRejectedResult => r.status === "rejected"
            );
            if (succeeded > 0) {
              toast.success(
                succeeded === 1
                  ? "1 country routing removed"
                  : `${succeeded} country routings removed`
              );
            }
            if (failed.length > 0) {
              const reason = failed[0].reason;
              const msg =
                reason instanceof Error ? reason.message : "Remove failed";
              toast.error(
                failed.length === 1
                  ? msg
                  : `${failed.length} country routings could not be removed: ${msg}`
              );
            }
            table.resetRowSelection();
            await refetch();
          })();
        },
      },
    ],
    [table, refetch]
  );

  if (isLoading) {
    return <DataTableSkeleton columnCount={6} filterCount={2} rowCount={6} />;
  }

  if (isError) {
    return (
      <div className="flex h-24 flex-col items-center justify-center gap-1">
        <p className="text-destructive text-sm">
          Failed to load country routing.
        </p>
        {errorMessage && (
          <p className="text-muted-foreground text-xs">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (total === 0) {
    return (
      <>
        <h1 className="text-lg font-semibold tracking-tight">
          Country Routing
        </h1>
        <EmptyState
          icon={<Globe className="size-16" />}
          title="No country routing yet"
          description="Assign countries to managing teams to route incoming leads."
          action={{
            label: "Add first country",
            onClick: () => setCreateOpen(true),
            icon: <Plus className="size-4" />,
          }}
        />
        <TenantCountryDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={refetch}
        />
      </>
    );
  }

  return (
    <>
      <h1 className="text-lg font-semibold tracking-tight">Country Routing</h1>

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
        <DataTableToolbar
          table={table}
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              Add Country
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
                filename: "tenant-countries",
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
                filename: "tenant-countries",
                onlySelected: selectedCount > 0,
              })
            }
          >
            <FileSpreadsheet className="mr-2 size-4" />
            Excel
          </Button>
        </DataTableToolbar>
      </DataTable>

      {/* Create dialog */}
      <TenantCountryDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
      />

      {/* Edit dialog */}
      <TenantCountryDialog
        open={editId !== null}
        onOpenChange={(open) => {
          if (!open) setEditId(null);
        }}
        onSuccess={refetch}
        editId={editId}
        editData={editData}
      />

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteMappingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteMappingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Country Routing</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the country routing. The country will become
              available for reassignment to another team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleDelete}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
