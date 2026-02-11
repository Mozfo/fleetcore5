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
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Plus,
  Download,
  DollarSign,
  Target,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FCPageHeader, FCStatCard } from "@/components/fc";
import { ViewToggle, type ViewMode } from "../leads/ViewToggle";
import { OpportunitiesFilterBar } from "./OpportunitiesFilterBar";
import { KanbanBoard } from "./KanbanBoard";
import { OpportunitiesTable } from "./OpportunitiesTable";
import { OpportunityColumnSelector } from "./OpportunityColumnSelector";
import { OpportunityDrawer } from "./OpportunityDrawer";
import { OpportunityFormModal } from "./OpportunityFormModal";
import { TablePagination } from "../leads/TablePagination";
import {
  updateOpportunityStageAction,
  updateOpportunityAction,
} from "@/lib/actions/crm/opportunity.actions";
import { DEFAULT_OPPORTUNITY_COLUMNS } from "@/lib/config/opportunity-columns";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { useOpportunityColumnPreferences } from "@/lib/hooks/useOpportunityColumnPreferences";
import type {
  Opportunity,
  OpportunityStage,
  OpportunityKanbanColumn,
} from "@/types/crm";
import type { OpportunitiesFilters } from "@/app/[locale]/(app)/crm/opportunities/page";

