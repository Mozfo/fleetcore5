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
            "rounded-fc-lg border-fc-border-light cursor-grab border bg-white p-3 dark:border-gray-700 dark:bg-gray-900",
            "transition-all duration-150",
            "hover:border-fc-border-medium hover:shadow-fc-md",
            showDraggingState &&
              "shadow-fc-lg ring-fc-primary-500 cursor-grabbing opacity-60 ring-1"
          )}
        >
          {/* Header: Company + Flag */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="text-fc-text-primary truncate text-sm font-semibold dark:text-white">
              {lead.company_name || "Unknown Company"}
            </h4>
            {lead.country?.flag_emoji && (
              <span
                className="flex-shrink-0 text-base"
                title={lead.country.country_name_en}
              >
                {lead.country.flag_emoji}
              </span>
            )}
          </div>

          {/* Contact */}
          {(lead.first_name || lead.last_name) && (
            <p className="text-fc-text-secondary mb-2 truncate text-xs dark:text-gray-400">
              {lead.first_name || ""} {lead.last_name || ""}
            </p>
          )}

          {/* Metrics row */}
          <div className="text-fc-text-muted mb-2 flex items-center gap-3 text-xs dark:text-gray-500">
            {lead.fleet_size && (
              <span className="inline-flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {lead.fleet_size}
              </span>
            )}
            {lead.fleet_size && lead.lead_stage && (
              <span className="text-fc-border-medium">&bull;</span>
            )}
            {lead.lead_stage && (
              <span>{getStageLabel(lead.lead_stage, locale)}</span>
            )}
          </div>

          {/* Footer: Status + Score + Avatar + Time */}
          <div className="border-fc-border-light flex items-center justify-between border-t pt-2 dark:border-gray-700">
            <FCBadge
              variant={STATUS_VARIANT[lead.status] || "default"}
              size="sm"
            >
              {t(`leads.status.${lead.status}`)}
            </FCBadge>
            <div className="flex items-center gap-2">
              {score !== null && score !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold",
                    score >= 70
                      ? "bg-fc-success-50 text-fc-success-600"
                      : score >= 40
                        ? "bg-fc-warning-50 text-fc-warning-600"
                        : "bg-fc-neutral-50 text-fc-neutral-500"
                  )}
                >
                  {score}
                </span>
              )}
              {lead.assigned_to && (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[10px] font-medium text-white"
                  title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`}
                >
                  {getInitials(lead.assigned_to)}
                </div>
              )}
              <span className="text-fc-text-muted text-xs">
                {formatTimeAgo(lead.created_at, t)}
              </span>
            </div>
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
