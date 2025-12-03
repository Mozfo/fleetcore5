/**
 * OpportunitiesPageClient - Client Component pour Pipeline Kanban
 *
 * Architecture:
 * - Reçoit TOUS les opportunities du Server Component
 * - Filtre côté client avec useMemo (~5ms)
 * - Optimistic updates pour drag & drop stage change
 * - 5 colonnes Kanban: qualification -> demo -> proposal -> negotiation -> contract_sent
 */

"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { OpportunitiesPageHeader } from "./OpportunitiesPageHeader";
import { OpportunitiesFilterBar } from "./OpportunitiesFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { OpportunitiesTable } from "./OpportunitiesTable";
import { OpportunityColumnSelector } from "./OpportunityColumnSelector";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { TablePagination } from "../leads/TablePagination";
import { updateOpportunityStageAction } from "@/lib/actions/crm/opportunity.actions";
import { DEFAULT_OPPORTUNITY_COLUMNS } from "@/lib/config/opportunity-columns";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { useOpportunityColumnPreferences } from "@/lib/hooks/useOpportunityColumnPreferences";
import type {
  Opportunity,
  OpportunityStage,
  OpportunityKanbanColumn,
} from "@/types/crm";
import type { OpportunitiesFilters } from "@/app/[locale]/(app)/crm/opportunities/page";
// LossReasonOption type removed - drawer loads loss reasons dynamically via useOpportunityLossReasons

const VIEW_MODE_STORAGE_KEY = "crm_opportunities_view";

interface OpportunitiesPageClientProps {
  allOpportunities: Array<
    Opportunity & { days_in_stage: number; is_rotting: boolean }
  >;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  initialFilters: OpportunitiesFilters;
}