function formatCurrency(value: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

const VIEW_MODE_STORAGE_KEY = "crm_opportunities_view";

interface OpportunitiesPageClientProps {
  allOpportunities: Array<
    Opportunity & { days_in_stage: number; is_rotting: boolean }
  >;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  leads: Array<{
    id: string;
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
    phone: string | null;
  }>;
  initialFilters: OpportunitiesFilters;
}

export function OpportunitiesPageClient({
  allOpportunities,
  owners,
  leads,
  initialFilters,
}: OpportunitiesPageClientProps) {
  const { t } = useTranslation("crm");
  const router = useRouter();

  // Load stages dynamically from crm_settings
  const { stages, getLabel: getStageLabel } = useOpportunityStages();

  // Local state for optimistic updates
  const [localOpportunities, setLocalOpportunities] =
    useState(allOpportunities);

  // Filter state
  const [filters, setFilters] = useState<OpportunitiesFilters>(initialFilters);

  // View mode (kanban or table)
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");

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

  // Form modal state (for manual opportunity creation)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

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

  const handleViewModeChange = useCallback((mode: ViewMode) => {
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

  // Handle new opportunity created from form modal
  const handleOpportunityCreated = useCallback(
    (newOpp: Partial<Opportunity>) => {
      // Build minimal opportunity object for optimistic update
      const now = new Date().toISOString();

      // Find the lead info from our leads list
      const leadInfo = newOpp.lead_id
        ? leads.find((l) => l.id === newOpp.lead_id)
        : undefined;

      // Build lead relation only if we have complete data that satisfies the type
      // Opportunity.lead requires first_name and last_name to be non-null strings
      const leadRelation: Opportunity["lead"] =
        leadInfo && leadInfo.first_name && leadInfo.last_name
          ? {
              id: leadInfo.id,
              first_name: leadInfo.first_name,
              last_name: leadInfo.last_name,
              email: leadInfo.email,
              phone: leadInfo.phone ?? null,
              company_name: leadInfo.company_name,
              country_code: null,
              country: null,
            }
          : undefined;

      const oppToAdd: Opportunity & {
        days_in_stage: number;
        is_rotting: boolean;
      } = {
        id: newOpp.id || "",
        lead_id: newOpp.lead_id || "",
        stage: newOpp.stage || "qualification",
        status: newOpp.status || "open",
        expected_value: newOpp.expected_value ?? null,
        probability_percent: newOpp.probability_percent ?? null,
        forecast_value: newOpp.forecast_value ?? null,
        won_value: null,
        currency: "EUR",
        discount_amount: null,
        close_date: null,
        expected_close_date: newOpp.expected_close_date ?? null,
        won_date: null,
        lost_date: null,
        created_at: newOpp.created_at || now,
        updated_at: now,
        stage_entered_at: now,
        max_days_in_stage: 14,
        assigned_to: null,
        owner_id: null,
        pipeline_id: null,
        plan_id: null,
        contract_id: null,
        loss_reason: null,
        notes: null,
        metadata: {},
        days_in_stage: 0,
        is_rotting: false,
        lead: leadRelation,
        assignedTo: null,
      };

      setLocalOpportunities((prev) => [oppToAdd, ...prev]);

      // Refresh server data to get complete opportunity with all relations
      router.refresh();
    },
    [leads, router]
  );

  // Handle assignment change from table dropdown
  const handleAssign = useCallback(
    async (opportunityId: string, assigneeId: string | null) => {
      // Find the opportunity
      const opportunity = localOpportunities.find(
        (o) => o.id === opportunityId
      );
      if (!opportunity) return;

      const oldAssignedTo = opportunity.assigned_to;
      const oldAssignedToData = opportunity.assignedTo;

      // Optimistic update
      const newAssignedTo = assigneeId
        ? owners.find((o) => o.id === assigneeId)
        : null;

      setLocalOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId
            ? {
                ...o,
                assigned_to: assigneeId,
                assignedTo: newAssignedTo
                  ? {
                      id: newAssignedTo.id,
                      first_name: newAssignedTo.first_name,
                      last_name: newAssignedTo.last_name,
                      email: "", // Not available from owners list
                    }
                  : null,
              }
            : o
        )
      );

      // Server action
      const result = await updateOpportunityAction(opportunityId, {
        assigned_to: assigneeId,
      });

      if (!result.success) {
        // Revert on failure
        setLocalOpportunities((prev) =>
          prev.map((o) =>
            o.id === opportunityId
              ? {
                  ...o,
                  assigned_to: oldAssignedTo,
                  assignedTo: oldAssignedToData,
                }
              : o
          )
        );
        toast.error(t("opportunity.assignFailed", "Assignment failed"));
      } else {
        toast.success(
          t("opportunity.assignSuccess", "Assignment updated successfully")
        );
      }
    },
    [localOpportunities, owners, t]
  );

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
      {/* Page Header - 48px (FCPageHeader) */}
      <FCPageHeader
        title={t("opportunity.title", "Opportunities")}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                /* TODO: export */
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t("opportunity.actions.export", "Export")}
              </span>
            </Button>
            <Button
              size="sm"
              onClick={() => setIsFormModalOpen(true)}
              className="h-8 gap-1.5 text-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("opportunity.actions.new_opportunity", "New Opportunity")}
            </Button>
            <ViewToggle value={viewMode} onChange={handleViewModeChange} />
          </>
        }
      />

      {/* Filter Bar - 40px inline */}
      <OpportunitiesFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        owners={owners}
        rottingCount={stats.rottingCount}
      />

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === "kanban" ? (
          <div className="bg-fc-bg-app flex h-full flex-col dark:bg-gray-900/50">
            {/* Stats Cards */}
            <div className="grid shrink-0 grid-cols-2 gap-3 p-3 sm:grid-cols-4">
              <FCStatCard
                label={t("opportunity.stats.openDeals", "Open Deals")}
                value={stats.total}
                variant="primary"
                icon={<Target className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.pipelineValue", "Pipeline")}
                value={formatCurrency(stats.totalValue)}
                variant="success"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.weightedValue", "Weighted")}
                value={formatCurrency(stats.weightedValue)}
                variant="primary"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.rottingDeals", "Rotting")}
                value={stats.rottingCount}
                variant={stats.rottingCount > 0 ? "danger" : "default"}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden px-3 pb-3">
              <KanbanBoard
                columns={kanbanColumns}
                onStageChange={handleStageChange}
                onCardClick={handleOpportunityClick}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Stats Cards - Table view */}
            <div className="border-fc-border-light grid shrink-0 grid-cols-2 gap-3 border-b bg-white p-3 sm:grid-cols-4 dark:border-gray-800 dark:bg-gray-950">
              <FCStatCard
                label={t("opportunity.stats.openDeals", "Open Deals")}
                value={stats.total}
                variant="primary"
                icon={<Target className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.pipelineValue", "Pipeline")}
                value={formatCurrency(stats.totalValue)}
                variant="success"
                icon={<DollarSign className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.weightedValue", "Weighted")}
                value={formatCurrency(stats.weightedValue)}
                variant="primary"
                icon={<TrendingUp className="h-5 w-5" />}
              />
              <FCStatCard
                label={t("opportunity.stats.rottingDeals", "Rotting")}
                value={stats.rottingCount}
                variant={stats.rottingCount > 0 ? "danger" : "default"}
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </div>

            {/* Column Selector */}
            <div className="border-fc-border-light bg-fc-bg-card flex shrink-0 justify-end border-b px-4 py-1.5 dark:border-gray-800 dark:bg-gray-900">
              <OpportunityColumnSelector
                columns={orderedColumns}
                onToggle={toggleColumn}
                onReset={resetColumns}
                onReorder={reorderColumns}
              />
            </div>

            {/* Table */}
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
                onAssign={handleAssign}
                owners={owners}
              />
            </div>

            {/* Pagination */}
            <div className="border-fc-border-light shrink-0 border-t dark:border-gray-800">
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

      {/* Opportunity Form Modal (manual creation) */}
      <OpportunityFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleOpportunityCreated}
        leads={leads}
        owners={owners}
      />
    </div>
  );
}
