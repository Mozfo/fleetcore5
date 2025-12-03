/**
 * OpportunitiesTableRow - Row de table pour une opportunity avec actions hover
 * Basé sur LeadsTableRow.tsx - même pattern
 */

"use client";

import {
  type ReactNode,
  cloneElement,
  isValidElement,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  Trophy,
  XCircle,
  Trash,
  User,
  Building2,
  DollarSign,
  Clock,
  AlertTriangle,
  Check,
  X,
  Mail,
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Opportunity, OpportunityStage } from "@/types/crm";
import type { OpportunityColumnConfig } from "@/lib/config/opportunity-columns";
import { OpportunityContextMenu } from "./OpportunityContextMenu";

interface OpportunitiesTableRowProps {
  opportunity: Opportunity & { days_in_stage?: number; is_rotting?: boolean };
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onView?: (opportunityId: string) => void;
  onEdit?: (opportunityId: string) => void;
  onStageChange?: (opportunityId: string, stage: OpportunityStage) => void;
  onMarkWon?: (opportunityId: string) => void;
  onMarkLost?: (opportunityId: string) => void;
  onDelete?: (opportunityId: string) => void;
  onAssign?: (opportunityId: string, assigneeId: string | null) => void;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
  visibleColumnKeys?: string[];
  orderedVisibleColumns?: OpportunityColumnConfig[];
  getColumnWidth?: (key: string) => number;
}

/**
 * Retourne les initiales du membre assigné
 */
function getAssignedInitials(assigned: {
  first_name: string;
  last_name: string | null;
}): string {
  const first = assigned.first_name?.[0]?.toUpperCase() || "";
  const last = assigned.last_name?.[0]?.toUpperCase() || "";
  return `${first}${last}`;
}

/**
 * Formate le temps relatif (ex: "2h ago")
 */
function formatTimeAgo(
  isoDate: string | null | undefined,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
  if (!isoDate) return "—";
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t("leads.time.just_now");
  if (seconds < 3600)
    return t("leads.time.minutes_ago", { count: Math.floor(seconds / 60) });
  if (seconds < 86400)
    return t("leads.time.hours_ago", { count: Math.floor(seconds / 3600) });
  if (seconds < 604800)
    return t("leads.time.days_ago", { count: Math.floor(seconds / 86400) });
  return t("leads.time.weeks_ago", { count: Math.floor(seconds / 604800) });
}

/**
 * Formate une date en format court
 */
function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "—";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formate une valeur monétaire
 */
function formatCurrency(
  value: number | null,
  currency: string = "EUR"
): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Retourne la couleur du badge probabilité
 */
function getProbabilityColor(percent: number | null): string {
  if (percent === null) return "bg-gray-100 text-gray-600";
  if (percent < 40)
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (percent < 70)
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

/**
 * Retourne la couleur du stage
 */
function getStageColor(stage: string): string {
  const colors: Record<string, string> = {
    qualification:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    demo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    proposal:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    negotiation:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    contract_sent:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };
  return colors[stage] || "bg-gray-100 text-gray-600";
}

/**
 * Retourne la couleur du status
 */
function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    won: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    lost: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
  };
  return colors[status] || "bg-gray-100 text-gray-600";
}

// Default visible columns
const DEFAULT_VISIBLE_COLUMNS = [
  "checkbox",
  "company_name",
  "contact",
  "expected_value",
  "probability_percent",
  "stage",
  "assigned_to",
  "expected_close_date",
  "days_in_stage",
  "actions",
];

