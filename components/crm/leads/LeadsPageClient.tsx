/**
 * LeadsPageClient - Client Component pour filtrage instantané
 *
 * V6.6.1 REFONTE LAYOUT:
 * - Compact header (48px) with Filters button + actions
 * - Quick filters bar (always visible)
 * - Filter Sheet (right drawer on demand)
 * - Kanban fullscreen (~90% viewport)
 * - Lead popup Dialog instead of drawer (on card click)
 *
 * Architecture:
 * - Reçoit TOUS les leads du Server Component (max 100)
 * - Filtre côté client avec useMemo (~5ms)
 * - URL sync avec replaceState (pas de reload)
 * - Optimistic updates pour drag & drop (D5-B)
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Plus, Download, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ViewToggle, type ViewMode } from "./ViewToggle";
import { LeadsFilterBar, type LeadsFilters } from "./LeadsFilterBar";
import { LeadsTable } from "./LeadsTable";
import { TablePagination } from "./TablePagination";
import { KanbanPhaseBoard } from "./KanbanPhaseBoard";
import { LeadFormModal } from "./LeadFormModal";
import { LeadWorkspaceDialog } from "./LeadWorkspaceDialog";
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
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { DisqualifyLeadModal } from "./DisqualifyLeadModal";
import type { SavedViewConfig } from "@/lib/types/views";
import type { Lead, KanbanPhaseColumn, LeadStatus } from "@/types/crm";

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
  onViewModeChange?: (mode: ViewMode) => void;
}

export function LeadsPageClient({
  allLeads,
  countries,
  owners,
  initialFilters,
  onViewModeChange,
}: LeadsPageClientProps) {
  const params = useParams();
  const locale = params.locale as string;
  const { t: _t } = useTranslation("crm");

  // Local leads state for optimistic updates (D5-B)
  const [localLeads, setLocalLeads] = useState<Lead[]>(allLeads);

  // Filter state (client-side)
  const [filters, setFilters] = useState<LeadsFilters>(initialFilters);

  // Modal state for creating new lead
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lead Workspace Dialog state (replaces drawer)
  const [workspaceLead, setWorkspaceLead] = useState<Lead | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // G3: Convert Modal state
  const [convertLead, setConvertLead] = useState<Lead | null>(null);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Bulk actions modal states (E3)
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // G4: Single delete modal state
  const [deleteTargetLead, setDeleteTargetLead] = useState<Lead | null>(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // T12: Disqualify modal state
  const [disqualifyTargetLead, setDisqualifyTargetLead] = useState<Lead | null>(
    null
  );

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
    conditionsCount: _advancedConditionsCount,
    setLogic: _advancedSetLogic,
    reset: advancedReset,
    addCondition: _advancedAddCondition,
    updateCondition: _advancedUpdateCondition,
    removeCondition: _advancedRemoveCondition,
    addGroup: _advancedAddGroup,
    updateGroupLogic: _advancedUpdateGroupLogic,
    removeGroup: _advancedRemoveGroup,
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
  const handleViewModeChange = useCallback(
    (mode: ViewMode) => {
      setViewMode(mode);
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
      } catch {
        // Silently fail - localStorage not available
      }
      onViewModeChange?.(mode);
    },
    [onViewModeChange]
  );

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
      setViewMode(config.viewMode);
      try {
        localStorage.setItem(VIEW_MODE_STORAGE_KEY, config.viewMode);
      } catch {
        // Silently fail
      }
      setFilters(config.basicFilters);
      importFilterGroup(config.advancedFilters);
      importPreferences({
        visibleColumns: config.visibleColumns,
        columnOrder: config.columnOrder,
        columnWidths: config.columnWidths,
      });
      if (config.sortColumn) setSortColumn(config.sortColumn);
      if (config.sortDirection) setSortDirection(config.sortDirection);
    },
    [importFilterGroup, importPreferences]
  );

  // Saved Views hook (E2-B)
  const {
    views: _savedViews,
    activeViewId: _activeViewId,
    saveView,
    deleteView,
    setDefaultView,
    applyView,
  } = useSavedViews(handleApplyConfig, getCurrentConfig);

  const _handleSelectView = useCallback(
    (id: string) => applyView(id),
    [applyView]
  );
  const _handleSaveView = useCallback(
    (name: string, isDefault: boolean) => {
      const config = getCurrentConfig();
      saveView({ name, isDefault, config });
    },
    [getCurrentConfig, saveView]
  );
  const _handleDeleteView = useCallback(
    (id: string) => deleteView(id),
    [deleteView]
  );
  const _handleSetDefaultView = useCallback(
    (id: string) => setDefaultView(id),
    [setDefaultView]
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, advancedFilterGroup]);

  // Client-side filtering with useMemo
  const filteredLeads = useMemo(() => {
    const basicFiltered = localLeads.filter((lead) => {
      if (
        filters.status &&
        filters.status !== "all" &&
        lead.status !== filters.status
      )
        return false;
      if (
        filters.lead_stage &&
        filters.lead_stage !== "all" &&
        lead.lead_stage !== filters.lead_stage
      )
        return false;
      if (filters.assigned_to && filters.assigned_to !== "all") {
        if (filters.assigned_to === "unassigned" && lead.assigned_to !== null)
          return false;
        if (
          filters.assigned_to !== "unassigned" &&
          lead.assigned_to?.id !== filters.assigned_to
        )
          return false;
      }
      if (
        filters.country_code &&
        filters.country_code !== "all" &&
        lead.country_code !== filters.country_code
      )
        return false;
      if (
        filters.min_score !== undefined &&
        (lead.qualification_score || 0) < filters.min_score
      )
        return false;
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
    return evaluateLeads(basicFiltered);
  }, [localLeads, filters, evaluateLeads]);

  // Paginate filtered leads
  const paginatedLeads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredLeads.slice(startIndex, startIndex + pageSize);
  }, [filteredLeads, currentPage, pageSize]);

  // Calculate stats for header metrics
  const stats = useMemo(() => calculateStats(filteredLeads), [filteredLeads]);

  // Header metrics (Salesforce-style)
  const headerStats = useMemo(() => {
    const total = filteredLeads.length;
    const qualified = filteredLeads.filter(
      (l) =>
        l.lead_stage === "sales_qualified" ||
        l.lead_stage === "marketing_qualified"
    ).length;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = filteredLeads.filter(
      (l) => new Date(l.created_at) >= weekAgo
    ).length;
    const scores = filteredLeads
      .map((l) => l.qualification_score)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;
    const converted = filteredLeads.filter(
      (l) => l.status === "converted"
    ).length;
    return { total, qualified, thisWeek, avgScore, converted };
  }, [filteredLeads]);

  // Phase-based Kanban columns
  const kanbanPhaseColumns: KanbanPhaseColumn[] = useMemo(
    () => groupLeadsByPhase(filteredLeads),
    [filteredLeads, groupLeadsByPhase]
  );

  // All filtered lead IDs for popup prev/next navigation
  const allFilteredLeadIds = useMemo(
    () => filteredLeads.map((l) => l.id),
    [filteredLeads]
  );

  // ==================== STATUS CHANGE HANDLERS ====================

  const executeStatusChange = useCallback(
    async (
      leadId: string,
      newStatus: LeadStatus,
      reasonData?: StatusChangeReasonData
    ) => {
      const leadToUpdate = localLeads.find((l) => l.id === leadId);
      const oldStatus = leadToUpdate?.status;

      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );

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

      const result = await updateLeadStatusAction(leadId, newStatus, options);

      if (result.success) {
        if (newStatus === "lost")
          toast.success(_t("leads.status_change.lost_success"));
        else if (newStatus === "converted")
          toast.success(_t("leads.status_change.converted_success"));
        else if (newStatus === "nurturing")
          toast.success(_t("leads.status_change.nurturing_success"));
        else if (newStatus === "disqualified")
          toast.success(_t("leads.status_change.disqualified_success"));
        else toast.success(_t("leads.status_change.success"));
      } else {
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

  const handleStatusChange = useCallback(
    async (leadId: string, newStatus: LeadStatus) => {
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
      await executeStatusChange(leadId, newStatus);
    },
    [localLeads, executeStatusChange]
  );

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

  const handleReasonModalClose = useCallback(() => {
    setIsReasonModalOpen(false);
    setPendingStatusChange(null);
  }, []);

  // ==================== FILTER HANDLERS ====================

  const handleFiltersChange = useCallback(
    (newFilters: LeadsFilters) => {
      setFilters(newFilters);
      const searchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value && value !== "all" && value !== undefined) {
          searchParams.set(key, value.toString());
        }
      });
      const newUrl = searchParams.toString()
        ? `/${locale}/crm/leads?${searchParams}`
        : `/${locale}/crm/leads`;
      window.history.replaceState(null, "", newUrl);
    },
    [locale]
  );

  // ==================== CARD CLICK HANDLERS ====================

  // Card click → open workspace popup
  const handleCardClick = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) {
        setWorkspaceLead(lead);
        setIsWorkspaceOpen(true);
      }
    },
    [localLeads]
  );

  // Double-click on card → also open popup (same behavior, no page navigation)
  const handleCardDoubleClick = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) {
        setWorkspaceLead(lead);
        setIsWorkspaceOpen(true);
      }
    },
    [localLeads]
  );

  // Navigate between leads in popup
  const handlePopupNavigate = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) setWorkspaceLead(lead);
    },
    [localLeads]
  );

  const handleCreateLead = () => setIsModalOpen(true);

  const handleExport = () => {
    // TODO: Implement export
  };

  // ==================== LEAD ACTION HANDLERS ====================

  const _handleLeadUpdated = useCallback(
    (updatedLead: Lead) => {
      setLocalLeads((prev) =>
        prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
      );
      if (workspaceLead?.id === updatedLead.id) {
        setWorkspaceLead(updatedLead);
      }
    },
    [workspaceLead?.id]
  );

  const handleConvertSuccess = useCallback(
    (result: { lead: Lead; opportunity: Record<string, unknown> }) => {
      setLocalLeads((prev) =>
        prev.map((lead) => (lead.id === result.lead.id ? result.lead : lead))
      );
      setConvertLead(null);
    },
    []
  );

  const handleAssign = useCallback(
    async (leadId: string, assigneeId: string | null) => {
      const assignee = assigneeId
        ? owners.find((o) => o.id === assigneeId)
        : null;

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

      const result = await updateLeadAction(leadId, {
        assigned_to_id: assigneeId,
      });
      if (result.success) {
        toast.success(_t("leads.drawer.save_success"));
      } else {
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

  const handleEditLead = useCallback(
    (_leadId: string) => {
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

  const handleDisqualifyLead = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) setDisqualifyTargetLead(lead);
    },
    [localLeads]
  );

  const handleDisqualifySuccess = useCallback(() => {
    if (disqualifyTargetLead) {
      setLocalLeads((prev) =>
        prev.map((lead) =>
          lead.id === disqualifyTargetLead.id
            ? { ...lead, status: "disqualified" as const }
            : lead
        )
      );
      setDisqualifyTargetLead(null);
    }
  }, [disqualifyTargetLead]);

  const handleDeleteLead = useCallback(
    (leadId: string) => {
      const lead = localLeads.find((l) => l.id === leadId);
      if (lead) setDeleteTargetLead(lead);
    },
    [localLeads]
  );

  const handleDeleteConfirm = useCallback(
    async (reason: string, permanentDelete: boolean) => {
      if (!deleteTargetLead) return;
      setIsDeleteLoading(true);
      try {
        const result = await deleteLeadAction(
          deleteTargetLead.id,
          reason,
          permanentDelete
        );
        if (!result.success) throw new Error(result.error);
        toast.success(
          permanentDelete
            ? _t("leads.delete.success_permanent")
            : _t("leads.delete.success")
        );
        setLocalLeads((prev) =>
          prev.filter((l) => l.id !== deleteTargetLead.id)
        );
        setDeleteTargetLead(null);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : _t("leads.delete.error")
        );
      } finally {
        setIsDeleteLoading(false);
      }
    },
    [deleteTargetLead, _t]
  );

  const _handleLeadDeleted = useCallback((leadId: string) => {
    setLocalLeads((prev) => prev.filter((l) => l.id !== leadId));
  }, []);

  const handleSortChange = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setSortColumn(column);
      setSortDirection(direction);
    },
    []
  );

  const handleLeadCreated = useCallback((newLead: Lead) => {
    setLocalLeads((prev) => [newLead, ...prev]);
    setIsModalOpen(false);
  }, []);

  // ==================== BULK ACTIONS (E3) ====================

  const handleBulkAssign = useCallback(
    async (assigneeId: string) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkAssignLeadsAction(selectedLeadIds, assigneeId);
        if (result.success) {
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

  const handleBulkStatus = useCallback(
    async (status: LeadStatus) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkUpdateStatusAction(selectedLeadIds, status);
        if (result.success) {
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

  const handleBulkDelete = useCallback(
    async (reason: string) => {
      setIsBulkLoading(true);
      try {
        const result = await bulkDeleteLeadsAction(selectedLeadIds, reason);
        if (result.success) {
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

  const handleBulkExport = useCallback(() => {
    const selectedLeads = localLeads.filter((lead) =>
      selectedLeadIds.includes(lead.id)
    );
    const orderedColumnKeys = orderedVisibleColumns.map((col) => col.key);
    const csvContent = generateCsvContent(selectedLeads, orderedColumnKeys, _t);
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

  const handleClearSelection = useCallback(() => {
    setSelectedLeadIds([]);
  }, []);

  // ==================== RENDER ====================

  return (
    <>
      <div className="absolute inset-0 flex flex-col overflow-hidden">
        {/* HEADER COMPACT (48px) - Salesforce Lightning style */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0070D2]">
              <Users className="h-4 w-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {_t("leads.title")}
              </span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Pipeline View
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {_t("leads.actions.export", { defaultValue: "Export" })}
              </span>
            </Button>
            <Button
              size="sm"
              onClick={handleCreateLead}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {_t("leads.actions.new_lead")}
            </Button>
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
          </div>
        </header>

        {/* BANDE MÉTRIQUES BLEUE (60px) - Salesforce #0070D2 */}
        <div className="flex h-[60px] shrink-0 items-center justify-between bg-[#0070D2] px-5">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                Total Leads
              </p>
              <p className="text-xl leading-tight font-bold text-white">
                {headerStats.total}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                Qualified
              </p>
              <p className="text-xl leading-tight font-bold text-white">
                {headerStats.qualified}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                This Week
              </p>
              <p className="text-xl leading-tight font-bold text-white">
                {headerStats.thisWeek}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                Avg Score
              </p>
              <p className="text-xl leading-tight font-bold text-white">
                {headerStats.avgScore}
              </p>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div>
              <p className="text-[10px] font-medium tracking-wider text-white/70 uppercase">
                Pipeline
              </p>
              <p className="text-xl leading-tight font-bold text-white">
                {stats.pipelineValue}
              </p>
            </div>
          </div>
          <div className="rounded-md bg-white/20 px-3 py-1.5 text-xs font-medium text-white">
            This Quarter
          </div>
        </div>

        {/* Quick Filters Bar + Filter Sheet */}
        <LeadsFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          countries={countries}
          owners={owners}
          totalCount={filteredLeads.length}
          onAdvancedReset={advancedReset}
        />

        {/* Content Area - Kanban fills remaining space */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "kanban" ? (
            <div className="h-full bg-[#f3f3f3] p-3 dark:bg-gray-900/50">
              <KanbanPhaseBoard
                columns={kanbanPhaseColumns}
                onCardClick={handleCardClick}
                onCardDoubleClick={handleCardDoubleClick}
                onCreate={handleCreateLead}
                onStatusChange={handleStatusChange}
                onEdit={handleEditLead}
                onConvert={handleConvertLead}
                onDisqualify={handleDisqualifyLead}
                onDelete={handleDeleteLead}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              {/* Column Selector - Table view only */}
              <div className="border-fc-border-light bg-fc-bg-card flex shrink-0 justify-end border-b px-4 py-1.5 dark:border-gray-800 dark:bg-gray-900">
                <ColumnSelector
                  columns={orderedColumns}
                  onToggle={toggleColumn}
                  onReset={resetToDefault}
                  onReorder={reorderColumns}
                />
              </div>

              {/* Leads Table */}
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

              {/* Pagination */}
              <div className="border-fc-border-light shrink-0 border-t dark:border-gray-800">
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

      {/* Lead Workspace Popup (replaces drawer) */}
      <LeadWorkspaceDialog
        lead={workspaceLead}
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        allLeadIds={allFilteredLeadIds}
        onNavigate={handlePopupNavigate}
        onEdit={handleEditLead}
        onConvert={handleConvertLead}
        onDisqualify={handleDisqualifyLead}
        onDelete={handleDeleteLead}
        onStatusChange={handleStatusChange}
      />

      {/* Bulk Actions Bar (E3) */}
      <BulkActionsBar
        selectedCount={selectedLeadIds.length}
        onAssign={() => setIsBulkAssignOpen(true)}
        onChangeStatus={() => setIsBulkStatusOpen(true)}
        onExport={handleBulkExport}
        onDelete={() => setIsBulkDeleteOpen(true)}
        onClearSelection={handleClearSelection}
      />

      {/* Bulk Modals (E3) */}
      <BulkAssignModal
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onConfirm={handleBulkAssign}
        selectedCount={selectedLeadIds.length}
        teamMembers={owners}
        isLoading={isBulkLoading}
      />
      <BulkStatusModal
        isOpen={isBulkStatusOpen}
        onClose={() => setIsBulkStatusOpen(false)}
        onConfirm={handleBulkStatus}
        selectedCount={selectedLeadIds.length}
        isLoading={isBulkLoading}
      />
      <BulkDeleteModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onConfirm={handleBulkDelete}
        selectedCount={selectedLeadIds.length}
        isLoading={isBulkLoading}
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

      {/* T12: Disqualify Lead Modal */}
      {disqualifyTargetLead && (
        <DisqualifyLeadModal
          isOpen={!!disqualifyTargetLead}
          onClose={() => setDisqualifyTargetLead(null)}
          lead={disqualifyTargetLead}
          onSuccess={handleDisqualifySuccess}
        />
      )}

      {/* G4: Single Delete Modal */}
      {deleteTargetLead && (
        <DeleteLeadModal
          isOpen={!!deleteTargetLead}
          onClose={() => setDeleteTargetLead(null)}
          onConfirm={handleDeleteConfirm}
          leadName={
            deleteTargetLead.first_name || deleteTargetLead.last_name
              ? `${deleteTargetLead.first_name || ""} ${deleteTargetLead.last_name || ""}`.trim()
              : deleteTargetLead.email || "Unknown contact"
          }
          leadEmail={deleteTargetLead.email || ""}
          isLoading={isDeleteLoading}
        />
      )}
    </>
  );
}
