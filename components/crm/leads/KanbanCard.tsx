/**
 * KanbanCard - Salesforce Cosmos style Kanban card
 *
 * Compact, professional, vivid status badges.
 * No gradient hover, no hover action bar.
 * Draggable via @dnd-kit. Right-click context menu for actions.
 */

"use client";

import { useRef, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Car } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { FCBadge } from "@/components/fc";
import { getStatusBorderLeft } from "@/lib/utils/status-colors";
import type { Lead, LeadStatus } from "@/types/crm";
import { LeadContextMenu } from "./LeadContextMenu";

// Map lead status → FCBadge variant
type BadgeVariant =
  | "success"
  | "danger"
  | "warning"
  | "info"
  | "primary"
  | "default";
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  new: "primary",
  email_verified: "info",
  callback_requested: "warning",
  demo: "info",
  proposal_sent: "warning",
  payment_pending: "warning",
  converted: "success",
  lost: "danger",
  nurturing: "info",
  disqualified: "default",
};

// Left border color now comes from centralized STATUS_BORDER_LEFT

interface KanbanCardProps {
  lead: Lead;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isDragging?: boolean;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
}

function getInitials(assigned: {
  first_name: string;
  last_name: string | null;
}) {
  return `${assigned.first_name?.[0]?.toUpperCase() || ""}${assigned.last_name?.[0]?.toUpperCase() || ""}`;
}

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

export const KanbanCard = memo(
  function KanbanCard({
    lead,
    onClick,
    onDoubleClick,
    isDragging,
    onView,
    onEdit,
    onConvert,
    onDisqualify,
    onDelete,
    onStatusChange,
  }: KanbanCardProps) {
    const { t } = useTranslation("crm");
    const params = useParams();
    const locale = (params.locale as string) || "en";
    const { getLabel: getStageLabel } = useLeadStages();

    // Click delay to distinguish single vs double click
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const CLICK_DELAY = 250;

    const handleClick = useCallback(() => {
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
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

    // dnd-kit draggable
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: isBeingDragged,
    } = useDraggable({ id: lead.id });

    const showDraggingState = isDragging || isBeingDragged;
    const score = lead.qualification_score;

    return (
      <LeadContextMenu
        lead={lead}
        onView={() => onView?.(lead.id)}
        onEdit={() => onEdit?.(lead.id)}
        onStatusChange={(status) => onStatusChange?.(lead.id, status)}
        onConvert={() => onConvert?.(lead.id)}
        onDisqualify={() => onDisqualify?.(lead.id)}
        onDelete={() => onDelete?.(lead.id)}
        disabled={showDraggingState}
      >
        <motion.div
          ref={setNodeRef}
          data-testid="lead-card"
          animate={
            transform
              ? {
                  x: transform.x,
                  y: transform.y,
                  scale: showDraggingState ? 1.02 : 1,
                  zIndex: showDraggingState ? 50 : 0,
                }
              : { x: 0, y: 0, scale: 1, zIndex: 0 }
          }
          transition={{
            duration: showDraggingState ? 0 : 0.2,
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          style={{ touchAction: "none" }}
          {...attributes}
          {...listeners}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "border-border bg-card cursor-grab rounded-r-lg border border-l-[3px] p-2.5 shadow-sm",
            "transition-all duration-150",
            "hover:shadow-md",
            getStatusBorderLeft(lead.status),
            showDraggingState &&
              "ring-primary cursor-grabbing opacity-60 shadow-lg ring-1"
          )}
        >
          {/* Line 0: Lead Code — FIRST, prominent */}
          {lead.lead_code && (
            <p className="text-primary truncate font-mono text-xs font-medium">
              {lead.lead_code}
            </p>
          )}

          {/* Line 1: Company + Flag */}
          <div className="mt-0.5 flex items-center justify-between gap-1.5">
            <h4 className="text-foreground truncate text-[13px] font-bold">
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
            <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
              {lead.first_name || ""} {lead.last_name || ""}
            </p>
          )}

          {/* Line 3: Metrics (fleet + score + stage) */}
          <div className="text-muted-foreground mt-1.5 flex items-center gap-2 text-[11px]">
            {lead.fleet_size && (
              <span className="inline-flex items-center gap-0.5">
                <Car className="h-3 w-3" />
                {lead.fleet_size}
              </span>
            )}
            {score !== null && score !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center rounded px-1 py-px text-[10px] font-bold",
                  score >= 70
                    ? "bg-status-converted/20 text-status-converted"
                    : score >= 40
                      ? "bg-status-proposal/20 text-status-proposal"
                      : "bg-muted text-muted-foreground"
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
          <div className="mt-1.5">
            <FCBadge
              variant={STATUS_VARIANT[lead.status] || "default"}
              size="sm"
            >
              {t(`leads.status.${lead.status}`)}
            </FCBadge>
          </div>

          {/* Line 5: Avatar + Time */}
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {lead.assigned_to && (
                <div
                  className="bg-muted-foreground flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-medium text-white"
                  title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`}
                >
                  {getInitials(lead.assigned_to)}
                </div>
              )}
            </div>
            <span className="text-muted-foreground text-[10px]">
              {formatTimeAgo(lead.created_at, t)}
            </span>
          </div>
        </motion.div>
      </LeadContextMenu>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.lead.id === nextProps.lead.id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.updated_at === nextProps.lead.updated_at &&
      prevProps.lead.qualification_score ===
        nextProps.lead.qualification_score &&
      prevProps.lead.assigned_to?.id === nextProps.lead.assigned_to?.id &&
      prevProps.isDragging === nextProps.isDragging
    );
  }
);
