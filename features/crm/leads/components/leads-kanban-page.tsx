"use client";

import { Filter } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { useInvalidate } from "@refinedev/core";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LeadDrawer } from "@/components/crm/leads/LeadDrawer";
import { DragCompleteProfileDialog } from "@/components/crm/leads/drag-dialogs/DragCompleteProfileDialog";
import { DragQualifyDialog } from "@/components/crm/leads/drag-dialogs/DragQualifyDialog";
import { DragNurturingDialog } from "@/components/crm/leads/drag-dialogs/DragNurturingDialog";
import { DragDisqualifyDialog } from "@/components/crm/leads/drag-dialogs/DragDisqualifyDialog";
import { useTablePreferences } from "@/hooks/use-table-preferences";
import { useSalesOwners } from "@/lib/hooks/useSalesOwners";

import { LeadsFilterSidebar } from "./leads-filter-sidebar";
import { LeadsKanbanBoardComponent } from "./leads-kanban-board";
import { LeadsCreateDialog } from "./leads-create-dialog";
import type { Lead } from "../types/lead.types";
import { useLeadsKanban } from "../hooks/use-leads-kanban";

// ── Drawer state ────────────────────────────────────────────────────

interface DrawerState {
  lead: Lead;
}

// ── Component ───────────────────────────────────────────────────────

interface LeadsKanbanPageProps {
  onOutcomeClick?: (status: string) => void;
}

export function LeadsKanbanPage({ onOutcomeClick }: LeadsKanbanPageProps) {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const invalidate = useInvalidate();

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
    outcomeCounts,
    isLoading,
    handleColumnsChange,
    pendingDrag,
    cancelDrag,
    confirmDrag,
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

  // Open drawer on card click (view mode)
  const handleViewLead = React.useCallback(
    (leadId: string) => {
      const lead = findLeadById(leadId);
      if (lead) setDrawerState({ lead });
    },
    [findLeadById]
  );

  // Close drawer handler
  const handleDrawerClose = React.useCallback(() => {
    setDrawerState(null);
  }, []);

  // ── Drag confirm handler (called by each mini-popup after its API call)

  const handleDragConfirm = React.useCallback(() => {
    confirmDrag();
    void invalidate({ resource: "leads", invalidates: ["list"] });
  }, [confirmDrag, invalidate]);

  return (
    <div className="flex min-h-0 flex-1 gap-4">
      {/* Desktop sidebar */}
      {sidebarOpen && (
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="bg-card sticky top-0 h-[calc(100vh-12rem)] overflow-hidden rounded-lg border shadow-sm">
            <LeadsFilterSidebar />
          </div>
        </aside>
      )}

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
          outcomeCounts={outcomeCounts}
          isLoading={isLoading}
          onColumnsChange={handleColumnsChange}
          onView={handleViewLead}
          onEdit={handleViewLead}
          onOutcomeClick={onOutcomeClick}
        />
      </div>

      {/* Dialogs */}
      <LeadsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />

      {/* 4 contextual drag dialogs */}
      {pendingDrag?.type === "complete_profile" && (
        <DragCompleteProfileDialog
          open
          lead={pendingDrag.lead}
          onConfirm={handleDragConfirm}
          onCancel={cancelDrag}
        />
      )}
      {pendingDrag?.type === "qualify" && (
        <DragQualifyDialog
          open
          lead={pendingDrag.lead}
          onConfirm={handleDragConfirm}
          onCancel={cancelDrag}
        />
      )}
      {pendingDrag?.type === "nurturing" && (
        <DragNurturingDialog
          open
          lead={pendingDrag.lead}
          onConfirm={handleDragConfirm}
          onCancel={cancelDrag}
        />
      )}
      {pendingDrag?.type === "disqualify" && (
        <DragDisqualifyDialog
          open
          lead={pendingDrag.lead}
          onConfirm={handleDragConfirm}
          onCancel={cancelDrag}
        />
      )}

      {/* Lead Drawer (view/edit mode only) */}
      <LeadDrawer
        lead={drawerState?.lead ?? null}
        isOpen={drawerState !== null}
        onClose={handleDrawerClose}
        onOpenFullPage={(id) => router.push(`/${locale}/crm/leads/${id}`)}
        owners={owners}
      />
    </div>
  );
}
