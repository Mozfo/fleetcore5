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
import type { Lead, LeadStatus } from "@/types/crm";
import { LeadContextMenu } from "./LeadContextMenu";

// Vivid status badge colors (Salesforce Cosmos)
const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-600 text-white",
  email_verified: "bg-cyan-600 text-white",
  callback_requested: "bg-blue-500 text-white",
  demo: "bg-indigo-600 text-white",
  proposal_sent: "bg-amber-500 text-white",
  payment_pending: "bg-orange-500 text-white",
  converted: "bg-green-600 text-white",
  lost: "bg-red-600 text-white",
  nurturing: "bg-teal-500 text-white",
  disqualified: "bg-gray-500 text-white",
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
    const statusStyle = STATUS_STYLES[lead.status] || STATUS_STYLES.new;

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
            "cursor-grab rounded-lg border border-gray-200 bg-white p-3",
            "transition-all duration-150",
            "hover:border-gray-300 hover:shadow-md",
            showDraggingState &&
              "cursor-grabbing opacity-60 shadow-md ring-1 ring-blue-400"
          )}
        >
          {/* Header: Company + Flag */}
          <div className="mb-1 flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-semibold text-gray-900">
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
            <p className="mb-2 truncate text-xs text-gray-600">
              {lead.first_name || ""} {lead.last_name || ""}
            </p>
          )}

          {/* Metrics row */}
          <div className="mb-2 flex items-center gap-3 text-xs text-gray-500">
            {lead.fleet_size && (
              <span className="inline-flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {lead.fleet_size}
              </span>
            )}
            {lead.fleet_size && lead.lead_stage && (
              <span className="text-gray-300">&bull;</span>
            )}
            {lead.lead_stage && (
              <span>{getStageLabel(lead.lead_stage, locale)}</span>
            )}
          </div>

          {/* Footer: Status + Score + Avatar + Time */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-2">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                statusStyle
              )}
            >
              {t(`leads.status.${lead.status}`)}
            </span>
            <div className="flex items-center gap-2">
              {score !== null && score !== undefined && (
                <span
                  className={cn(
                    "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold",
                    score >= 70
                      ? "bg-green-100 text-green-700"
                      : score >= 40
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
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
              <span className="text-xs text-gray-400">
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
