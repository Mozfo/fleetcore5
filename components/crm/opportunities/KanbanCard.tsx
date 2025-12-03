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
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
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
          "group cursor-grab space-y-3 rounded-lg border bg-white p-4 dark:bg-gray-900",
          "relative overflow-hidden",
          "before:absolute before:inset-0",
          "before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent",
          "before:opacity-0 before:transition-opacity",
          "hover:before:opacity-100",
          "dark:before:from-blue-900/20",
          // Rotting state
          isRotting
            ? "border-red-300 dark:border-red-800"
            : "border-gray-200 dark:border-gray-800",
          // Dragging state
          showDraggingState &&
            "cursor-grabbing opacity-60 shadow-2xl ring-2 ring-blue-500"
        )}
      >
        {/* Rotting Alert */}
        {isRotting && (
          <div className="absolute top-2 right-2 z-20">
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertTriangle className="h-3 w-3" />
              {t("opportunity.card.rotting", "Rotting")}
            </Badge>
          </div>
        )}

        {/* Header: Company + Flag */}
        <div className="relative z-10 flex items-start justify-between pr-16">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <span className="truncate text-sm font-medium">
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
          <p className="relative z-10 text-sm text-gray-600 dark:text-gray-400">
            {opportunity.lead.first_name} {opportunity.lead.last_name}
          </p>
        )}

        {/* Value + Probability */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1 text-sm font-semibold text-green-600 dark:text-green-400">
            <DollarSign className="h-4 w-4" />
            {opportunity.expected_value
              ? formatCurrency(
                  opportunity.expected_value,
                  opportunity.currency || "EUR"
                )
              : "-"}
          </div>
          {opportunity.probability_percent !== null && (
            <Badge variant="outline" className="text-xs">
              {opportunity.probability_percent}%
            </Badge>
          )}
        </div>

        {/* Days in Stage */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {t("opportunity.card.daysInStage", {
              count: daysInStage,
              defaultValue: `${daysInStage} days in stage`,
            })}
          </span>
        </div>

        {/* Footer: Owner */}
        <div className="relative z-10 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
          <div className="flex items-center gap-2">
            {opportunity.assignedTo ? (
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white"
                title={`${opportunity.assignedTo.first_name} ${opportunity.assignedTo.last_name}`}
              >
                {getInitials(opportunity.assignedTo)}
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                <User className="h-3 w-3 text-gray-400" />
              </div>
            )}
            {opportunity.expected_close_date && (
              <span className="text-xs text-gray-500">
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
