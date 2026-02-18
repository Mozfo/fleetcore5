"use client";

import { memo } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Car, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/card";
import { Item as KanbanItem } from "@/components/ui/kanban";
import { FCBadge } from "@/components/fc";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { cn } from "@/lib/utils";
import { LeadContextMenu } from "@/components/crm/leads/LeadContextMenu";
import type { Lead, LeadStatus } from "../types/lead.types";

// ── Status → FCBadge variant mapping ────────────────────────────────

type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "primary"
  | "default";

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  callback_requested: "warning",
  demo: "info",
  proposal_sent: "warning",
  converted: "success",
  lost: "danger",
  nurturing: "info",
};

// ── Status → color dot mapping ──────────────────────────────────────

const STATUS_DOT_COLOR: Record<string, string> = {
  callback_requested: "bg-amber-500",
  demo: "bg-blue-500",
  proposal_sent: "bg-orange-500",
  converted: "bg-green-500",
  lost: "bg-red-500",
  nurturing: "bg-purple-500",
};

// ── Utilities ───────────────────────────────────────────────────────

function getInitials(assigned: {
  first_name: string;
  last_name: string | null;
}) {
  return `${assigned.first_name?.[0]?.toUpperCase() || ""}${assigned.last_name?.[0]?.toUpperCase() || ""}`;
}

function formatTimeAgo(
  isoDate: string,
  t: (key: string, options?: Record<string, unknown>) => string
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

/** Check if callback_requested lead has exceeded 48h and return days overdue */
function getOverdueDays(lead: Lead): number | null {
  if (lead.status !== "callback_requested") return null;
  const created = new Date(lead.created_at);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  if (hoursDiff <= 48) return null;
  return Math.floor(hoursDiff / 24);
}

// ── Component ───────────────────────────────────────────────────────

interface LeadsKanbanCardProps {
  lead: Lead;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
}

export const LeadsKanbanCard = memo(
  function LeadsKanbanCard({
    lead,
    onView,
    onEdit,
    onConvert,
    onDisqualify,
    onDelete,
    onStatusChange,
  }: LeadsKanbanCardProps) {
    const { t } = useTranslation("crm");
    const params = useParams();
    const locale = (params.locale as string) || "en";
    const { getLabel: getStageLabel } = useLeadStages();

    const score = lead.qualification_score;
    const overdueDays = getOverdueDays(lead);

    return (
      <KanbanItem value={lead.id} asHandle>
        <LeadContextMenu
          lead={lead}
          onView={() => onView?.(lead.id)}
          onEdit={() => onEdit?.(lead.id)}
          onStatusChange={(status) => onStatusChange?.(lead.id, status)}
          onConvert={() => onConvert?.(lead.id)}
          onDisqualify={() => onDisqualify?.(lead.id)}
          onDelete={() => onDelete?.(lead.id)}
        >
          <Card
            onClick={() => onView?.(lead.id)}
            className={cn(
              "bg-background cursor-grab border p-3 shadow-sm transition-shadow hover:shadow-md",
              overdueDays !== null && "ring-2 ring-red-500/50"
            )}
          >
            {/* Overdue Indicator */}
            {overdueDays !== null && (
              <div className="mb-1.5 flex items-center gap-1 text-[10px] font-medium text-red-600 dark:text-red-400">
                <AlertTriangle className="size-3" />
                {t("leads.kanban.overdue_days", { count: overdueDays })}
              </div>
            )}

            {/* Line 1: Company + Flag */}
            <div className="flex items-center justify-between gap-1.5">
              <h4 className="truncate text-sm font-semibold">
                {lead.company_name || "Unknown Company"}
              </h4>
              {lead.country?.flag_emoji && (
                <span
                  className="flex-shrink-0 text-sm"
                  title={lead.country.country_name_en}
                >
                  {lead.country.flag_emoji}
                </span>
              )}
            </div>

            {/* Line 2: Contact name */}
            {(lead.first_name || lead.last_name) && (
              <p className="text-muted-foreground mt-0.5 truncate text-xs">
                {lead.first_name || ""} {lead.last_name || ""}
              </p>
            )}

            {/* Line 3: Metrics (fleet + score + stage) */}
            <div className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
              {lead.fleet_size && (
                <span className="inline-flex items-center gap-0.5">
                  <Car className="size-3" />
                  {lead.fleet_size}
                </span>
              )}
              {score !== null && score !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1 py-px text-[10px] font-bold",
                    score >= 70
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : score >= 40
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  )}
                >
                  {score}
                </span>
              )}
              {lead.lead_stage && (
                <span className="truncate">
                  {getStageLabel(lead.lead_stage, locale)}
                </span>
              )}
            </div>

            {/* Line 4: Status badge */}
            <div className="mt-2">
              <FCBadge
                variant={STATUS_VARIANT[lead.status] || "default"}
                size="sm"
              >
                {t(`leads.status.${lead.status}`)}
              </FCBadge>
            </div>

            {/* Line 5: Avatar + Time */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {lead.assigned_to && (
                  <div
                    className="bg-muted-foreground flex size-5 items-center justify-center rounded-full text-[9px] font-medium text-white"
                    title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`}
                  >
                    {getInitials(lead.assigned_to)}
                  </div>
                )}
              </div>
              <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                <Clock className="size-3" />
                {formatTimeAgo(lead.created_at, t)}
              </span>
            </div>
          </Card>
        </LeadContextMenu>
      </KanbanItem>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.lead.id === nextProps.lead.id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.updated_at === nextProps.lead.updated_at &&
      prevProps.lead.qualification_score ===
        nextProps.lead.qualification_score &&
      prevProps.lead.assigned_to?.id === nextProps.lead.assigned_to?.id
    );
  }
);

// ── Overlay card (semi-transparent during drag) ─────────────────────

export { STATUS_DOT_COLOR };
