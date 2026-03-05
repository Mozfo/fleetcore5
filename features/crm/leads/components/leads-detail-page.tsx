"use client";

import {
  Download,
  FileSpreadsheet,
  Filter,
  UserPlus,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BulkActionsBar } from "./BulkActionsBar";
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

import { getLeadDetailColumns } from "./lead-detail-columns";
import { LeadExpandedRow } from "./lead-expanded-row";
import { DisqualifyLeadModal } from "@/components/crm/leads/DisqualifyLeadModal";
import { LeadsFilterSidebar } from "./leads-filter-sidebar";
import { LeadsDetailKpiHeader } from "./leads-detail-kpi-header";
import { useLeadsTable } from "../hooks/use-leads-table";
import { computeRowIndicator } from "../lib/lead-insight";
import type { Lead } from "../types/lead.types";
import type { VisibilityState } from "@tanstack/react-table";

// ── Manager default column visibility ────────────────────────────────────
// All columns from useLeadsTable's DEFAULT_COLUMN_VISIBILITY are hidden,
// then we explicitly show the 16 manager columns + computed columns.
const MANAGER_DEFAULT_VISIBILITY: VisibilityState = {
  // Hide everything that Pipeline hides
  id: false,
  source_id: false,
  utm_source: false,
  utm_medium: false,
  utm_campaign: false,
  message: false,
  consent_at: false,
  consent_ip: false,
  qualified_date: false,
  converted_date: false,
  opportunity_id: false,
  metadata: false,
  stripe_checkout_session_id: false,
  stripe_payment_link_url: false,
  payment_link_created_at: false,
  payment_link_expires_at: false,
  deleted_at: false,
  deleted_by: false,
  deletion_reason: false,
  created_by: false,
  stage_entered_at: false,
  loss_reason_code: false,
  loss_reason_detail: false,
  competitor_name: false,
  platforms_used: false,
  tenant_id: false,
  converted_at: false,
  email_verified: false,
  email_verification_code: false,
  email_verification_expires_at: false,
  email_verification_attempts: false,
  detected_country_code: false,
  ip_address: false,
  language: false,
  callback_completed_at: false,
  callback_notes: false,
  disqualified_at: false,
  disqualification_reason: false,
  disqualification_comment: false,
  disqualified_by: false,
  recovery_notification_sent_at: false,
  recovery_notification_clicked_at: false,
  // Also hide Pipeline-visible columns that are NOT in manager default set
  phone: false,
  last_name: false,
  current_software: false,
  website_url: false,
  city: false,
  gdpr_consent: false,
  updated_by: false,
  callback_requested: false,
  callback_requested_at: false,
  wizard_completed: false,
};

