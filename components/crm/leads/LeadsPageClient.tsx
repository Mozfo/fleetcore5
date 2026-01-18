/**
 * LeadsPageClient - Client Component pour filtrage instantané
 *
 * Architecture:
 * - Reçoit TOUS les leads du Server Component (max 100)
 * - Filtre côté client avec useMemo (~5ms)
 * - URL sync avec replaceState (pas de reload)
 * - Optimistic updates pour drag & drop (D5-B)
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LeadsPageHeader } from "./LeadsPageHeader";
import { LeadsFilterBar, type LeadsFilters } from "./LeadsFilterBar";
import { LeadsTable } from "./LeadsTable";
import { TablePagination } from "./TablePagination";
import { KanbanPhaseBoard } from "./KanbanPhaseBoard";
import { LeadFormModal } from "./LeadFormModal";
import { LeadDrawer } from "./LeadDrawer";
import { ConvertToOpportunityModal } from "./ConvertToOpportunityModal";
import { ColumnSelector } from "./ColumnSelector";
import { BulkActionsBar } from "./BulkActionsBar";
import { BulkAssignModal } from "./BulkAssignModal";
import { BulkStatusModal } from "./BulkStatusModal";
import { BulkDeleteModal } from "./BulkDeleteModal";
import {
  StatusChangeReasonModal,
  statusRequiresReason,
  type StatusChangeReasonData,
} from "./StatusChangeReasonModal";
import { calculateStats } from "./utils/lead-utils";
import { useColumnPreferences } from "@/lib/hooks/useColumnPreferences";
import { useAdvancedFilters } from "@/lib/hooks/useAdvancedFilters";
import { useSavedViews } from "@/lib/hooks/useSavedViews";
import { useLeadPhases } from "@/lib/hooks/useLeadPhases";
import {
  DEFAULT_LEADS_COLUMNS,
  generateCsvContent,
} from "@/lib/config/leads-columns";
import {
  bulkAssignLeadsAction,
  bulkUpdateStatusAction,
  bulkDeleteLeadsAction,
} from "@/lib/actions/crm/bulk.actions";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "@/lib/actions/crm/lead.actions";
import type { SavedViewConfig } from "@/lib/types/views";
import type { ViewMode } from "./ViewToggle";
import type {
  Lead,
  KanbanColumn,
  KanbanPhaseColumn,
  LeadStatus,
} from "@/types/crm";

const VIEW_MODE_STORAGE_KEY = "crm_leads_view";

interface LeadsPageClientProps {
  allLeads: Lead[];
  countries: Array<{
    country_code: string;
    country_name_en: string;
    flag_emoji: string;
  }>;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  initialFilters: LeadsFilters;
}

export function LeadsPageClient({
  allLeads,
  countries,
  owners,
  initialFilters,
}: LeadsPageClientProps) {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { t: _t } = useTranslation("crm");

  // Local leads state for optimistic updates (D5-B)
  const [localLeads, setLocalLeads] = useState<Lead[]>(allLeads);

  // Filter state (client-side)
  const [filters, setFilters] = useState<LeadsFilters>(initialFilters);

  // Modal state for creating new lead
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Drawer state for lead quick view (F1-A)
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // G3: Convert Modal state
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Bulk actions modal states (E3)
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // V6.3: Status change reason modal state
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    leadId: string;
    targetStatus: LeadStatus;
    leadName?: string;
  } | null>(null);
  const [isStatusChangeLoading, setIsStatusChangeLoading] = useState(false);

  // Table selection state (E1-A)
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);

  // Table sort state (E1-A)
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination state (E1-A #12)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column preferences (E1-B, E1-D, E1-E)
  const {
    orderedColumns,
    orderedVisibleColumns,
    visibleColumnKeys,
    columnOrder,
    columnWidths,
    toggleColumn,
    reorderColumns,
    resetToDefault,
    getColumnWidth,
    resizeColumn,
    importPreferences,
  } = useColumnPreferences(DEFAULT_LEADS_COLUMNS);

  // Advanced filters (E2-A)
  const {
    filterGroup: advancedFilterGroup,
    isActive: advancedFiltersActive,
    conditionsCount: advancedConditionsCount,
    setLogic: advancedSetLogic,
    reset: advancedReset,
    addCondition: advancedAddCondition,
    updateCondition: advancedUpdateCondition,
    removeCondition: advancedRemoveCondition,
    addGroup: advancedAddGroup,
    updateGroupLogic: advancedUpdateGroupLogic,
    removeGroup: advancedRemoveGroup,
    evaluateLeads,
    importFilterGroup,
  } = useAdvancedFilters();

  // V6.2-11: Lead phases for phase-based Kanban
  const { groupLeadsByPhase } = useLeadPhases();

  // View mode state with localStorage persistence (E1-C)
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

  // Load viewMode from localStorage on mount (SSR-safe)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "kanban" || saved === "table") {
        setViewMode(saved);
      }
    } catch {
      // Silently fail - localStorage not available
    }
  }, []);

  // Handle view mode change with localStorage persistence
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Silently fail - localStorage not available
    }
  }, []);

  // Get current config for saving a view (E2-B)
  const getCurrentConfig = useCallback((): SavedViewConfig => {
    return {
      viewMode,
      advancedFilters: advancedFiltersActive ? advancedFilterGroup : null,
      basicFilters: filters,
      visibleColumns: visibleColumnKeys,
      columnOrder,
      columnWidths,
      sortColumn,
      sortDirection,
    };
  }, [
    viewMode,
    advancedFiltersActive,
    advancedFilterGroup,
    filters,
    visibleColumnKeys,
    columnOrder,
    columnWidths,
    sortColumn,
    sortDirection,
  ]);

  // Apply config from saved view (E2-B)
  const handleApplyConfig = useCallback(
    (config: SavedViewConfig) => {
      // Apply view mode
      setViewMode(config.viewMode);
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, config.viewMode);
      } catch {
        // Silently fail
      }

      // Apply basic filters
      setFilters(config.basicFilters);

      // Apply advanced filters
      importFilterGroup(config.advancedFilters);

      // Apply column preferences
      importPreferences({
        visibleColumns: config.visibleColumns,
        columnOrder: config.columnOrder,
        columnWidths: config.columnWidths,
      });

      // Apply sort
      if (config.sortColumn) {
        setSortColumn(config.sortColumn);
      }
      if (config.sortDirection) {
        setSortDirection(config.sortDirection);
      }
    },
    [importFilterGroup, importPreferences]
  );

  // Saved Views hook (E2-B)
  const {
    views: savedViews,
    activeViewId,
    saveView,
    deleteView,
    setDefaultView,
    applyView,
  } = useSavedViews(handleApplyConfig, getCurrentConfig);

  // Handlers for saved views (E2-B)
  const handleSelectView = useCallback(
    (id: string) => {
      applyView(id);
    },
    [applyView]
  );

  const handleSaveView = useCallback(
    (name: string, isDefault: boolean) => {
      const config = getCurrentConfig();
      saveView({ name, isDefault, config });
    },
    [getCurrentConfig, saveView]
  );

  const handleDeleteView = useCallback(
    (id: string) => {
      deleteView(id);
    },
    [deleteView]
  );

  const handleSetDefaultView = useCallback(
    (id: string) => {
      setDefaultView(id);
    },
    [setDefaultView]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, advancedFilterGroup]);

  // Client-side filtering with useMemo (~3-5ms for 100 leads)
  // Uses localLeads for optimistic updates instead of allLeads
  // Applies both basic filters AND advanced filters (E2-A)
  const filteredLeads = useMemo(() => {
    // First apply basic filters
    const basicFiltered = localLeads.filter((lead) => {
      // Status filter (new, working, qualified, lost)
      if (
        filters.status &&
        filters.status !== "all" &&
        lead.status !== filters.status
      ) {
        return false;
      }

      // Lead stage filter
      if (
        filters.lead_stage &&
        filters.lead_stage !== "all" &&
        lead.lead_stage !== filters.lead_stage
      ) {
        return false;
      }

      // Assigned to filter
      if (filters.assigned_to && filters.assigned_to !== "all") {
        if (filters.assigned_to === "unassigned" && lead.assigned_to !== null) {
          return false;
        }
        if (
          filters.assigned_to !== "unassigned" &&
          lead.assigned_to?.id !== filters.assigned_to
        ) {
          return false;
        }
      }

      // Country filter
      if (
        filters.country_code &&
        filters.country_code !== "all" &&
        lead.country_code !== filters.country_code
      ) {
        return false;
      }

      // Min score filter
      if (
        filters.min_score !== undefined &&
        (lead.qualification_score || 0) < filters.min_score
      ) {
        return false;
      }

      // Search filter (email, company, first_name, last_name)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          lead.email?.toLowerCase().includes(searchLower) ||
          lead.company_name?.toLowerCase().includes(searchLower) ||
          lead.first_name?.toLowerCase().includes(searchLower) ||
          lead.last_name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      return true;
    });

    // Then apply advanced filters (E2-A)
    return evaluateLeads(basicFiltered);
  }, [localLeads, filters, evaluateLeads]);

  // Paginate filtered leads (E1-A #12)
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredLeads.slice(startIndex, endIndex);
  }, [filteredLeads, currentPage, pageSize]);

  // Calculate stats from filtered leads (~1ms)
  const stats = useMemo(() => {
    return calculateStats(filteredLeads);
  }, [filteredLeads]);

  // V6.2-11: Transform filteredLeads into phase-based Kanban columns
  // 5 phases: Acquisition, Qualification, Demo, Closing, Result
  const kanbanPhaseColumns: KanbanPhaseColumn[] = useMemo(() => {
    return groupLeadsByPhase(filteredLeads);
  }, [filteredLeads, groupLeadsByPhase]);

  // Legacy: Transform filteredLeads into Kanban columns (E1-C)
  // Keep for compatibility - will be removed after full migration
  // V6.3: 8 statuts
  const _kanbanColumns: KanbanColumn[] = useMemo(() => {
    const statusConfig: Record<LeadStatus, { title: string; color: string }> = {
      new: { title: "new", color: "gray" },
      demo: { title: "demo", color: "blue" },
      proposal_sent: { title: "proposal_sent", color: "orange" },
      payment_pending: { title: "payment_pending", color: "amber" },
      converted: { title: "converted", color: "green" },
      lost: { title: "lost", color: "red" },
      nurturing: { title: "nurturing", color: "purple" },
      disqualified: { title: "disqualified", color: "gray" },
    };
    const statusOrder: LeadStatus[] = [
      "new",
      "demo",
      "proposal_sent",
      "payment_pending",
      "converted",
      "lost",
      "nurturing",
      "disqualified",
    ];
    return statusOrder.map((status) => {
      const leadsInColumn = filteredLeads.filter(
        (lead) => lead.status === status
      );
      return {
        id: status,
        title: statusConfig[status].title,
        color: statusConfig[status].color,
        leads: leadsInColumn,
        count: leadsInColumn.length,
      };
    });
  }, [filteredLeads]);

  // V6.3: Execute the actual status change (with optional reason)
  const executeStatusChange = useCallback(
    async (
      leadId: string,
      newStatus: LeadStatus,
      reasonData?: StatusChangeReasonData
    ) => {
      // Find the lead to get its current status for potential rollback
      const leadToUpdate = localLeads.find((l) => l.id === leadId);
      const oldStatus = leadToUpdate?.status;

      // Optimistic update: immediately update UI
      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

      // Build options with reason codes if provided
      const options = reasonData
        ? {
            lossReasonCode:
              newStatus === "lost" || newStatus === "disqualified"
                ? reasonData.reasonCode
                : undefined,
            nurturingReasonCode:
              newStatus === "nurturing" ? reasonData.reasonCode : undefined,
            reasonDetail: reasonData.reasonDetail,
          }
        : undefined;

      // Call API to persist status change
      const result = await updateLeadStatusAction(leadId, newStatus, options);

      if (result.success) {
        // Show success toast with appropriate message
        if (newStatus === "lost") {
          toast.success(_t("leads.status_change.lost_success"));
        } else if (newStatus === "converted") {
          toast.success(_t("leads.status_change.converted_success"));
        } else if (newStatus === "nurturing") {
          toast.success(_t("leads.status_change.nurturing_success"));
        } else if (newStatus === "disqualified") {
          toast.success(_t("leads.status_change.disqualified_success"));
        } else {
          toast.success(_t("leads.status_change.success"));
        }
      } else {
        // Rollback on error: restore old status
        if (oldStatus) {
          setLocalLeads((prev) =>
            prev.map((lead) =>
              lead.id === leadId ? { ...lead, status: oldStatus } : lead
            )
          );
        }
        toast.error(result.error || _t("leads.status_change.error"));
      }
    },
    [localLeads, _t]
  );

  // Handle status change from Kanban drag and drop (optimistic update + API persist)
  // V6.3: Check if status requires reason and show modal if needed
  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
      // V6.3: If status requires reason, open modal instead of direct change
      if (statusRequiresReason(newStatus)) {
        const lead = localLeads.find((l) => l.id === leadId);
        setPendingStatusChange({
          leadId,
          targetStatus: newStatus,
          leadName: lead?.company_name || lead?.email || undefined,
        });
        setIsReasonModalOpen(true);
        return;
      }

      // Direct status change for statuses that don't require reason
      await executeStatusChange(leadId, newStatus);
    },
    [localLeads, executeStatusChange]
  );

  // V6.3: Handle reason modal confirmation
  const handleReasonConfirm = useCallback(
    async (reasonData: StatusChangeReasonData) => {
      if (!pendingStatusChange) return;

      setIsStatusChangeLoading(true);
      try {
        await executeStatusChange(
          pendingStatusChange.leadId,
          pendingStatusChange.targetStatus,
          reasonData
        );
      } finally {
        setIsStatusChangeLoading(false);
        setIsReasonModalOpen(false);
        setPendingStatusChange(null);
      }
    },
    [pendingStatusChange, executeStatusChange]
  );

  // V6.3: Handle reason modal close
  const handleReasonModalClose = useCallback(() => {
    setIsReasonModalOpen(false);
    setPendingStatusChange(null);
  }, []);

  // Handle filter changes - NO router.push, just state update + URL sync
  const handleFiltersChange = useCallback(
    (newFilters: LeadsFilters) => {
      // Update local state (triggers useMemo re-computation)
      setFilters(newFilters);

      // Sync URL with replaceState (no page reload)
      const searchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });

      const newUrl = searchParams.toString()
        ? `/${locale}/crm/leads?${searchParams}`
        : `/${locale}/crm/leads`;

      // Update URL without reload
      window.history.replaceState(null, "", newUrl);
    },
    [locale]
  );

  // Handle card click - opens drawer for quick view (F1-A)
  const handleCardClick = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) {
        setDrawerLead(lead);
        setIsDrawerOpen(true);
      }
    },
    [localLeads]
  );

  // Handle opening full page from drawer (F1-A)
  const handleOpenFullPage = useCallback(
    (leadId: string) => {
      setIsDrawerOpen(false);
      router.push(`/${locale}/crm/leads/${leadId}`);
    },
    [locale, router]
  );

  // Handle double-click on card/row - navigate directly to full page (Accessibility)
  const handleCardDoubleClick = useCallback(
    (leadId: string) => {
      router.push(`/${locale}/crm/leads/${leadId}`);
    },
    [locale, router]
  );

  const handleCreateLead = () => {
    setIsModalOpen(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality in future sprint
  };

  const handleSettings = () => {
    // TODO: Implement settings functionality in future sprint
  };

  // Handle lead updated from drawer edit mode (F1-B)
  const handleLeadUpdated = useCallback(
    (updatedLead: Lead) => {
      // Update local leads for optimistic display
      setLocalLeads((prev) =>
        prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );
      // Update drawer lead if it's the same
      if (drawerLead?.id === updatedLead.id) {
        setDrawerLead(updatedLead);
      }
    },
    [drawerLead?.id]
  );

  // G3: Handle convert success
  const handleConvertSuccess = useCallback(
    (result: { lead: Lead; opportunity: Record<string, unknown> }) => {
      // Update local leads for optimistic display
      setLocalLeads((prev) =>
        prev.map((lead) => (lead.id === result.lead.id ? result.lead : lead))
      );
      // Update drawer lead if it's the same
      if (drawerLead?.id === result.lead.id) {
        setDrawerLead(result.lead);
      }
      // Update convert lead state
      setConvertLead(null);
    },
    [drawerLead?.id]
  );

  // Handle inline assignment from table row
  const handleAssign = useCallback(
    async (leadId: string, assigneeId: string | null) => {
      // Find the assignee for optimistic update
      const assignee = assigneeId
        ? owners.find((o) => o.id === assigneeId)
        : null;

      // Optimistic update
      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                assigned_to: assignee ? { ...assignee, email: "" } : null,
              }
            : lead
        )
      );

      // Call server action
      const result = await updateLeadAction(leadId, {
        assigned_to_id: assigneeId,
      });
      if (result.success) {
        toast.success(_t("leads.drawer.save_success"));
      } else {
        // Revert on error
        setLocalLeads((prev) =>
          prev.map((lead) => {
            if (lead.id === leadId) {
              const originalLead = allLeads.find((l) => l.id === leadId);
              return originalLead || lead;
            }
            return lead;
          })
        );
        toast.error(result.error || _t("leads.drawer.save_error"));
      }
    },
    [owners, allLeads, _t]
  );

  // Handle lead actions (E4: Context Menu)
  const handleEditLead = useCallback(
    (_leadId: string) => {
      // TODO: Open edit modal or navigate to edit page
      toast.info(_t("leads.actions.edit_coming_soon"));
    },
    [_t]
  );

  const handleConvertLead = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) {
        setConvertLead(lead);
        setIsConvertModalOpen(true);
      }
    },
    [localLeads]
  );

  const handleDeleteLead = useCallback(
    (_leadId: string) => {
      // TODO: Show delete confirmation modal
      toast.info(_t("leads.actions.delete_coming_soon"));
    },
    [_t]
  );

  // Handle sort change (E1-A)
  const handleSortChange = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setSortColumn(column);
      setSortDirection(direction);
    },
    []
  );

  const handleLeadCreated = useCallback((newLead: Lead) => {
    // Ajouter le nouveau lead au state local pour affichage immédiat
    setLocalLeads((prev) => [newLead, ...prev]);
    setIsModalOpen(false);
  }, []);

  // ==================== BULK ACTIONS (E3) ====================

  // Bulk assign leads
  const handleBulkAssign = useCallback(
    async (assigneeId: string) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkAssignLeadsAction(selectedLeadIds, assigneeId);
        if (result.success) {
          // Optimistic update: update local leads with new assignee
          const assignee = owners.find((o) => o.id === assigneeId);
          if (assignee) {
            setLocalLeads((prev) =>
              prev.map((lead) =>
                selectedLeadIds.includes(lead.id)
                  ? {
                      ...lead,
                      assigned_to: assignee,
                      assigned_to_id: assigneeId,
                    }
                  : lead
              )
            );
          }
          toast.success(
            _t("leads.bulk_actions.toast.assign_success", {
              count: result.successCount,
            })
          );
          setSelectedLeadIds([]);
          setIsBulkAssignOpen(false);
        } else {
          toast.error(_t("leads.bulk_actions.toast.assign_error"));
        }
      } catch {
        toast.error(_t("leads.bulk_actions.toast.assign_error"));
      } finally {
        setIsBulkLoading(false);
      }
    },
    [selectedLeadIds, owners, _t]
  );

  // Bulk update status
  const handleBulkStatus = useCallback(
    async (status: LeadStatus) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkUpdateStatusAction(selectedLeadIds, status);
        if (result.success) {
          // Optimistic update: update local leads with new status
          setLocalLeads((prev) =>
            prev.map((lead) =>
              selectedLeadIds.includes(lead.id) ? { ...lead, status } : lead
            )
          );
          toast.success(
            _t("leads.bulk_actions.toast.status_success", {
              count: result.successCount,
            })
          );
          setSelectedLeadIds([]);
          setIsBulkStatusOpen(false);
        } else {
          toast.error(_t("leads.bulk_actions.toast.status_error"));
        }
      } catch {
        toast.error(_t("leads.bulk_actions.toast.status_error"));
      } finally {
        setIsBulkLoading(false);
      }
    },
    [selectedLeadIds, _t]
  );

  // Bulk delete leads
  const handleBulkDelete = useCallback(
    async (reason: string) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkDeleteLeadsAction(selectedLeadIds, reason);
        if (result.success) {
          // Remove deleted leads from local state
          setLocalLeads((prev) =>
            prev.filter((lead) => !selectedLeadIds.includes(lead.id))
          );
          toast.success(
            _t("leads.bulk_actions.toast.delete_success", {
              count: result.successCount,
            })
          );
          setSelectedLeadIds([]);
          setIsBulkDeleteOpen(false);
        } else {
          toast.error(_t("leads.bulk_actions.toast.delete_error"));
        }
      } catch {
        toast.error(_t("leads.bulk_actions.toast.delete_error"));
      } finally {
        setIsBulkLoading(false);
      }
    },
    [selectedLeadIds, _t]
  );

  // Bulk export - visible columns only, in table order, with i18n headers
  const handleBulkExport = useCallback(() => {
    // Get selected leads
    const selectedLeads = localLeads.filter((lead) =>
      selectedLeadIds.includes(lead.id)
    );

    // Get visible column keys in table order
    const orderedColumnKeys = orderedVisibleColumns.map((col) => col.key);

    // Generate CSV with visible columns in table order + i18n headers
    const csvContent = generateCsvContent(selectedLeads, orderedColumnKeys, _t);

    // Download CSV with BOM for Excel UTF-8 compatibility
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads-export-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    toast.success(_t("leads.bulk_actions.toast.export_success"));
  }, [localLeads, selectedLeadIds, orderedVisibleColumns, _t]);

  // Clear selection
  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds([]);
  }, []);

  return (
    <>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {/* Sticky Header Section - Non-scrolling, constrained width to prevent overflow when table columns are resized */}
        <div className="max-w-full shrink-0 space-y-4 overflow-x-hidden border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
          {/* Page Header with Stats */}
          <LeadsPageHeader
            stats={stats}
            onNewLead={handleCreateLead}
            onExport={handleExport}
            onSettings={handleSettings}
          />

          {/* Filters Bar with View Toggle (E1-C) + Advanced Filters (E2-A) */}
          <LeadsFilterBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            countries={countries}
            owners={owners}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            // Advanced filters (E2-A)
            advancedFilterGroup={advancedFilterGroup}
            advancedFiltersActive={advancedFiltersActive}
            advancedConditionsCount={advancedConditionsCount}
            onAdvancedSetLogic={advancedSetLogic}
            onAdvancedReset={advancedReset}
            onAdvancedAddCondition={advancedAddCondition}
            onAdvancedUpdateCondition={advancedUpdateCondition}
            onAdvancedRemoveCondition={advancedRemoveCondition}
            onAdvancedAddGroup={advancedAddGroup}
            onAdvancedUpdateGroupLogic={advancedUpdateGroupLogic}
            onAdvancedRemoveGroup={advancedRemoveGroup}
            // Saved Views (E2-B)
            savedViews={savedViews}
            activeViewId={activeViewId}
            onSelectView={handleSelectView}
            onSaveView={handleSaveView}
            onDeleteView={handleDeleteView}
            onSetDefaultView={handleSetDefaultView}
            getCurrentConfig={getCurrentConfig}
          />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Conditional rendering based on viewMode (E1-C) */}
          {viewMode === "kanban" ? (
            /* V6.2-11: Phase-based Kanban Board (5 columns) */
            <div className="p-6">
              <KanbanPhaseBoard
                columns={kanbanPhaseColumns}
                onCardClick={handleCardClick}
                onCardDoubleClick={handleCardDoubleClick}
                onCreate={handleCreateLead}
                onStatusChange={handleStatusChange}
                onEdit={handleEditLead}
                onConvert={handleConvertLead}
                onDelete={handleDeleteLead}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Column Selector (E1-B, E1-D) - Table view only */}
              <div className="flex shrink-0 justify-end border-b border-gray-200 bg-gray-50 px-6 py-2 dark:border-gray-800 dark:bg-gray-900">
                <ColumnSelector
                  columns={orderedColumns}
                  onToggle={toggleColumn}
                  onReset={resetToDefault}
                  onReorder={reorderColumns}
                />
              </div>

              {/* Leads Table (E1-A, E1-D, E1-E) with sticky header */}
              <div className="flex-1 overflow-auto">
                <LeadsTable
                  leads={paginatedLeads}
                  selectedIds={selectedLeadIds}
                  onSelectionChange={setSelectedLeadIds}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSortChange={handleSortChange}
                  onRowClick={handleCardClick}
                  onRowDoubleClick={handleCardDoubleClick}
                  onCreate={handleCreateLead}
                  visibleColumnKeys={visibleColumnKeys}
                  orderedVisibleColumns={orderedVisibleColumns}
                  getColumnWidth={getColumnWidth}
                  onColumnResize={resizeColumn}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditLead}
                  onConvert={handleConvertLead}
                  onDelete={handleDeleteLead}
                  onAssign={handleAssign}
                  owners={owners}
                />
              </div>

              {/* Pagination (E1-A #12) - Fixed at bottom */}
              <div className="shrink-0 border-t border-gray-200 dark:border-gray-800">
                <TablePagination
                  currentPage={currentPage}
                  pageSize={pageSize}
                  totalItems={filteredLeads.length}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Creation Modal */}
      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLeadCreated}
        countries={countries}
        owners={owners}
      />

      {/* Bulk Actions Bar (E3) - Floating bar when items selected */}
      <BulkActionsBar
        selectedCount={selectedLeadIds.length}
        onAssign={() => setIsBulkAssignOpen(true)}
        onChangeStatus={() => setIsBulkStatusOpen(true)}
        onExport={handleBulkExport}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onClearSelection={handleClearSelection}
      />

      {/* Bulk Assign Modal (E3) */}
      <BulkAssignModal
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onConfirm={handleBulkAssign}
        selectedCount={selectedLeadIds.length}
        teamMembers={owners}
        isLoading={isBulkLoading}
      />

      {/* Bulk Status Modal (E3) */}
      <BulkStatusModal
        isOpen={isBulkStatusOpen}
        onClose={() => setIsBulkStatusOpen(false)}
        onConfirm={handleBulkStatus}
        selectedCount={selectedLeadIds.length}
        isLoading={isBulkLoading}
      />

      {/* Bulk Delete Modal (E3) */}
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedLeadIds.length}
        isLoading={isBulkLoading}
      />

      {/* Lead Quick View Drawer (F1-A) with Edit Mode (F1-B) */}
      <LeadDrawer
        lead={drawerLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onDelete={handleDeleteLead}
        onOpenFullPage={handleOpenFullPage}
        onLeadUpdated={handleLeadUpdated}
        owners={owners}
      />

      {/* G3: Convert to Opportunity Modal */}
      {convertLead && (
        <ConvertToOpportunityModal
          lead={convertLead}
          isOpen={isConvertModalOpen}
          onClose={() => {
            setIsConvertModalOpen(false);
            setConvertLead(null);
          }}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* V6.3: Status Change Reason Modal */}
      {pendingStatusChange && (
        <StatusChangeReasonModal
          isOpen={isReasonModalOpen}
          onClose={handleReasonModalClose}
          onConfirm={handleReasonConfirm}
          targetStatus={pendingStatusChange.targetStatus}
          leadName={pendingStatusChange.leadName}
          isLoading={isStatusChangeLoading}
        />
      )}
    </>
  );
}
