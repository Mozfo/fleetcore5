"use client";

import { Download, FileSpreadsheet, Filter, Plus, Users } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { BulkActionsBar } from "@/components/crm/leads/BulkActionsBar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable, type TableDensity } from "@/components/ui/table/data-table";
import { DataTableDensityToggle } from "@/components/ui/table/data-table-density-toggle";
import { DataTableSkeleton } from "@/components/ui/table/data-table-skeleton";
import { DataTableToolbar } from "@/components/ui/table/data-table-toolbar";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
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
  const { statuses, isLoading: statusesLoading } = useLeadStatuses();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editLeadId, setEditLeadId] = React.useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  // Table preferences (localStorage persistence)
  const { preferences, save: savePreferences } = useTablePreferences("leads");
  const [density, setDensity] = React.useState<TableDensity>(
    preferences.density ?? "normal"
  );
  const [sidebarOpen, setSidebarOpen] = React.useState(
    preferences.sidebarOpen ?? true
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

  const columns = React.useMemo(
    () => getLeadColumns(t, statuses, (id) => setEditLeadId(id)),
    [t, statuses]
  );

  const { table, isLoading, isError, total } = useLeadsTable({
    columns,
    savedColumnVisibility: preferences.columnVisibility,
  });

  React.useEffect(() => {
    onTotalChange?.(total);
  }, [total, onTotalChange]);

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
          renderExpandedRow={(row) => <LeadExpandedRow lead={row.original} />}
          getRowClassName={(row) => computeRowIndicator(row.original)}
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
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 size-4" />
              {t("leads.actions.new_lead")}
            </Button>
          </DataTableToolbar>

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
