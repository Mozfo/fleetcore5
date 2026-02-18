"use client";

import { Filter } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LeadDrawer } from "@/components/crm/leads/LeadDrawer";
import { cn } from "@/lib/utils";
import { useTablePreferences } from "@/hooks/use-table-preferences";
import { useSalesOwners } from "@/lib/hooks/useSalesOwners";

import { LeadsFilterSidebar } from "./leads-filter-sidebar";
import { LeadsKanbanBoardComponent } from "./leads-kanban-board";
import { LeadsCreateDialog } from "./leads-create-dialog";
import type { Lead } from "../types/lead.types";
import {
  useLeadsKanban,
  type PendingTransition,
} from "../hooks/use-leads-kanban";

// ── Drawer state ────────────────────────────────────────────────────

interface DrawerState {
  lead: Lead;
  transition: PendingTransition | null;
}

// ── Component ───────────────────────────────────────────────────────

export function LeadsKanbanPage() {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // Table preferences (sidebar persistence)
  const { preferences, save: savePreferences } = useTablePreferences("leads");
  const [sidebarOpen, setSidebarOpen] = React.useState(
    preferences.sidebarOpen ?? true
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [drawerState, setDrawerState] = React.useState<DrawerState | null>(
    null
  );

  const handleSidebarToggle = React.useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      savePreferences({ sidebarOpen: next });
      return next;
    });
  }, [savePreferences]);

  // Sales owners for assignment dropdown
  const { owners } = useSalesOwners();

  // Kanban hook
  const {
    columns,
    columnOrder,
    isLoading,
    handleColumnsChange,
    pendingTransition,
    cancelTransition,
    confirmTransition,
  } = useLeadsKanban();

  // Helper: find lead by ID across all columns
  const findLeadById = React.useCallback(
    (leadId: string): Lead | undefined => {
      for (const status of columnOrder) {
        const found = columns[status]?.find((l) => l.id === leadId);
        if (found) return found;
      }
      return undefined;
    },
    [columns, columnOrder]
  );

  // Open drawer on card click (view mode, no transition)
  const handleViewLead = React.useCallback(
    (leadId: string) => {
      const lead = findLeadById(leadId);
      if (lead) setDrawerState({ lead, transition: null });
    },
    [findLeadById]
  );

  // Open drawer on drag & drop transition
  React.useEffect(() => {
    if (pendingTransition) {
      setDrawerState({
        lead: pendingTransition.lead,
        transition: pendingTransition,
      });
    }
  }, [pendingTransition]);

  // Close drawer handler
  const handleDrawerClose = React.useCallback(() => {
    if (drawerState?.transition) cancelTransition();
    setDrawerState(null);
  }, [drawerState?.transition, cancelTransition]);

  // Transition confirmed
  const handleTransitionComplete = React.useCallback(() => {
    confirmTransition();
    setDrawerState(null);
  }, [confirmTransition]);

  // Transition cancelled
  const handleTransitionCancel = React.useCallback(() => {
    cancelTransition();
    setDrawerState(null);
  }, [cancelTransition]);

  return (
    <div className="flex min-h-0 flex-1 gap-4 p-4">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 md:block",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <div className="bg-card sticky top-0 h-[calc(100vh-12rem)] overflow-hidden rounded-lg border shadow-sm">
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

      {/* Board area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="mb-3 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden h-8 md:inline-flex"
            onClick={handleSidebarToggle}
          >
            <Filter className="mr-2 size-4" />
            {t("leads.filters.advanced")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 md:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <Filter className="size-4" />
          </Button>
        </div>

        {/* Kanban board */}
        <LeadsKanbanBoardComponent
          columns={columns}
          columnOrder={columnOrder}
          isLoading={isLoading}
          onColumnsChange={handleColumnsChange}
          onView={handleViewLead}
          onEdit={handleViewLead}
        />
      </div>

      {/* Dialogs */}
      <LeadsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* Lead Drawer (replaces both edit drawer and transition modals) */}
      <LeadDrawer
        lead={drawerState?.lead ?? null}
        isOpen={drawerState !== null}
        onClose={handleDrawerClose}
        onOpenFullPage={(id) => router.push(`/${locale}/crm/leads/${id}`)}
        owners={owners}
        transition={drawerState?.transition ?? null}
        onTransitionComplete={handleTransitionComplete}
        onTransitionCancel={handleTransitionCancel}
      />
    </div>
  );
}