export function LeadsDetailPage() {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const { localizedPath } = useLocalizedPath();
  const { statuses, isLoading: statusesLoading } = useLeadStatuses();
  const [assignLeadId, setAssignLeadId] = React.useState<string | null>(null);
  const [disqualifyLeadId, setDisqualifyLeadId] = React.useState<string | null>(
    null
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Bulk action states
  const [bulkAssignOpen, setBulkAssignOpen] = React.useState(false);
  const [bulkAssignee, setBulkAssignee] = React.useState("");
  const [bulkLoading, setBulkLoading] = React.useState(false);
  const [assignableMembers, setAssignableMembers] = React.useState<
    { id: string; name: string }[]
  >([]);

  // Single assign dialog state
  const [singleAssignee, setSingleAssignee] = React.useState("");
  const [singleAssignLoading, setSingleAssignLoading] = React.useState(false);

  // Table preferences (separate localStorage key from Pipeline)
  const { preferences, save: savePreferences } =
    useTablePreferences("leads-detail");
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
      getLeadDetailColumns(
        t,
        statuses,
        localizedPath,
        (id) => setAssignLeadId(id),
        (id) => setDisqualifyLeadId(id)
      ),
    [t, statuses, localizedPath]
  );

  const { table, isLoading, isError, total } = useLeadsTable({
    columns,
    initialPageSize: 50,
    savedColumnVisibility:
      preferences.columnVisibility ?? MANAGER_DEFAULT_VISIBILITY,
    extraFields: [
      "bant_budget",
      "bant_authority",
      "bant_need",
      "bant_timeline",
      "updated_at",
    ],
  });

  // Sync expand toggle with table state
  React.useEffect(() => {
    table.getColumn("expand")?.toggleVisibility(expandEnabled);
    if (!expandEnabled) table.toggleAllRowsExpanded(false);
  }, [expandEnabled, table]);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  // ── Row click → navigate to lead profile ───────────────────────────────
  const handleRowClick = React.useCallback(
    (row: { original: Lead }) => {
      router.push(localizedPath(`/crm/leads/${row.original.id}`));
    },
    [router, localizedPath]
  );

  // ── Single assign handler ──────────────────────────────────────────────
  const handleSingleAssign = React.useCallback(async () => {
    if (!assignLeadId || !singleAssignee) return;
    setSingleAssignLoading(true);
    try {
      const res = await fetch(`/api/v1/crm/leads/${assignLeadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigned_to: singleAssignee }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(t("leads.bulk_actions.toast.assign_success", { count: 1 }));
    } catch {
      toast.error(t("leads.bulk_actions.toast.assign_error"));
    } finally {
      setSingleAssignLoading(false);
      setAssignLeadId(null);
      setSingleAssignee("");
    }
  }, [assignLeadId, singleAssignee, t]);

  // Load members for assign dialogs
  const loadAssignableMembers = React.useCallback(async () => {
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
  }, []);

  // Load members when assign dialog opens
  React.useEffect(() => {
    if (assignLeadId) {
      void loadAssignableMembers();
    }
  }, [assignLeadId, loadAssignableMembers]);

  // ── Disqualify lead (via modal) ────────────────────────────────────────
  const disqualifyLead = React.useMemo<Lead | null>(() => {
    if (!disqualifyLeadId) return null;
    const row = table
      .getRowModel()
      .rows.find((r) => r.original.id === disqualifyLeadId);
    return row?.original ?? ({ id: disqualifyLeadId } as Lead);
  }, [disqualifyLeadId, table]);

  // ── Bulk actions ───────────────────────────────────────────────────────
  const getSelectedIds = React.useCallback(
    () => table.getFilteredSelectedRowModel().rows.map((r) => r.original.id),
    [table]
  );

  const handleBulkAssignOpen = React.useCallback(async () => {
    await loadAssignableMembers();
    setBulkAssignee("");
    setBulkAssignOpen(true);
  }, [loadAssignableMembers]);

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

  const handleBulkExport = React.useCallback(() => {
    exportTableToCSV(table, {
      filename: "leads-detail-selection",
      onlySelected: true,
    });
    toast.success(t("leads.bulk_actions.toast.export_success"));
  }, [table, t]);

  // ── Loading / Error / Empty states ─────────────────────────────────────
  if (statusesLoading || isLoading) {
    return <DataTableSkeleton columnCount={16} filterCount={3} rowCount={10} />;
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
      />
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* KPI Header */}
      <LeadsDetailKpiHeader />

      {/* Main content: sidebar + table */}
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
            onRowClick={handleRowClick}
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
                onExport={handleBulkExport}
                onClearSelection={() => table.toggleAllRowsSelected(false)}
              />
            }
          >
            <DataTableToolbar table={table}>
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
                    filename: "leads-detail",
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
                    filename: "leads-detail",
                    onlySelected: selectedCount > 0,
                  })
                }
              >
                <FileSpreadsheet className="mr-2 size-4" />
                Excel
              </Button>
            </DataTableToolbar>

            {/* Single Assign Dialog */}
            <Dialog
              open={assignLeadId !== null}
              onOpenChange={(open) => {
                if (!open) {
                  setAssignLeadId(null);
                  setSingleAssignee("");
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("leads_detail.actions.assign", {
                      defaultValue: "Assign Lead",
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
                  <Select
                    value={singleAssignee}
                    onValueChange={setSingleAssignee}
                  >
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
                    onClick={() => {
                      setAssignLeadId(null);
                      setSingleAssignee("");
                    }}
                  >
                    {t("common:cancel", "Cancel")}
                  </Button>
                  <Button
                    onClick={handleSingleAssign}
                    disabled={!singleAssignee || singleAssignLoading}
                  >
                    <UserPlus className="mr-2 size-4" />
                    {singleAssignLoading
                      ? t("leads.bulk_actions.assign_modal.assigning")
                      : t("leads_detail.actions.assign", {
                          defaultValue: "Assign",
                        })}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

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

            {/* Disqualify Modal */}
            {disqualifyLead && (
              <DisqualifyLeadModal
                isOpen={disqualifyLeadId !== null}
                onClose={() => setDisqualifyLeadId(null)}
                lead={disqualifyLead}
                onSuccess={() => {
                  setDisqualifyLeadId(null);
                  toast.success(
                    t("leads.actions.disqualified", {
                      defaultValue: "Lead disqualified",
                    })
                  );
                }}
              />
            )}
          </DataTable>
        </div>
      </div>
    </div>
  );
}
