/**
 * LeadsTableRow - Row de table pour un lead avec actions hover
 * E1-D: Support pour orderedVisibleColumns (column reordering)
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
  Phone,
  Mail,
  Eye,
  MoreHorizontal,
  Pencil,
  ArrowRightCircle,
  Trash,
  User,
  ExternalLink,
  Linkedin,
  Check,
  X,
  Building2,
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
import type { Lead, LeadStatus } from "@/types/crm";
import type { ColumnConfig } from "@/lib/config/leads-columns";
import { LeadContextMenu } from "./LeadContextMenu";

interface LeadsTableRowProps {
  lead: Lead;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onAssign?: (leadId: string, assigneeId: string | null) => void;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
  visibleColumnKeys?: string[];
  orderedVisibleColumns?: ColumnConfig[];
  // E1-E: Column resizing
  getColumnWidth?: (key: string) => number;
}

/**
 * Retourne les initiales d'un lead
 */
function _getInitials(lead: Lead): string {
  const first = lead.first_name?.[0]?.toUpperCase() || "";
  const last = lead.last_name?.[0]?.toUpperCase() || "";
  return `${first}${last}` || "?";
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
  isoDate: string,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
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
 * Formate une date en format court (ex: "Dec 15, 2024")
 */
function formatDate(dateValue: Date | string | null): string {
  if (!dateValue) return "—";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formate une date avec l'heure (ex: "Dec 15, 2024 14:30")
 */
function formatDateTime(dateValue: Date | string | null): string {
  if (!dateValue) return "—";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Tronque une URL pour l'affichage
 */
function truncateUrl(url: string, maxLength: number = 30): string {
  // Remove protocol
  const cleanUrl = url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (cleanUrl.length <= maxLength) return cleanUrl;
  return cleanUrl.substring(0, maxLength) + "...";
}

/**
 * Retourne la couleur du badge score
 */
function getScoreColor(score: number | null): string {
  if (score === null) return "bg-gray-100 text-gray-600";
  if (score < 40)
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (score < 70)
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

// Default visible columns if not provided
// B2B Company-First: Company before Contact
const DEFAULT_VISIBLE_COLUMNS = [
  "checkbox",
  "company_name", // PRIMARY column
  "contact", // SECONDARY column
  "ref", // renamed from lead_code
  "country_code",
  "qualification_score",
  "lead_stage",
  "assigned_to",
  "created_at",
  // Additional visible columns
  "source",
  "next_action_date",
  "current_software",
  "city",
  "actions",
];

export const LeadsTableRow = memo(
  function LeadsTableRow({
    lead,
    isSelected,
    onSelect,
    onClick,
    onDoubleClick,
    onView,
    onEdit,
    onConvert,
    onDelete,
    onStatusChange,
    onAssign,
    owners = [],
    visibleColumnKeys = DEFAULT_VISIBLE_COLUMNS,
    orderedVisibleColumns,
    getColumnWidth,
  }: LeadsTableRowProps) {
    const { t } = useTranslation("crm");

    // Click delay mechanism to distinguish single click from double click
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const CLICK_DELAY = 250; // ms to wait before confirming single click

    // Handle click with delay - waits to see if double click follows
    const handleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        onClick?.();
        clickTimeoutRef.current = null;
      }, CLICK_DELAY);
    }, [onClick]);

    // Handle double click - cancels pending single click
    const handleDoubleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      onDoubleClick?.();
    }, [onDoubleClick]);

    // Helper to check if column is visible (fallback)
    const isVisible = (key: string) => visibleColumnKeys.includes(key);

    // Cell renderers for each column type (E1-D)
    const cellRenderers: Record<string, () => ReactNode> = {
      checkbox: () => (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(lead.id, !!checked)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${lead.first_name} ${lead.last_name}`}
          />
        </TableCell>
      ),

      // Renamed: lead_code → ref
      ref: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm text-gray-500">
            {lead.lead_code || "—"}
          </span>
        </TableCell>
      ),

      // B2B Company-First: Contact is SECONDARY (no avatar)
      contact: () => (
        <TableCell className="w-[160px] overflow-hidden">
          <span className="truncate text-sm text-gray-600 dark:text-gray-400">
            {lead.first_name} {lead.last_name}
          </span>
        </TableCell>
      ),

      email: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <span className="block truncate text-sm">{lead.email || "—"}</span>
        </TableCell>
      ),

      phone: () => (
        <TableCell className="w-[140px] overflow-hidden">
          <span className="block truncate text-sm">{lead.phone || "—"}</span>
        </TableCell>
      ),

      // B2B Company-First: Company is PRIMARY (with icon, font-medium)
      company_name: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="truncate text-sm font-medium">
              {lead.company_name || "—"}
            </span>
          </div>
        </TableCell>
      ),

      fleet_size: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.fleet_size || "—"}
          </span>
        </TableCell>
      ),

      country_code: () => (
        <TableCell className="w-[100px] overflow-hidden">
          {lead.country ? (
            <div className="flex items-center gap-1.5">
              <span className="text-base">{lead.country.flag_emoji}</span>
              <span className="truncate text-sm">
                {lead.country.country_code}
              </span>
            </div>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      qualification_score: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              getScoreColor(lead.qualification_score)
            )}
          >
            {lead.qualification_score !== null
              ? `${lead.qualification_score}/100`
              : "—"}
          </Badge>
        </TableCell>
      ),

      fit_score: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn("text-xs font-medium", getScoreColor(lead.fit_score))}
          >
            {lead.fit_score !== null ? `${lead.fit_score}/100` : "—"}
          </Badge>
        </TableCell>
      ),

      engagement_score: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-medium",
              getScoreColor(lead.engagement_score)
            )}
          >
            {lead.engagement_score !== null
              ? `${lead.engagement_score}/100`
              : "—"}
          </Badge>
        </TableCell>
      ),

      lead_stage: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <Badge variant="outline" className="max-w-full truncate text-xs">
            {t(`leads.card.stage.${lead.lead_stage}`)}
          </Badge>
        </TableCell>
      ),

      status: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge variant="outline" className="max-w-full truncate text-xs">
            {t(`leads.status.${lead.status}`)}
          </Badge>
        </TableCell>
      ),

      priority: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <Badge variant="outline" className="max-w-full truncate text-xs">
            {lead.priority ? t(`leads.card.priority.${lead.priority}`) : "—"}
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
                  {lead.assigned_to ? (
                    <>
                      <div
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
                        title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`}
                      >
                        {getAssignedInitials(lead.assigned_to)}
                      </div>
                      <span className="truncate text-sm">
                        {lead.assigned_to.first_name}
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                        <User className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-muted-foreground text-sm">
                        {t("leads.drawer.empty.unassigned")}
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
                      onAssign(lead.id, owner.id);
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                      {owner.first_name?.[0]?.toUpperCase()}
                      {owner.last_name?.[0]?.toUpperCase()}
                    </div>
                    <span>
                      {owner.first_name} {owner.last_name || ""}
                    </span>
                    {lead.assigned_to?.id === owner.id && (
                      <Check className="ml-auto h-4 w-4 text-green-500" />
                    )}
                  </DropdownMenuItem>
                ))}
                {lead.assigned_to && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(lead.id, null);
                      }}
                      className="text-muted-foreground flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      <span>{t("leads.drawer.empty.unassigned")}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : lead.assigned_to ? (
            <div className="flex items-center gap-2">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
                title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`}
              >
                {getAssignedInitials(lead.assigned_to)}
              </div>
              <span className="truncate text-sm">
                {lead.assigned_to.first_name}
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

      created_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatTimeAgo(lead.created_at, t)}
          </span>
        </TableCell>
      ),

      // =====================================================
      // 20 NEW CELL RENDERERS
      // =====================================================

      // Source & Attribution
      source: () => (
        <TableCell className="w-[120px] overflow-hidden">
          {lead.source ? (
            <Badge variant="outline" className="max-w-full truncate text-xs">
              {lead.source}
            </Badge>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      utm_source: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.utm_source || "—"}
          </span>
        </TableCell>
      ),

      utm_medium: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.utm_medium || "—"}
          </span>
        </TableCell>
      ),

      utm_campaign: () => (
        <TableCell className="w-[140px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.utm_campaign || "—"}
          </span>
        </TableCell>
      ),

      // Company details
      industry: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">{lead.industry || "—"}</span>
        </TableCell>
      ),

      company_size: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.company_size
              ? `${lead.company_size} ${t("leads.drawer.fields.employees")}`
              : "—"}
          </span>
        </TableCell>
      ),

      current_software: () => (
        <TableCell className="w-[140px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.current_software || "—"}
          </span>
        </TableCell>
      ),

      website_url: () => (
        <TableCell className="w-[180px] overflow-hidden">
          {lead.website_url ? (
            <a
              href={
                lead.website_url.startsWith("http")
                  ? lead.website_url
                  : `https://${lead.website_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">{truncateUrl(lead.website_url)}</span>
            </a>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      linkedin_url: () => (
        <TableCell className="w-[180px] overflow-hidden">
          {lead.linkedin_url ? (
            <a
              href={
                lead.linkedin_url.startsWith("http")
                  ? lead.linkedin_url
                  : `https://${lead.linkedin_url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
              onClick={(e) => e.stopPropagation()}
            >
              <Linkedin className="h-3 w-3 shrink-0" />
              <span className="truncate">{truncateUrl(lead.linkedin_url)}</span>
            </a>
          ) : (
            <span className="text-sm">—</span>
          )}
        </TableCell>
      ),

      // Location
      city: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">{lead.city || "—"}</span>
        </TableCell>
      ),

      // Dates
      next_action_date: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(lead.next_action_date)}
          </span>
        </TableCell>
      ),

      updated_at: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {lead.updated_at ? formatTimeAgo(lead.updated_at, t) : "—"}
          </span>
        </TableCell>
      ),

      qualified_date: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(lead.qualified_date)}
          </span>
        </TableCell>
      ),

      converted_date: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(lead.converted_date)}
          </span>
        </TableCell>
      ),

      // GDPR
      gdpr_consent: () => (
        <TableCell className="w-[80px] overflow-hidden">
          {lead.gdpr_consent === true && (
            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Check className="h-3 w-3" />
            </Badge>
          )}
          {lead.gdpr_consent === false && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              <X className="h-3 w-3" />
            </Badge>
          )}
          {lead.gdpr_consent === null && <span className="text-sm">—</span>}
        </TableCell>
      ),

      consent_at: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDateTime(lead.consent_at)}
          </span>
        </TableCell>
      ),

      consent_ip: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate font-mono text-sm text-xs">
            {lead.consent_ip || "—"}
          </span>
        </TableCell>
      ),

      // Notes & Message
      message: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <span
            className="block truncate text-sm"
            title={lead.message || undefined}
          >
            {lead.message || "—"}
          </span>
        </TableCell>
      ),

      qualification_notes: () => (
        <TableCell className="w-[200px] overflow-hidden">
          <span
            className="block truncate text-sm"
            title={lead.qualification_notes || undefined}
          >
            {lead.qualification_notes || "—"}
          </span>
        </TableCell>
      ),

      // Links
      opportunity_id: () => (
        <TableCell className="w-[140px] overflow-hidden">
          {lead.opportunity_id ? (
            <Badge variant="outline" className="text-xs">
              {lead.opportunity_id.slice(0, 8)}...
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
                onView?.(lead.id);
              }}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* Call - conditional */}
            {lead.phone && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a
                  href={`tel:${lead.phone}`}
                  title="Call"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}

            {/* Email */}
            {lead.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a
                  href={`mailto:${lead.email}`}
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
                    onEdit?.(lead.id);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onConvert?.(lead.id);
                  }}
                >
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  Convert to Opportunity
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(lead.id);
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      ),
    };

    // Render cells based on orderedVisibleColumns (E1-D + E1-E) or fallback to legacy
    const renderCells = () => {
      if (orderedVisibleColumns && orderedVisibleColumns.length > 0) {
        // Dynamic rendering based on ordered columns with dynamic widths (E1-E)
        return orderedVisibleColumns.map((col, index) => {
          const renderer = cellRenderers[col.key];
          if (!renderer) return null;
          const cell = renderer();
          // Clone element with key prop and dynamic width style to avoid hydration errors
          if (isValidElement(cell)) {
            const width = getColumnWidth?.(col.key);
            const isLastColumn = index === orderedVisibleColumns.length - 1;
            const cellProps = cell.props as { style?: React.CSSProperties };
            // Last column only has minWidth to expand and fill remaining space
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
          {isVisible("lead_code") && cellRenderers.lead_code()}
          {isVisible("contact") && cellRenderers.contact()}
          {isVisible("email") && cellRenderers.email()}
          {isVisible("phone") && cellRenderers.phone()}
          {isVisible("company_name") && cellRenderers.company_name()}
          {isVisible("fleet_size") && cellRenderers.fleet_size()}
          {isVisible("country_code") && cellRenderers.country_code()}
          {isVisible("qualification_score") &&
            cellRenderers.qualification_score()}
          {isVisible("fit_score") && cellRenderers.fit_score()}
          {isVisible("engagement_score") && cellRenderers.engagement_score()}
          {isVisible("lead_stage") && cellRenderers.lead_stage()}
          {isVisible("status") && cellRenderers.status()}
          {isVisible("priority") && cellRenderers.priority()}
          {isVisible("assigned_to") && cellRenderers.assigned_to()}
          {isVisible("created_at") && cellRenderers.created_at()}
          {isVisible("actions") && cellRenderers.actions()}
        </>
      );
    };

    return (
      <LeadContextMenu
        lead={lead}
        onView={() => onView?.(lead.id)}
        onEdit={() => onEdit?.(lead.id)}
        onStatusChange={(status) => onStatusChange?.(lead.id, status)}
        onConvert={() => onConvert?.(lead.id)}
        onDelete={() => onDelete?.(lead.id)}
      >
        <TableRow
          className={cn("group cursor-pointer", isSelected && "bg-primary/5")}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
        >
          {renderCells()}
        </TableRow>
      </LeadContextMenu>
    );
  },
  (prevProps, nextProps) => {
    // PERF: Comparaison intelligente - re-render uniquement si données critiques changent
    // Note: Arrays comparés avec JSON.stringify car === compare les références
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
      prevProps.lead.id === nextProps.lead.id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.updated_at === nextProps.lead.updated_at &&
      prevProps.lead.assigned_to?.id === nextProps.lead.assigned_to?.id &&
      prevProps.isSelected === nextProps.isSelected &&
      sameVisibleKeys &&
      (sameOrderedColumns ?? true)
    );
  }
);
