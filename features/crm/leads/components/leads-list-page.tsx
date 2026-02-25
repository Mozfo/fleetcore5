"use client";

import { Download, FileSpreadsheet, Filter, Plus, Users } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
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
import { BulkActionsBar } from "@/components/crm/leads/BulkActionsBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable, type TableDensity } from "@/components/ui/table/data-table";
import { DataTableDensityToggle } from "@/components/ui/table/data-table-density-toggle";
import { DataTableExpandToggle } from "@/components/ui/table/data-table-expand-toggle";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";
import { cn } from "@/lib/utils";
import { exportTableToCSV, exportTableToExcel } from "@/lib/utils/table-export";
import { useTablePreferences } from "@/hooks/use-table-preferences";

import { getLeadColumns } from "./lead-columns";
import { LeadExpandedRow } from "./lead-expanded-row";
import { LeadsCreateDialog } from "./leads-create-dialog";
import { LeadsEditDrawer } from "./leads-edit-drawer";
import { LeadsFilterSidebar } from "./leads-filter-sidebar";
import { useLeadsTable } from "../hooks/use-leads-table";
import { computeRowIndicator } from "../lib/lead-insight";

interface LeadsListPageProps {
  onTotalChange?: (total: number) => void;
}

export function LeadsListPage({ onTotalChange }: LeadsListPageProps) {
  const { t } = useTranslation("crm");
  const { localizedPath } = useLocalizedPath();
  const { statuses, isLoading: statusesLoading } = useLeadStatuses();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editLeadId, setEditLeadId] = React.useState<string | null>(null);
  const [deleteLeadId, setDeleteLeadId] = React.useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Bulk action states
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false);
  const [bulkStatusOpen, setBulkStatusOpen] = React.useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = React.useState(false);
  const [bulkAssignee, setBulkAssignee] = React.useState("");
  const [bulkNewStatus, setBulkNewStatus] = React.useState("");
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [assignableMembers, setAssignableMembers] = React.useState<
    { id: string; name: string }[]
  >([]);

  // Table preferences (localStorage persistence)
  const { preferences, save: savePreferences } = useTablePreferences("leads");
  const [density, setDensity] = React.useState<TableDensity>(
    preferences.density ?? "normal"
  );
  const [sidebarOpen, setSidebarOpen] = React.useState(
    preferences.sidebarOpen ?? true
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

  const handleSidebarToggle = React.useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      savePreferences({ sidebarOpen: next });
      return next;
    });
  }, [savePreferences]);

  const handleExpandToggle = React.useCallback(
    (enabled: boolean) => {
      setExpandEnabled(enabled);
      savePreferences({ expandEnabled: enabled });
    },
    [savePreferences]
  );

  const columns = React.useMemo(
    () =>
      getLeadColumns(
        t,
        statuses,
        (id) => setEditLeadId(id),
        (id) => setDeleteLeadId(id),
        localizedPath
      ),
    [t, statuses, localizedPath]
  );

  const { table, isLoading, isError, total } = useLeadsTable({
    columns,
    savedColumnVisibility: preferences.columnVisibility,
  });

  React.useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

  // Sync expand toggle with table state
  React.useEffect(() => {
    table.getColumn("expand")?.toggleVisibility(expandEnabled);
    if (!expandEnabled) table.toggleAllRowsExpanded(false);
  }, [expandEnabled, table]);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // ── Single delete handler ────────────────────────────────────────────────
  const handleDeleteLead = React.useCallback(async () => {
    if (!deleteLeadId) return;
    try {
      const res = await fetch(`/api/v1/crm/leads/${deleteLeadId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("leads.actions.deleted"));
      table.resetRowSelection();
    } catch {
      toast.error(t("leads.actions.delete_failed"));
    } finally {
      setDeleteLeadId(null);
    }
  }, [deleteLeadId, t, table]);

  // ── Bulk action helpers ──────────────────────────────────────────────────
  const getSelectedIds = React.useCallback(
    () => table.getFilteredSelectedRowModel().rows.map((r) => r.original.id),
    [table]
  );

  const handleBulkAssignOpen = React.useCallback(async () => {
    try {
      const res = await fetch(
        "/api/admin/members?role=admin,commercial&status=active"
      );
      if (res.ok) {
        const data = await res.json();
        const members = (data.members ?? data ?? []).map(
          (m: {
            id: string;
            first_name?: string;
            last_name?: string;
            email?: string;
          }) => ({
            id: m.id,
            name:
              [m.first_name, m.last_name].filter(Boolean).join(" ") ||
              m.email ||
              m.id,
          })
        );
        setAssignableMembers(members);
      }
    } catch {
      /* silently fallback to empty list */
    }
    setBulkAssignee("");
    setBulkAssignOpen(true);
  }, []);

  const handleBulkAssign = React.useCallback(async () => {
    if (!bulkAssignee) return;
    const ids = getSelectedIds();
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/v1/crm/leads/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigned_to: bulkAssignee }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      toast.success(
        t("leads.bulk_actions.toast.assign_success", { count: succeeded })
      );
      table.resetRowSelection();
    } catch {
      toast.error(t("leads.bulk_actions.toast.assign_error"));
    } finally {
      setBulkLoading(false);
      setBulkAssignOpen(false);
    }
  }, [bulkAssignee, getSelectedIds, t, table]);

  const handleBulkStatusChange = React.useCallback(async () => {
    if (!bulkNewStatus) return;
    const ids = getSelectedIds();
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) =>
          fetch(`/api/v1/crm/leads/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkNewStatus }),
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      toast.success(
        t("leads.bulk_actions.toast.status_success", { count: succeeded })
      );
      table.resetRowSelection();
    } catch {
      toast.error(t("leads.bulk_actions.toast.status_error"));
    } finally {
      setBulkLoading(false);
      setBulkStatusOpen(false);
    }
  }, [bulkNewStatus, getSelectedIds, t, table]);

  const handleBulkExport = React.useCallback(() => {
    exportTableToCSV(table, {
      filename: "leads-selection",
      onlySelected: true,
    });
    toast.success(t("leads.bulk_actions.toast.export_success"));
  }, [table, t]);

  const handleBulkDelete = React.useCallback(async () => {
    const ids = getSelectedIds();
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        ids.map((id) => fetch(`/api/v1/crm/leads/${id}`, { method: "DELETE" }))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      toast.success(
        t("leads.bulk_actions.toast.delete_success", { count: succeeded })
      );
      table.resetRowSelection();
    } catch {
      toast.error(t("leads.bulk_actions.toast.delete_error"));
    } finally {
      setBulkLoading(false);
      setBulkDeleteOpen(false);
    }
  }, [getSelectedIds, t, table]);

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
          onClick: () => setCreateOpen(true),
          icon: <Plus className="size-4" />,
        }}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 md:block",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="bg-card sticky top-0 h-[calc(100vh-8rem)] overflow-hidden rounded-lg border shadow-sm">
          <LeadsFilterSidebar />
        </div>
      </aside>

      {/* Mobile sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{t("leads.filters.advanced")}</SheetTitle>
          </SheetHeader>
          <LeadsFilterSidebar />
        </SheetContent>
      </Sheet>

      {/* Table area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <DataTable
          table={table}
          density={density}
          renderExpandedRow={
            expandEnabled
              ? (row) => <LeadExpandedRow lead={row.original} />
              : undefined
          }
          getRowClassName={(row) => computeRowIndicator(row.original)}
          actionBar={
            <BulkActionsBar
              selectedCount={selectedCount}
              onAssign={handleBulkAssignOpen}
              onChangeStatus={() => {
                setBulkNewStatus("");
                setBulkStatusOpen(true);
              }}
              onExport={handleBulkExport}
              onDelete={() => setBulkDeleteOpen(true)}
              onClearSelection={() => table.toggleAllRowsSelected(false)}
            />
          }
        >
          <DataTableToolbar
            table={table}
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 size-4" />
                {t("leads.actions.new_lead")}
              </Button>
            }
          >
            {/* Sidebar toggle (desktop) */}
            <Button
              variant="outline"
              size="sm"
              className="hidden h-8 md:inline-flex"
              onClick={handleSidebarToggle}
            >
              <Filter className="mr-2 size-4" />
              {t("leads.filters.advanced")}
            </Button>
            {/* Sidebar toggle (mobile) */}
            <Button
              variant="outline"
              size="sm"
              className="h-8 md:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter className="size-4" />
            </Button>
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
                  filename: "leads",
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
                  filename: "leads",
                  onlySelected: selectedCount > 0,
                })
              }
            >
              <FileSpreadsheet className="mr-2 size-4" />
              Excel
            </Button>
          </DataTableToolbar>

          <AlertDialog
            open={deleteLeadId !== null}
            onOpenChange={(open) => {
              if (!open) setDeleteLeadId(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("leads.actions.delete_confirm_title")}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("leads.actions.delete_confirm_desc")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("common:cancel", "Cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 text-white"
                  onClick={handleDeleteLead}
                >
                  {t("leads.actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Assign Dialog */}
          <Dialog open={bulkAssignOpen} onOpenChange={setBulkAssignOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("leads.bulk_actions.assign_modal.title", {
                    count: selectedCount,
                  })}
                </DialogTitle>
                <DialogDescription>
                  {t("leads.bulk_actions.assign_modal.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label>
                  {t("leads.bulk_actions.assign_modal.select_assignee")}
                </Label>
                <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                  <SelectTrigger className="mt-2">
                    <SelectValue
                      placeholder={t(
                        "leads.bulk_actions.assign_modal.select_assignee"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableMembers.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        {t("leads.bulk_actions.assign_modal.no_members")}
                      </SelectItem>
                    ) : (
                      assignableMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkAssignOpen(false)}
                >
                  {t("common:cancel", "Cancel")}
                </Button>
                <Button
                  onClick={handleBulkAssign}
                  disabled={!bulkAssignee || bulkLoading}
                >
                  {bulkLoading
                    ? t("leads.bulk_actions.assign_modal.assigning")
                    : t("leads.bulk_actions.assign")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Status Change Dialog */}
          <Dialog open={bulkStatusOpen} onOpenChange={setBulkStatusOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("leads.bulk_actions.status_modal.title", {
                    count: selectedCount,
                  })}
                </DialogTitle>
                <DialogDescription>
                  {t("leads.bulk_actions.status_modal.description")}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Label>
                  {t("leads.bulk_actions.status_modal.select_status")}
                </Label>
                <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue
                      placeholder={t(
                        "leads.bulk_actions.status_modal.select_status"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setBulkStatusOpen(false)}
                >
                  {t("common:cancel", "Cancel")}
                </Button>
                <Button
                  onClick={handleBulkStatusChange}
                  disabled={!bulkNewStatus || bulkLoading}
                >
                  {bulkLoading
                    ? t("leads.bulk_actions.status_modal.updating")
                    : t("leads.bulk_actions.status_modal.update")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Bulk Delete AlertDialog */}
          <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t("leads.bulk_actions.delete_modal.title", {
                    count: selectedCount,
                  })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t("leads.bulk_actions.delete_modal.warning", {
                    count: selectedCount,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>
                  {t("common:cancel", "Cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90 text-white"
                  onClick={handleBulkDelete}
                  disabled={bulkLoading}
                >
                  {bulkLoading
                    ? t("leads.bulk_actions.delete_modal.deleting")
                    : t("leads.bulk_actions.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <LeadsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
          <LeadsEditDrawer
            open={editLeadId !== null}
            onOpenChange={(open) => {
              if (!open) setEditLeadId(null);
            }}
            leadId={editLeadId}
          />
        </DataTable>
      </div>
    </div>
  );
}