export const OpportunitiesTableRow = memo(
  function OpportunitiesTableRow({
    opportunity,
    isSelected,
    onSelect,
    onClick,
    onDoubleClick,
    onView,
    onEdit,
    onStageChange,
    onMarkWon,
    onMarkLost,
    onDelete,
    onAssign,
    owners = [],
    visibleColumnKeys = DEFAULT_VISIBLE_COLUMNS,
    orderedVisibleColumns,
    getColumnWidth,
  }: OpportunitiesTableRowProps) {
    const { t } = useTranslation("crm");

    // Click delay mechanism to distinguish single click from double click
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const CLICK_DELAY = 250;

    const handleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        onClick?.();
        clickTimeoutRef.current = null;
      }, CLICK_DELAY);
    }, [onClick]);

    const handleDoubleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      onDoubleClick?.();
    }, [onDoubleClick]);

    const isVisible = (key: string) => visibleColumnKeys.includes(key);

    const isRotting = opportunity.is_rotting;
    const daysInStage = opportunity.days_in_stage ?? 0;

    // Cell renderers for each column type
    const cellRenderers: Record<string, () => ReactNode> = {
      checkbox: () => (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(opportunity.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${opportunity.lead?.company_name || "opportunity"}`}
          />
        </TableCell>
      ),

      company_name: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate text-sm font-medium">
              {opportunity.lead?.company_name || "—"}
            </span>
            {isRotting && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            )}
          </div>
        </TableCell>
      ),

      contact: () => (
        <TableCell className="w-[160px] overflow-hidden">
          <span className="truncate text-sm text-gray-600 dark:text-gray-400">
            {opportunity.lead
              ? `${opportunity.lead.first_name} ${opportunity.lead.last_name}`
              : "—"}
          </span>
        </TableCell>
      ),

      expected_value: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
            <DollarSign className="h-3.5 w-3.5" />
            {formatCurrency(
              opportunity.expected_value,
              opportunity.currency || "EUR"
            )}
          </div>
        </TableCell>
      ),

      probability_percent: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              getProbabilityColor(opportunity.probability_percent)
            )}
          >
            {opportunity.probability_percent !== null
              ? `${opportunity.probability_percent}%`
              : "—"}
          </Badge>
        </TableCell>
      ),

      forecast_value: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(
              opportunity.forecast_value,
              opportunity.currency || "EUR"
            )}
          </span>
        </TableCell>
      ),

      stage: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn(
              "max-w-full truncate text-xs",
              getStageColor(opportunity.stage)
            )}
          >
            {t(`opportunity.stages.${opportunity.stage}`, opportunity.stage)}
          </Badge>
        </TableCell>
      ),

      status: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn(
              "max-w-full truncate text-xs",
              getStatusColor(opportunity.status)
            )}
          >
            {t(`opportunity.status.${opportunity.status}`, opportunity.status)}
          </Badge>
        </TableCell>
      ),

      assigned_to: () => (
        <TableCell className="w-[140px] overflow-hidden">
          {onAssign && owners.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {opportunity.assignedTo ? (
                    <>
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white"
                        title={`${opportunity.assignedTo.first_name} ${opportunity.assignedTo.last_name || ""}`}
                      >
                        {getAssignedInitials(opportunity.assignedTo)}
                      </div>
                      <span className="truncate text-sm">
                        {opportunity.assignedTo.first_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {t("leads.drawer.empty.unassigned", "Unassigned")}
                      </span>
                    </>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {owners.map((owner) => (
                  <DropdownMenuItem
                    key={owner.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssign(opportunity.id, owner.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                      {owner.first_name?.[0]?.toUpperCase()}
                      {owner.last_name?.[0]?.toUpperCase()}
                    </div>
                    <span>
                      {owner.first_name} {owner.last_name || ""}
                    </span>
                    {opportunity.assignedTo?.id === owner.id && (
                      <Check className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                {opportunity.assignedTo && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(opportunity.id, null);
                      }}
                      className="text-muted-foreground flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      <span>
                        {t("leads.drawer.empty.unassigned", "Unassigned")}
                      </span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : opportunity.assignedTo ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white"
                title={`${opportunity.assignedTo.first_name} ${opportunity.assignedTo.last_name || ""}`}
              >
                {getAssignedInitials(opportunity.assignedTo)}
              </div>
              <span className="truncate text-sm">
                {opportunity.assignedTo.first_name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                <User className="h-3 w-3 text-gray-400" />
              </div>
              <span className="text-sm">—</span>
            </div>
          )}
        </TableCell>
      ),

      expected_close_date: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(opportunity.expected_close_date)}
          </span>
        </TableCell>
      ),

      days_in_stage: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <div
            className={cn(
              "flex items-center gap-1 text-sm",
              isRotting ? "text-red-600 dark:text-red-400" : "text-gray-500"
            )}
          >
            <Clock className="h-3 w-3" />
            <span>{daysInStage}d</span>
          </div>
        </TableCell>
      ),

      country_code: () => (
        <TableCell className="w-[100px] overflow-hidden">
          {opportunity.lead?.country ? (
            <div className="flex items-center gap-1.5">
              <span className="text-base">
                {opportunity.lead.country.flag_emoji}
              </span>
              <span className="truncate text-sm">
                {opportunity.lead.country.country_code}
              </span>
            </div>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      created_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatTimeAgo(opportunity.created_at, t)}
          </span>
        </TableCell>
      ),

      updated_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatTimeAgo(opportunity.updated_at, t)}
          </span>
        </TableCell>
      ),

      won_date: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(opportunity.won_date)}
          </span>
        </TableCell>
      ),

      lost_date: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(opportunity.lost_date)}
          </span>
        </TableCell>
      ),

      won_value: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="text-sm text-green-600 dark:text-green-400">
            {formatCurrency(
              opportunity.won_value,
              opportunity.currency || "EUR"
            )}
          </span>
        </TableCell>
      ),

      currency: () => (
        <TableCell className="w-[80px] overflow-hidden">
          <span className="text-sm">{opportunity.currency || "EUR"}</span>
        </TableCell>
      ),

      discount_amount: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <span className="text-sm">
            {opportunity.discount_amount !== null
              ? formatCurrency(
                  opportunity.discount_amount,
                  opportunity.currency || "EUR"
                )
              : "—"}
          </span>
        </TableCell>
      ),

      notes: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <span
            className="block truncate text-sm"
            title={opportunity.notes || undefined}
          >
            {opportunity.notes || "—"}
          </span>
        </TableCell>
      ),

      is_rotting: () => (
        <TableCell className="w-[80px] overflow-hidden">
          {isRotting ? (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <AlertTriangle className="h-3 w-3" />
            </Badge>
          ) : (
            <span className="text-sm text-gray-400">—</span>
          )}
        </TableCell>
      ),

      lead_id: () => (
        <TableCell className="w-[140px] overflow-hidden">
          {opportunity.lead_id ? (
            <Badge variant="outline" className="text-xs">
              {opportunity.lead_id.slice(0, 8)}...
            </Badge>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      actions: () => (
        <TableCell className="w-[140px]">
          <div
            className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(opportunity.id);
              }}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Email - conditional */}
            {opportunity.lead?.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a
                  href={`mailto:${opportunity.lead.email}`}
                  title="Email"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(opportunity.id);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("opportunity.context_menu.edit", "Edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkWon?.(opportunity.id);
                  }}
                  className="text-green-600 focus:text-green-600"
                  disabled={opportunity.status !== "open"}
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  {t("opportunity.context_menu.mark_won", "Mark as Won")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkLost?.(opportunity.id);
                  }}
                  className="text-orange-600 focus:text-orange-600"
                  disabled={opportunity.status !== "open"}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("opportunity.context_menu.mark_lost", "Mark as Lost")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(opportunity.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t("opportunity.context_menu.delete", "Delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      ),
    };

    // Render cells based on orderedVisibleColumns or fallback to legacy
    const renderCells = () => {
      if (orderedVisibleColumns && orderedVisibleColumns.length > 0) {
        return orderedVisibleColumns.map((col, index) => {
          const renderer = cellRenderers[col.key];
          if (!renderer) return null;
          const cell = renderer();
          if (isValidElement(cell)) {
            const width = getColumnWidth?.(col.key);
            const isLastColumn = index === orderedVisibleColumns.length - 1;
            const cellProps = cell.props as { style?: React.CSSProperties };
            const widthStyle = width
              ? isLastColumn
                ? { minWidth: `${width}px` }
                : { width: `${width}px`, minWidth: `${width}px` }
              : {};
            const mergedStyle = { ...(cellProps.style || {}), ...widthStyle };
            return cloneElement(
              cell as React.ReactElement<{
                key?: string;
                style?: React.CSSProperties;
              }>,
              {
                key: col.key,
                style: mergedStyle,
              }
            );
          }
          return null;
        });
      }

      // Fallback to legacy static rendering
      return (
        <>
          {isVisible("checkbox") && cellRenderers.checkbox()}
          {isVisible("company_name") && cellRenderers.company_name()}
          {isVisible("contact") && cellRenderers.contact()}
          {isVisible("expected_value") && cellRenderers.expected_value()}
          {isVisible("probability_percent") &&
            cellRenderers.probability_percent()}
          {isVisible("forecast_value") && cellRenderers.forecast_value()}
          {isVisible("stage") && cellRenderers.stage()}
          {isVisible("status") && cellRenderers.status()}
          {isVisible("assigned_to") && cellRenderers.assigned_to()}
          {isVisible("expected_close_date") &&
            cellRenderers.expected_close_date()}
          {isVisible("days_in_stage") && cellRenderers.days_in_stage()}
          {isVisible("country_code") && cellRenderers.country_code()}
          {isVisible("created_at") && cellRenderers.created_at()}
          {isVisible("actions") && cellRenderers.actions()}
        </>
      );
    };

    return (
      <OpportunityContextMenu
        opportunity={opportunity}
        onView={() => onView?.(opportunity.id)}
        onEdit={() => onEdit?.(opportunity.id)}
        onStageChange={(stage) => onStageChange?.(opportunity.id, stage)}
        onMarkWon={() => onMarkWon?.(opportunity.id)}
        onMarkLost={() => onMarkLost?.(opportunity.id)}
        onDelete={() => onDelete?.(opportunity.id)}
      >
        <TableRow
          className={cn(
            "group cursor-pointer",
            isSelected && "bg-primary/5",
            isRotting && "bg-red-50/50 dark:bg-red-900/10"
          )}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {renderCells()}
        </TableRow>
      </OpportunityContextMenu>
    );
  },
  (prevProps, nextProps) => {
    const sameVisibleKeys =
      prevProps.visibleColumnKeys?.length ===
        nextProps.visibleColumnKeys?.length &&
      JSON.stringify(prevProps.visibleColumnKeys) ===
        JSON.stringify(nextProps.visibleColumnKeys);

    const sameOrderedColumns =
      prevProps.orderedVisibleColumns?.length ===
        nextProps.orderedVisibleColumns?.length &&
      prevProps.orderedVisibleColumns?.every(
        (col, i) => col.key === nextProps.orderedVisibleColumns?.[i]?.key
      );

    return (
      prevProps.opportunity.id === nextProps.opportunity.id &&
      prevProps.opportunity.stage === nextProps.opportunity.stage &&
      prevProps.opportunity.status === nextProps.opportunity.status &&
      prevProps.opportunity.updated_at === nextProps.opportunity.updated_at &&
      prevProps.opportunity.assignedTo?.id ===
        nextProps.opportunity.assignedTo?.id &&
      prevProps.isSelected === nextProps.isSelected &&
      sameVisibleKeys &&
      (sameOrderedColumns ?? true)
    );
  }
);
