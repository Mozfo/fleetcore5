/**
 * KanbanCard - Card opportunité pour Kanban
 * Affiche: company, contact, value, probability, days in stage, rotting alert
 * Draggable via @dnd-kit
 */

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  DollarSign,
  Clock,
  AlertTriangle,
  User,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { FCBadge } from "@/components/fc";
import type { Opportunity } from "@/types/crm";

interface KanbanCardProps {
  opportunity: Opportunity & { days_in_stage?: number; is_rotting?: boolean };
  onClick?: () => void;
  isDragging?: boolean;
}

function formatCurrency(value: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitials(assigned: {
  first_name: string;
  last_name: string | null;
}) {
  const first = assigned.first_name?.[0]?.toUpperCase() || "";
  const last = assigned.last_name?.[0]?.toUpperCase() || "";
  return `${first}${last}`;
}

export const KanbanCard = memo(
  function KanbanCard({ opportunity, onClick, isDragging }: KanbanCardProps) {
    const { t } = useTranslation("crm");

    // dnd-kit draggable hook
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: isBeingDragged,
    } = useDraggable({
      id: opportunity.id,
    });

    const showDraggingState = isDragging || isBeingDragged;
    const isRotting = (opportunity as { is_rotting?: boolean }).is_rotting;
    const daysInStage =
      (opportunity as { days_in_stage?: number }).days_in_stage ?? 0;

    return (
      <motion.div
        ref={setNodeRef}
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
        onClick={onClick}
        className={cn(
          "rounded-fc-lg cursor-grab space-y-2 border bg-white p-3 dark:bg-gray-900",
          "transition-all duration-150",
          "hover:border-fc-border-medium hover:shadow-fc-md",
          isRotting
            ? "border-fc-danger-500/50 dark:border-red-800"
            : "border-fc-border-light dark:border-gray-700",
          showDraggingState &&
            "shadow-fc-lg ring-fc-primary-500 cursor-grabbing opacity-60 ring-1"
        )}
      >
        {/* Rotting Alert */}
        {isRotting && (
          <div className="flex justify-end">
            <FCBadge variant="danger" size="sm" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {t("opportunity.card.rotting", "Rotting")}
            </FCBadge>
          </div>
        )}

        {/* Header: Company + Flag */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="text-fc-text-muted h-4 w-4 flex-shrink-0" />
            <span className="text-fc-text-primary truncate text-sm font-medium dark:text-white">
              {opportunity.lead?.company_name ||
                t("opportunity.card.unknown", "Unknown")}
            </span>
          </div>
          {opportunity.lead?.country?.flag_emoji && (
            <span
              className="text-lg"
              title={opportunity.lead.country.country_name_en}
            >
              {opportunity.lead.country.flag_emoji}
            </span>
          )}
        </div>

        {/* Contact Name */}
        {opportunity.lead && (
          <p className="text-fc-text-secondary truncate text-xs dark:text-gray-400">
            {opportunity.lead.first_name} {opportunity.lead.last_name}
          </p>
        )}

        {/* Value + Probability */}
        <div className="flex items-center justify-between">
          <div className="text-fc-success-600 flex items-center gap-1 text-sm font-semibold dark:text-green-400">
            <DollarSign className="h-3.5 w-3.5" />
            {opportunity.expected_value
              ? formatCurrency(
                  opportunity.expected_value,
                  opportunity.currency || "EUR"
                )
              : "-"}
          </div>
          {opportunity.probability_percent !== null && (
            <span className="bg-fc-neutral-50 text-fc-neutral-500 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-bold">
              {opportunity.probability_percent}%
            </span>
          )}
        </div>

        {/* Days in Stage */}
        <div className="text-fc-text-muted flex items-center gap-2 text-xs dark:text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {t("opportunity.card.daysInStage", {
              count: daysInStage,
              defaultValue: `${daysInStage} days in stage`,
            })}
          </span>
        </div>

        {/* Footer: Owner */}
        <div className="border-fc-border-light flex items-center justify-between border-t pt-2 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {opportunity.assignedTo ? (
              <div
                className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-600 text-[10px] font-medium text-white"
                title={`${opportunity.assignedTo.first_name} ${opportunity.assignedTo.last_name}`}
              >
                {getInitials(opportunity.assignedTo)}
              </div>
            ) : (
              <div className="bg-fc-neutral-50 flex h-5 w-5 items-center justify-center rounded-full dark:bg-gray-800">
                <User className="text-fc-text-muted h-3 w-3" />
              </div>
            )}
            {opportunity.expected_close_date && (
              <span className="text-fc-text-muted text-xs">
                {t("opportunity.card.closeDate", "Close")}:{" "}
                {new Date(opportunity.expected_close_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.opportunity.id === nextProps.opportunity.id &&
      prevProps.opportunity.stage === nextProps.opportunity.stage &&
      prevProps.opportunity.updated_at === nextProps.opportunity.updated_at &&
      prevProps.opportunity.expected_value ===
        nextProps.opportunity.expected_value &&
      prevProps.isDragging === nextProps.isDragging
    );
  }
);
