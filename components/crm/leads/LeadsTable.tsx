/**
 * LeadsTable - Table principale pour afficher les leads
 * Tri, sélection, actions hover
 * E1-D: Support pour orderedVisibleColumns (column reordering)
 * E1-E: Support pour colonnes redimensionnables
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
import { LeadsTableRow } from "./LeadsTableRow";
import type { Lead, LeadStatus } from "@/types/crm";
import {
  DEFAULT_LEADS_COLUMNS,
  getVisibleColumnKeys,
  type ColumnConfig,
} from "@/lib/config/leads-columns";

interface LeadsTableProps {
  leads: Lead[];
  isLoading?: boolean;
  onRowClick?: (leadId: string) => void;
  onRowDoubleClick?: (leadId: string) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (column: string, direction: "asc" | "desc") => void;
  onCreate?: () => void;
  visibleColumnKeys?: string[];
  orderedVisibleColumns?: ColumnConfig[];
  // E1-E: Column resizing
  getColumnWidth?: (key: string) => number;
  onColumnResize?: (key: string, width: number) => void;
  // E4: Context menu actions
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  // Inline assignment
  onAssign?: (leadId: string, assigneeId: string | null) => void;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
}

// Derive DEFAULT_VISIBLE_COLUMNS from config (single source of truth)
const DEFAULT_VISIBLE_COLUMNS = getVisibleColumnKeys(DEFAULT_LEADS_COLUMNS);

// Build SORTABLE_COLUMN_MAP dynamically from config
// Special case: "contact" column sorts by "last_name"
const SORTABLE_COLUMN_MAP: Record<string, string> =
  DEFAULT_LEADS_COLUMNS.filter((col) => col.sortable).reduce(
    (acc, col) => {
      acc[col.key] = col.key === "contact" ? "last_name" : col.key;
      return acc;
    },
    {} as Record<string, string>
  );

// SortableColumn type derived from sortable columns in config
type SortableColumn = string; // Dynamic - validated at runtime via SORTABLE_COLUMN_MAP

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
 * E1-E: Resizable table head (TanStack pattern)
 * Simple and clean: hidden by default, visible on hover, blue when active
 * Source: https://github.com/TanStack/table/blob/main/examples/react/column-resizing-performant
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

  // For expandable columns (last column), only set minWidth so it expands to fill remaining space
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

      {/* Resize handle - TanStack pattern: hidden until hover, blue when active */}
      {canResize && (
        <div
          className={cn(
            "absolute top-0 right-0 h-full w-[5px] cursor-col-resize touch-none select-none",
            // Hidden by default, visible on parent hover or when resizing
            isResizing
              ? "bg-blue-500 opacity-100"
              : "bg-black/30 opacity-0 group-hover/header:opacity-100 dark:bg-white/30"
          )}
          onMouseDown={handleMouseDown}
          onDoubleClick={(e) => {
            e.stopPropagation();
            // Reset to default width on double-click (TanStack feature)
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

export function LeadsTable({
  leads,
  isLoading = false,
  onRowClick,
  onRowDoubleClick,
  selectedIds = [],
  onSelectionChange,
  sortColumn = "created_at",
  sortDirection = "desc",
  onSortChange,
  onCreate,
  visibleColumnKeys = DEFAULT_VISIBLE_COLUMNS,
  orderedVisibleColumns,
  getColumnWidth,
  onColumnResize,
  // E4: Context menu actions
  onStatusChange,
  onEdit,
  onConvert,
  onDelete,
  // Inline assignment
  onAssign,
  owners = [],
}: LeadsTableProps) {
  const { t } = useTranslation("crm");

  // Helper to check if column is visible
  const isVisible = (key: string) => visibleColumnKeys.includes(key);

  // Dynamic sort value getter (no hardcoded switch)
  const getSortValue = useCallback(
    (lead: Lead, column: string): string | number => {
      // Date columns - convert to timestamp for numeric comparison
      const dateColumns = [
        "created_at",
        "updated_at",
        "qualified_date",
        "converted_date",
        "next_action_date",
        "consent_at",
      ];
      if (dateColumns.includes(column)) {
        const value = lead[column as keyof Lead];
        if (!value) return 0;
        const date =
          typeof value === "string" ? new Date(value) : (value as Date);
        return date.getTime();
      }

      // Score columns - handle null as -1 for proper sorting
      const scoreColumns = [
        "qualification_score",
        "fit_score",
        "engagement_score",
        "company_size",
      ];
      if (scoreColumns.includes(column)) {
        const value = lead[column as keyof Lead];
        return (value as number | null) ?? -1;
      }

      // GDPR consent - boolean to number
      if (column === "gdpr_consent") {
        return lead.gdpr_consent === true
          ? 1
          : lead.gdpr_consent === false
            ? 0
            : -1;
      }

      // Special case: assigned_to - nested object
      if (column === "assigned_to") {
        return lead.assigned_to?.first_name || "";
      }

      // Default: access property directly as string
      const value = lead[column as keyof Lead];
      return String(value ?? "");
    },
    []
  );

  // Trier les leads (dynamic, no hardcoded switch)
  const sortedLeads = useMemo(() => {
    if (!sortColumn) return leads;

    return [...leads].sort((a, b) => {
      const aValue = getSortValue(a, sortColumn);
      const bValue = getSortValue(b, sortColumn);

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [leads, sortColumn, sortDirection, getSortValue]);

  // Gérer le tri
  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      // Toggle direction
      const newDirection = sortDirection === "asc" ? "desc" : "asc";
      onSortChange?.(column, newDirection);
    } else {
      // New column, default to asc
      onSortChange?.(column, "asc");
    }
  };

  // Gérer la sélection d'une row
  const handleRowSelect = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange?.([...selectedIds, id]);
    } else {
      onSelectionChange?.(selectedIds.filter((sid) => sid !== id));
    }
  };

  // Gérer select all
  const allSelected = leads.length > 0 && selectedIds.length === leads.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < leads.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange?.(leads.map((l) => l.id));
    } else {
      onSelectionChange?.([]);
    }
  };

  // Current sort state
  const currentSort = { column: sortColumn, direction: sortDirection };

  // Render a single header cell based on column config (E1-D + E1-E)
  const renderHeaderCell = (col: ColumnConfig, isLastColumn: boolean) => {
    const sortableColumn = SORTABLE_COLUMN_MAP[col.key] as
      | SortableColumn
      | undefined;
    const width = getColumnWidth?.(col.key) ?? 100;
    const isLocked = col.key === "checkbox" || col.key === "actions";
    // Last column expands to fill remaining space (no fixed width, only minWidth)
    const isExpandable = isLastColumn;

    // Checkbox column - special rendering with ResizableTableHead wrapper
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
            aria-label={t("leads.table.select_all")}
          />
        </ResizableTableHead>
      );
    }

    // All other columns use ResizableTableHead with optional sorting
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

  // Get columns to render (use orderedVisibleColumns if provided, otherwise fallback)
  const columnsToRender = useMemo(
    () => orderedVisibleColumns || [],
    [orderedVisibleColumns]
  );

  // Calculate minimum table width from all column widths (E1-E fix: prevents left columns from shifting)
  // The last column (actions) will expand to fill remaining space
  const tableWidthInfo = useMemo(() => {
    if (!getColumnWidth || columnsToRender.length === 0)
      return { minWidth: undefined, fixedColumnsWidth: 0 };
    // Sum of all columns except the last one (actions)
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
              <TableHead className="w-[140px]">
                {t("leads.table.columns.code")}
              </TableHead>
              <TableHead className="w-[180px]">
                {t("leads.table.columns.contact")}
              </TableHead>
              <TableHead className="w-[180px]">
                {t("leads.table.columns.company")}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("leads.table.columns.country")}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("leads.table.columns.score")}
              </TableHead>
              <TableHead className="w-[120px]">
                {t("leads.table.columns.stage")}
              </TableHead>
              <TableHead className="w-[140px]">
                {t("leads.table.columns.assigned")}
              </TableHead>
              <TableHead className="w-[120px]">
                {t("leads.table.columns.created")}
              </TableHead>
              <TableHead className="w-[100px]">
                {t("leads.table.columns.actions")}
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
  if (leads.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <EmptyState
          icon={<Inbox className="h-16 w-16 text-gray-400" />}
          title={t("leads.table.no_results")}
          description={t("leads.table.no_results_desc")}
          action={
            onCreate
              ? {
                  label: t("leads.empty.create_lead"),
                  onClick: onCreate,
                }
              : undefined
          }
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
            {/* Dynamic column headers based on orderedVisibleColumns (E1-D) */}
            {columnsToRender.length > 0 ? (
              columnsToRender.map((col, index) =>
                renderHeaderCell(col, index === columnsToRender.length - 1)
              )
            ) : (
              // Fallback to old behavior if orderedVisibleColumns not provided
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
                      aria-label={t("leads.table.select_all")}
                    />
                  </TableHead>
                )}
                {isVisible("lead_code") && (
                  <SortableTableHead
                    column="lead_code"
                    label={t("leads.table.columns.code")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[140px]"
                  />
                )}
                {isVisible("contact") && (
                  <SortableTableHead
                    column="last_name"
                    label={t("leads.table.columns.contact")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[180px]"
                  />
                )}
                {isVisible("company_name") && (
                  <SortableTableHead
                    column="company_name"
                    label={t("leads.table.columns.company")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[180px]"
                  />
                )}
                {isVisible("country_code") && (
                  <SortableTableHead
                    column="country_code"
                    label={t("leads.table.columns.country")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[100px]"
                  />
                )}
                {isVisible("qualification_score") && (
                  <SortableTableHead
                    column="qualification_score"
                    label={t("leads.table.columns.score")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[100px]"
                  />
                )}
                {isVisible("lead_stage") && (
                  <SortableTableHead
                    column="lead_stage"
                    label={t("leads.table.columns.stage")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[120px]"
                  />
                )}
                {isVisible("assigned_to") && (
                  <SortableTableHead
                    column="assigned_to"
                    label={t("leads.table.columns.assigned")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[140px]"
                  />
                )}
                {isVisible("created_at") && (
                  <SortableTableHead
                    column="created_at"
                    label={t("leads.table.columns.created")}
                    currentSort={currentSort}
                    onSort={handleSort}
                    className="w-[120px]"
                  />
                )}
                {isVisible("actions") && (
                  <TableHead className="w-[100px]">
                    {t("leads.table.columns.actions")}
                  </TableHead>
                )}
              </>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {sortedLeads.map((lead) => (
            <LeadsTableRow
              key={lead.id}
              lead={lead}
              isSelected={selectedIds.includes(lead.id)}
              onSelect={handleRowSelect}
              onClick={() => onRowClick?.(lead.id)}
              onDoubleClick={() => onRowDoubleClick?.(lead.id)}
              onView={onRowDoubleClick}
              visibleColumnKeys={visibleColumnKeys}
              orderedVisibleColumns={orderedVisibleColumns}
              getColumnWidth={getColumnWidth}
              // E4: Context menu actions
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onConvert={onConvert}
              onDelete={onDelete}
              // Inline assignment
              onAssign={onAssign}
              owners={owners}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