export function OpportunitiesPageClient({
  allOpportunities,
  owners,
  initialFilters,
}: OpportunitiesPageClientProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { stages, getLabel: getStageLabel } = useOpportunityStages();

  // Local state for optimistic updates
  const [localOpportunities, setLocalOpportunities] =
    useState(allOpportunities);

  // Filter state
  const [filters, setFilters] = useState<OpportunitiesFilters>(initialFilters);

  // View mode (kanban or table)
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Table state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Drawer state
  const [selectedOpportunity, setSelectedOpportunity] = useState<
    (Opportunity & { days_in_stage: number; is_rotting: boolean }) | null
  >(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Column preferences (visibility, order, widths) - same pattern as Leads
  const {
    orderedColumns,
    orderedVisibleColumns,
    visibleColumnKeys,
    getColumnWidth,
    toggleColumn,
    reorderColumns,
    resizeColumn,
    resetToDefault: resetColumns,
  } = useOpportunityColumnPreferences(DEFAULT_OPPORTUNITY_COLUMNS);

  // Load viewMode from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (saved === "kanban" || saved === "table") {
        setViewMode(saved);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const handleViewModeChange = useCallback((mode: "kanban" | "table") => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Silently fail
    }
  }, []);

  // Filter opportunities client-side
  const filteredOpportunities = useMemo(() => {
    return localOpportunities.filter((opp) => {
      // Status filter (default: open)
      if (filters.status !== "all" && opp.status !== filters.status) {
        return false;
      }

      // Stage filter
      if (filters.stage !== "all" && opp.stage !== filters.stage) {
        return false;
      }

      // Assigned to filter
      if (
        filters.assigned_to !== "all" &&
        opp.assigned_to !== filters.assigned_to
      ) {
        return false;
      }

      // Value range filter
      if (filters.min_value !== undefined && opp.expected_value !== null) {
        if (opp.expected_value < filters.min_value) return false;
      }
      if (filters.max_value !== undefined && opp.expected_value !== null) {
        if (opp.expected_value > filters.max_value) return false;
      }

      // Rotting filter
      if (filters.is_rotting && !opp.is_rotting) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [
          opp.lead?.company_name,
          opp.lead?.first_name,
          opp.lead?.last_name,
          opp.lead?.email,
          opp.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableFields.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });
  }, [localOpportunities, filters]);

  // Calculate stats
  const stats = useMemo(() => {
    const openOpps = filteredOpportunities.filter((o) => o.status === "open");
    const totalValue = openOpps.reduce(
      (sum, o) => sum + (o.expected_value ?? 0),
      0
    );
    const weightedValue = openOpps.reduce(
      (sum, o) => sum + (o.forecast_value ?? 0),
      0
    );
    const rottingCount = openOpps.filter((o) => o.is_rotting).length;

    const byStage = stages.reduce(
      (acc, stage) => {
        const stageOpps = openOpps.filter((o) => o.stage === stage.value);
        acc[stage.value] = {
          count: stageOpps.length,
          value: stageOpps.reduce((sum, o) => sum + (o.expected_value ?? 0), 0),
        };
        return acc;
      },
      {} as Record<string, { count: number; value: number }>
    );

    return {
      total: openOpps.length,
      totalValue,
      weightedValue,
      byStage,
      rottingCount,
    };
  }, [filteredOpportunities, stages]);

  // Build Kanban columns from dynamic stages
  const kanbanColumns = useMemo((): OpportunityKanbanColumn[] => {
    return stages.map((stage) => {
      const stageOpps = filteredOpportunities.filter(
        (o) => o.stage === stage.value && o.status === "open"
      );
      const totalValue = stageOpps.reduce(
        (sum, o) => sum + (o.expected_value ?? 0),
        0
      );
      const weightedValue = stageOpps.reduce(
        (sum, o) => sum + (o.forecast_value ?? 0),
        0
      );

      return {
        id: stage.value,
        title: getStageLabel(stage.value, "en"), // TODO: use locale
        color: stage.color,
        opportunities: stageOpps as Opportunity[],
        count: stageOpps.length,
        totalValue,
        weightedValue,
      };
    });
  }, [filteredOpportunities, stages, getStageLabel]);

  // Handle stage change via drag & drop
  const handleStageChange = useCallback(
    async (opportunityId: string, newStage: OpportunityStage) => {
      // Find the opportunity
      const opportunity = localOpportunities.find(
        (o) => o.id === opportunityId
      );
      if (!opportunity) return;

      const oldStage = opportunity.stage;
      if (oldStage === newStage) return;

      // Optimistic update
      setLocalOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId
            ? {
                ...o,
                stage: newStage,
                stage_entered_at: new Date().toISOString(),
                days_in_stage: 0,
                is_rotting: false,
              }
            : o
        )
      );

      // Server action
      const result = await updateOpportunityStageAction(
        opportunityId,
        newStage
      );

      if (!result.success) {
        // Revert on failure
        setLocalOpportunities((prev) =>
          prev.map((o) =>
            o.id === opportunityId ? { ...o, stage: oldStage } : o
          )
        );
        toast.error(t("opportunity.stageChangeFailed", "Stage change failed"));
      } else {
        toast.success(
          t("opportunity.stageChanged", "Stage updated successfully")
        );
        // Update with server data
        setLocalOpportunities((prev) =>
          prev.map((o) =>
            o.id === opportunityId
              ? {
                  ...o,
                  stage: result.data.stage,
                  probability_percent: result.data.probability_percent,
                  forecast_value: result.data.forecast_value,
                  stage_entered_at: result.data.stage_entered_at,
                  days_in_stage: 0,
                  is_rotting: false,
                }
              : o
          )
        );
      }
    },
    [localOpportunities, t]
  );

  // Handle filter change
  const handleFilterChange = useCallback(
    (newFilters: Partial<OpportunitiesFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Table handlers
  const handleSortChange = useCallback(
    (column: string, direction: "asc" | "desc") => {
      setSortColumn(column);
      setSortDirection(direction);
    },
    []
  );

  const handleSelectionChange = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  // Handle opportunity card/row click - open drawer
  const handleOpportunityClick = useCallback(
    (opportunityId: string) => {
      const opp = localOpportunities.find((o) => o.id === opportunityId);
      if (opp) {
        setSelectedOpportunity(opp);
        setIsDrawerOpen(true);
      }
    },
    [localOpportunities]
  );

  // Handle drawer close
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  // Handle opportunity update from drawer (e.g., mark as won/lost)
  const handleOpportunityUpdated = useCallback((updated: Opportunity) => {
    setLocalOpportunities((prev) =>
      prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
    );
    // Also update selectedOpportunity if it's the same one
    setSelectedOpportunity((prev) =>
      prev?.id === updated.id ? { ...prev, ...updated } : prev
    );
  }, []);

  // Handle opportunity delete from drawer
  const handleOpportunityDelete = useCallback((id: string) => {
    setLocalOpportunities((prev) => prev.filter((o) => o.id !== id));
    setSelectedOpportunity(null);
    setIsDrawerOpen(false);
  }, []);

  // Paginated opportunities for table view
  const paginatedOpportunities = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOpportunities.slice(startIndex, startIndex + pageSize);
  }, [filteredOpportunities, currentPage, pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden">
      {/* Sticky Header Section - Non-scrolling, constrained width to prevent overflow when table columns are resized */}
      <div className="max-w-full shrink-0 space-y-4 overflow-x-hidden border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        {/* Header with stats - Same pattern as Leads */}
        <OpportunitiesPageHeader
          stats={stats}
          onNewOpportunity={() => {
            // TODO: Implement new opportunity modal
          }}
          onExport={() => {
            // TODO: Implement export
          }}
          onSettings={() => {
            // TODO: Implement settings
          }}
        />

        {/* Filter bar - ViewToggle is here (same as Leads) */}
        <OpportunitiesFilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          owners={owners}
          rottingCount={stats.rottingCount}
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          // Column selector props NOT here - moved to table section like Leads
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-auto">
        {/* Kanban board */}
        {viewMode === "kanban" && (
          <div className="p-6">
            <KanbanBoard
              columns={kanbanColumns}
              onStageChange={handleStageChange}
              onCardClick={handleOpportunityClick}
            />
          </div>
        )}

        {/* Table view - Exact same structure as Leads */}
        {viewMode === "table" && (
          <div className="flex h-full flex-col">
            {/* Column Selector - Table view only (same position as Leads) */}
            <div className="flex shrink-0 justify-end border-b border-gray-200 bg-gray-50 px-6 py-2 dark:border-gray-800 dark:bg-gray-900">
              <OpportunityColumnSelector
                columns={orderedColumns}
                onToggle={toggleColumn}
                onReset={resetColumns}
                onReorder={reorderColumns}
              />
            </div>

            {/* Table with sticky header */}
            <div className="flex-1 overflow-auto">
              <OpportunitiesTable
                opportunities={paginatedOpportunities}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                visibleColumnKeys={visibleColumnKeys}
                orderedVisibleColumns={orderedVisibleColumns}
                getColumnWidth={getColumnWidth}
                onColumnResize={resizeColumn}
                onStageChange={handleStageChange}
                onRowClick={handleOpportunityClick}
                onRowDoubleClick={handleOpportunityClick}
                owners={owners}
              />
            </div>

            {/* Pagination - Fixed at bottom (same as Leads) */}
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-800">
              <TablePagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filteredOpportunities.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        )}
      </div>

      {/* Opportunity Drawer */}
      <OpportunityDrawer
        opportunity={selectedOpportunity}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onDelete={handleOpportunityDelete}
        onOpportunityUpdated={handleOpportunityUpdated}
        owners={owners}
      />
    </div>
  );
}
