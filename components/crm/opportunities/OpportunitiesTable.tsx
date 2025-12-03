/**
 * OpportunitiesTable - Table principale pour afficher les opportunities
 * Tri, sélection, actions hover
 * Basé sur LeadsTable.tsx - même pattern
 */

"use client";

import { useMemo, useRef, useCallback, useState } from "react";
import { ChevronUp, ChevronDown, Inbox } from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { OpportunitiesTableRow } from "./OpportunitiesTableRow";
import type { Opportunity, OpportunityStage } from "@/types/crm";
import {
  DEFAULT_OPPORTUNITY_COLUMNS,
  getVisibleOpportunityColumnKeys,
  type OpportunityColumnConfig,
  SORTABLE_OPPORTUNITY_COLUMN_MAP,
} from "@/lib/config/opportunity-columns";

interface OpportunitiesTableProps {
  opportunities: Array<
    Opportunity & { days_in_stage: number; is_rotting: boolean }
  >;
  isLoading?: boolean;
  onRowClick?: (opportunityId: string) => void;
  onRowDoubleClick?: (opportunityId: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (column: string, direction: "asc" | "desc") => void;
  visibleColumnKeys?: string[];
  orderedVisibleColumns?: OpportunityColumnConfig[];
  getColumnWidth?: (key: string) => number;
  onColumnResize?: (key: string, width: number) => void;
  // Actions
  onStageChange?: (opportunityId: string, stage: OpportunityStage) => void;
  onEdit?: (opportunityId: string) => void;
  onMarkWon?: (opportunityId: string) => void;
  onMarkLost?: (opportunityId: string) => void;
  onDelete?: (opportunityId: string) => void;
  onAssign?: (opportunityId: string, assigneeId: string | null) => void;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
}

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = getVisibleOpportunityColumnKeys(
  DEFAULT_OPPORTUNITY_COLUMNS
);

// SortableColumn type
type SortableColumn = string;

/**
 * Composant header triable
 */
function SortableTableHead({
  column,
  label,
  currentSort,
  onSort,
  className,
}: {
  column: SortableColumn;
  label: string;
  currentSort?: { column: string; direction: "asc" | "desc" };
  onSort: (column: SortableColumn) => void;
  className?: string;
}) {
  const isActive = currentSort?.column === column;

  return (
    <TableHead
      className={cn("cursor-pointer select-none", className)}
      onClick={() => onSort(column)}
      aria-sort={
        isActive
          ? currentSort.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {isActive &&
          (currentSort.direction === "asc" ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          ))}
      </div>
    </TableHead>
  );
}

/**
 * Resizable table head
 */
function ResizableTableHead({
  columnKey,
  label,
  width,
  onResize,
  sortable,
  sortColumn,
  currentSort,
  onSort,
  isLocked,
  isExpandable,
  children,
}: {
  columnKey: string;
  label?: string;
  width: number;
  onResize?: (key: string, width: number) => void;
  sortable?: boolean;
  sortColumn?: SortableColumn;
  currentSort?: { column: string; direction: "asc" | "desc" };
  onSort?: (column: SortableColumn) => void;
  isLocked?: boolean;
  isExpandable?: boolean;
  children?: React.ReactNode;
}) {
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const isActive = sortColumn && currentSort?.column === sortColumn;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = { startX: e.clientX, startWidth: width };
      setIsResizing(true);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!resizeRef.current) return;
        const deltaX = moveEvent.clientX - resizeRef.current.startX;
        const newWidth = resizeRef.current.startWidth + deltaX;
        onResize?.(columnKey, newWidth);
      };

      const handleMouseUp = () => {
        resizeRef.current = null;
        setIsResizing(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [columnKey, width, onResize]
  );

  const handleClick = useCallback(() => {
    if (sortable && sortColumn && onSort) {
      onSort(sortColumn);
    }
  }, [sortable, sortColumn, onSort]);

  const canResize = !isLocked && onResize;

  const columnStyle = isExpandable
    ? { minWidth: `${width}px` }
    : { width: `${width}px`, minWidth: `${width}px` };

  return (
    <TableHead
      className={cn(
        "group/header relative select-none",
        sortable && "cursor-pointer"
      )}
      style={columnStyle}
      onClick={handleClick}
      aria-sort={
        isActive
          ? currentSort?.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
    >
      {children ? (
        children
      ) : (
        <div className="flex items-center gap-1 pr-2">
          <span className="truncate">{label}</span>
          {isActive &&
            (currentSort?.direction === "asc" ? (
              <ChevronUp className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ))}
        </div>
      )}

      {canResize && (
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[5px] cursor-col-resize touch-none select-none",
            isResizing
              ? "bg-blue-500 opacity-100"
              : "bg-black/30 opacity-0 group-hover/header:opacity-100 dark:bg-white/30"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => {
            e.stopPropagation();
            onResize?.(columnKey, 100);
          }}
          onClick={(e) => e.stopPropagation()}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize column"
        />
      )}
    </TableHead>
  );
}

/**
 * Skeleton row pour loading state
 */
function SkeletonRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow>
      {[...Array(columnCount)].map((_, i) => (
        <td key={i} className="p-2">
          <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </td>
      ))}
    </TableRow>
  );
}

export function OpportunitiesTable({
  opportunities,
  isLoading = false,
  onRowClick,
  onRowDoubleClick,
  selectedIds = [],
  onSelectionChange,
  sortColumn = "created_at",
  sortDirection = "desc",
  onSortChange,
  visibleColumnKeys = DEFAULT_VISIBLE_COLUMNS,
  orderedVisibleColumns,
  getColumnWidth,
  onColumnResize,
  onStageChange,
  onEdit,
  onMarkWon,
  onMarkLost,
  onDelete,
  onAssign,
  owners = [],
}: OpportunitiesTableProps) {
  const { t } = useTranslation("crm");

  const isVisible = (key: string) => visibleColumnKeys.includes(key);

  // Dynamic sort value getter
  const getSortValue = useCallback(
    (
      opp: Opportunity & { days_in_stage?: number },
      column: string
    ): string | number => {
      const dateColumns = [
        "created_at",
        "updated_at",
        "expected_close_date",
        "won_date",
        "lost_date",
        "stage_entered_at",
      ];
      if (dateColumns.includes(column)) {
        const value = opp[column as keyof Opportunity];
        if (!value) return 0;
        const date =
          typeof value === "string"
            ? new Date(value)
            : new Date(value as unknown as string);
        return date.getTime();
      }

      const numericColumns = [
        "expected_value",
        "probability_percent",
        "forecast_value",
        "won_value",
        "discount_amount",
        "days_in_stage",
      ];
      if (numericColumns.includes(column)) {
        if (column === "days_in_stage") {
          return opp.days_in_stage ?? 0;
        }
        const value = opp[column as keyof Opportunity];
        return (value as number | null) ?? -1;
      }

      // Special case: nested lead fields
      if (column === "lead.company_name") {
        return opp.lead?.company_name || "";
      }
      if (column === "lead.last_name") {
        return opp.lead?.last_name || "";
      }
      if (column === "lead.country_code") {
        return opp.lead?.country_code || "";
      }

      // Special case: assigned_to
      if (column === "assigned_to") {
        return opp.assignedTo?.first_name || "";
      }

      const value = opp[column as keyof Opportunity];
      return String(value ?? "");
    },
    []
  );

  // Sort opportunities
  const sortedOpportunities = useMemo(() => {
    if (!sortColumn) return opportunities;

    return [...opportunities].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [opportunities, sortColumn, sortDirection, getSortValue]);

  // Handle sort
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      onSortChange?.(column, newDirection);
    } else {
      onSortChange?.(column, "asc");
    }
  };

  // Handle row selection
  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter((sid) => sid !== id));
    }
  };

  // Handle select all
  const allSelected =
    opportunities.length > 0 && selectedIds.length === opportunities.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < opportunities.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(opportunities.map((o) => o.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  const currentSort = { column: sortColumn, direction: sortDirection };

  // Render header cell
  const renderHeaderCell = (
    col: OpportunityColumnConfig,
    isLastColumn: boolean
  ) => {
    const sortableColumn = SORTABLE_OPPORTUNITY_COLUMN_MAP[col.key] as
      | SortableColumn
      | undefined;
    const width = getColumnWidth?.(col.key) ?? 100;
    const isLocked = col.key === "checkbox" || col.key === "actions";
    const isExpandable = isLastColumn;

    if (col.key === "checkbox") {
      return (
        <ResizableTableHead
          key={col.key}
          columnKey={col.key}
          width={width}
          onResize={onColumnResize}
          isLocked={true}
        >
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) {
                (el as unknown as HTMLInputElement).indeterminate =
                  someSelected;
              }
            }}
            onCheckedChange={handleSelectAll}
            aria-label={t("opportunity.table.select_all", "Select all")}
          />
        </ResizableTableHead>
      );
    }

    return (
      <ResizableTableHead
        key={col.key}
        columnKey={col.key}
        label={col.labelKey ? t(col.labelKey) : ""}
        width={width}
        onResize={onColumnResize}
        sortable={col.sortable && !!sortableColumn}
        sortColumn={sortableColumn}
        currentSort={currentSort}
        onSort={handleSort}
        isLocked={isLocked}
        isExpandable={isExpandable}
      />
    );
  };

  const columnsToRender = useMemo(
    () => orderedVisibleColumns || [],
    [orderedVisibleColumns]
  );

  // Calculate minimum table width
  const tableWidthInfo = useMemo(() => {
    if (!getColumnWidth || columnsToRender.length === 0)
      return { minWidth: undefined, fixedColumnsWidth: 0 };
    const fixedColumnsWidth = columnsToRender
      .slice(0, -1)
      .reduce((sum, col) => sum + (getColumnWidth(col.key) ?? 100), 0);
    return {
      minWidth: fixedColumnsWidth + (getColumnWidth("actions") ?? 140),
      fixedColumnsWidth,
    };
  }, [columnsToRender, getColumnWidth]);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full">
        <Table noWrapper>
          <TableHeader className="bg-background sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
            <TableRow>
              <TableHead className="w-[40px]" />
              <TableHead className="w-[200px]">
                {t("opportunity.table.columns.company", "Company")}
              </TableHead>
              <TableHead className="w-[160px]">
                {t("opportunity.table.columns.contact", "Contact")}
              </TableHead>
              <TableHead className="w-[120px]">
                {t("opportunity.table.columns.value", "Value")}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("opportunity.table.columns.probability", "Prob.")}
              </TableHead>
              <TableHead className="w-[130px]">
                {t("opportunity.table.columns.stage", "Stage")}
              </TableHead>
              <TableHead className="w-[140px]">
                {t("opportunity.table.columns.assigned", "Assigned")}
              </TableHead>
              <TableHead className="w-[130px]">
                {t("opportunity.table.columns.close_date", "Close Date")}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("opportunity.table.columns.days_in_stage", "Days")}
              </TableHead>
              <TableHead className="w-[140px]">
                {t("opportunity.table.columns.actions", "Actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} columnCount={10} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // Empty state
  if (opportunities.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <EmptyState
          icon={<Inbox className="h-16 w-16 text-gray-400" />}
          title={t("opportunity.table.no_results", "No opportunities")}
          description={t(
            "opportunity.table.no_results_desc",
            "No opportunities match your current filters"
          )}
        />
      </motion.div>
    );
  }

  return (
    <div className="w-full">
      <Table
        noWrapper
        style={{
          tableLayout: "fixed",
          width: "100%",
          minWidth: tableWidthInfo.minWidth
            ? `${tableWidthInfo.minWidth}px`
            : "100%",
        }}
      >
        <TableHeader className="bg-background sticky top-0 z-10 shadow-[0_1px_3px_rgba(0,0,0,0.1)]">
          <TableRow>
            {columnsToRender.length > 0 ? (
              columnsToRender.map((col, index) =>
                renderHeaderCell(col, index === columnsToRender.length - 1)
              )
            ) : (
              <>
                {isVisible("checkbox") && (
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allSelected}
                      ref={(el) => {
                        if (el) {
                          (el as unknown as HTMLInputElement).indeterminate =
                            someSelected;
                        }
                      }}
                      onCheckedChange={handleSelectAll}
                      aria-label={t(
                        "opportunity.table.select_all",
                        "Select all"
                      )}
                    />
                  </TableHead>
                )}
                {isVisible("company_name") && (
                  <SortableTableHead
                    column="lead.company_name"
                    label={t("opportunity.table.columns.company", "Company")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[200px]"
                  />
                )}
                {isVisible("contact") && (
                  <SortableTableHead
                    column="lead.last_name"
                    label={t("opportunity.table.columns.contact", "Contact")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[160px]"
                  />
                )}
                {isVisible("expected_value") && (
                  <SortableTableHead
                    column="expected_value"
                    label={t("opportunity.table.columns.value", "Value")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[120px]"
                  />
                )}
                {isVisible("probability_percent") && (
                  <SortableTableHead
                    column="probability_percent"
                    label={t("opportunity.table.columns.probability", "Prob.")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[100px]"
                  />
                )}
                {isVisible("stage") && (
                  <SortableTableHead
                    column="stage"
                    label={t("opportunity.table.columns.stage", "Stage")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[130px]"
                  />
                )}
                {isVisible("assigned_to") && (
                  <SortableTableHead
                    column="assigned_to"
                    label={t("opportunity.table.columns.assigned", "Assigned")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[140px]"
                  />
                )}
                {isVisible("expected_close_date") && (
                  <SortableTableHead
                    column="expected_close_date"
                    label={t(
                      "opportunity.table.columns.close_date",
                      "Close Date"
                    )}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[130px]"
                  />
                )}
                {isVisible("days_in_stage") && (
                  <SortableTableHead
                    column="days_in_stage"
                    label={t("opportunity.table.columns.days_in_stage", "Days")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[100px]"
                  />
                )}
                {isVisible("actions") && (
                  <TableHead className="w-[140px]">
                    {t("opportunity.table.columns.actions", "Actions")}
                  </TableHead>
                )}
              </>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedOpportunities.map((opportunity) => (
            <OpportunitiesTableRow
              key={opportunity.id}
              opportunity={opportunity}
              isSelected={selectedIds.includes(opportunity.id)}
              onSelect={handleRowSelect}
              onClick={() => onRowClick?.(opportunity.id)}
              onDoubleClick={() => onRowDoubleClick?.(opportunity.id)}
              onView={onRowDoubleClick}
              visibleColumnKeys={visibleColumnKeys}
              orderedVisibleColumns={orderedVisibleColumns}
              getColumnWidth={getColumnWidth}
              onStageChange={onStageChange}
              onEdit={onEdit}
              onMarkWon={onMarkWon}
              onMarkLost={onMarkLost}
              onDelete={onDelete}
              onAssign={onAssign}
              owners={owners}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
