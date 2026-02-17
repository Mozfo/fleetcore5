"use client";

import { Filter } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTablePreferences } from "@/hooks/use-table-preferences";

import { LeadsFilterSidebar } from "./leads-filter-sidebar";
import { LeadsKanbanBoardComponent } from "./leads-kanban-board";
import { LeadsCreateDialog } from "./leads-create-dialog";
import { LeadsEditDrawer } from "./leads-edit-drawer";
import {
  CallbackTransitionModal,
  DemoTransitionModal,
  LostToNurturingModal,
  NurturingReactivationModal,
} from "./transition-modals";
import { useLeadsKanban } from "../hooks/use-leads-kanban";

// ── Component ───────────────────────────────────────────────────────

export function LeadsKanbanPage() {
  const { t } = useTranslation("crm");

  // Table preferences (sidebar persistence)
  const { preferences, save: savePreferences } = useTablePreferences("leads");
  const [sidebarOpen, setSidebarOpen] = React.useState(
    preferences.sidebarOpen ?? true
  );
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editLeadId, setEditLeadId] = React.useState<string | null>(null);

  const handleSidebarToggle = React.useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      savePreferences({ sidebarOpen: next });
      return next;
    });
  }, [savePreferences]);

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

  // Determine which transition modal to show based on source status
  const transitionModalType = React.useMemo(() => {
    if (!pendingTransition) return null;
    const { fromStatus, toStatus } = pendingTransition;

    if (fromStatus === "callback_requested") return "callback";
    if (fromStatus === "demo") return "demo";
    if (fromStatus === "lost" && toStatus === "nurturing")
      return "lost_to_nurturing";
    if (fromStatus === "nurturing") return "nurturing_reactivation";
    if (fromStatus === "proposal_sent") return "proposal_sent";

    return null;
  }, [pendingTransition]);

  // For proposal_sent transitions, execute directly (no modal per spec)
  React.useEffect(() => {
    if (transitionModalType === "proposal_sent" && pendingTransition) {
      // proposal_sent transitions are automatic per spec
      // In the kanban, allow direct move to lost/nurturing/converted
      void import("@/lib/actions/crm/lead.actions").then(
        ({ updateLeadStatusAction }) => {
          void import("sonner").then(({ toast }) => {
            void updateLeadStatusAction(
              pendingTransition.leadId,
              pendingTransition.toStatus,
              {
                lossReasonCode:
                  pendingTransition.toStatus === "lost"
                    ? "proposal_rejected"
                    : undefined,
                nurturingReasonCode:
                  pendingTransition.toStatus === "nurturing"
                    ? "proposal_no_response"
                    : undefined,
              }
            ).then((result) => {
              if (result.success) {
                toast.success(t("leads.kanban.transition.success"));
                confirmTransition();
              } else {
                toast.error(result.error || t("leads.kanban.transition.error"));
                cancelTransition();
              }
            });
          });
        }
      );
    }
  }, [
    transitionModalType,
    pendingTransition,
    confirmTransition,
    cancelTransition,
    t,
  ]);

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
          onView={(id) => setEditLeadId(id)}
          onEdit={(id) => setEditLeadId(id)}
        />
      </div>

      {/* Dialogs */}
      <LeadsCreateDialog open={createOpen} onOpenChange={setCreateOpen} />
      <LeadsEditDrawer
        open={editLeadId !== null}
        onOpenChange={(open) => {
          if (!open) setEditLeadId(null);
        }}
        leadId={editLeadId}
      />

      {/* Transition Modals */}
      <CallbackTransitionModal
        open={transitionModalType === "callback"}
        lead={pendingTransition?.lead ?? null}
        onClose={cancelTransition}
        onConfirm={confirmTransition}
      />
      <DemoTransitionModal
        open={transitionModalType === "demo"}
        lead={pendingTransition?.lead ?? null}
        onClose={cancelTransition}
        onConfirm={confirmTransition}
      />
      <LostToNurturingModal
        open={transitionModalType === "lost_to_nurturing"}
        lead={pendingTransition?.lead ?? null}
        onClose={cancelTransition}
        onConfirm={confirmTransition}
      />
      <NurturingReactivationModal
        open={transitionModalType === "nurturing_reactivation"}
        lead={pendingTransition?.lead ?? null}
        onClose={cancelTransition}
        onConfirm={confirmTransition}
      />
    </div>
  );
}
