/**
 * KanbanPhaseColumn - Colonne Kanban phase-based avec groupes de statuts
 *
 * V6.6: Affiche une phase (ex: Contact, Démo) avec ses statuts groupés.
 * Chaque groupe de statut est une zone droppable séparée.
 *
 * Structure:
 * - Phase header (ex: "Contact" avec badge total)
 * - Status groups (ex: "callback_requested" cards) - V6.6: 10 statuts
 *   Chaque groupe a son propre header et sa zone droppable
 */

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type {
  KanbanPhaseColumn as KanbanPhaseColumnType,
  Lead,
  LeadStatus,
} from "@/types/crm";
import { KanbanCard } from "./KanbanCard";
import { EmptyColumn } from "./EmptyColumn";
import {
  kanbanContainerVariants,
  kanbanItemVariants,
} from "@/lib/animations/kanban-variants";

// Phase color mapping (V6.6: 4 phases)
const PHASE_COLORS: Record<string, string> = {
  contact: "amber",
  demo: "blue",
  proposal: "purple",
  finalized: "green",
};

// Status color mapping (V6.6: 10 statuts)
const STATUS_COLORS: Record<string, string> = {
  new: "gray",
  email_verified: "cyan",
  callback_requested: "amber",
  demo: "blue",
  proposal_sent: "orange",
  payment_pending: "amber",
  converted: "green",
  lost: "red",
  nurturing: "purple",
  disqualified: "gray",
};

interface KanbanPhaseColumnProps {
  column: KanbanPhaseColumnType;
  locale: string;
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onCreate?: () => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}

// Status droppable zone component
function StatusDropZone({
  status,
  statusLabel,
  statusColor,
  leads,
  onCardClick,
  onCardDoubleClick,
  onStatusChange,
  onEdit,
  onConvert,
  onDelete,
}: {
  status: string;
  statusLabel: string;
  statusColor: string;
  leads: Lead[];
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status, // Droppable ID is the status (for DnD)
  });

  const colorClasses: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    green:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    purple:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    orange:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    yellow:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  };

  return (
    <div
      ref={setNodeRef}
      data-testid="status-group"
      className={cn(
        "min-h-[60px] rounded-md transition-all duration-200",
        isOver && "bg-blue-50/50 ring-2 ring-blue-400 dark:bg-blue-900/20",
        leads.length === 0 &&
          "border border-dashed border-gray-200 dark:border-gray-700"
      )}
    >
      {/* Status header */}
      <div className="flex items-center gap-2 px-1 py-1.5">
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            colorClasses[statusColor] || colorClasses.gray
          )}
        >
          {statusLabel}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {leads.length}
        </span>
      </div>

      {/* Cards */}
      <motion.div
        variants={kanbanContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-2"
      >
        {leads.length === 0 ? (
          <div className="flex items-center justify-center py-2 text-xs text-gray-400 dark:text-gray-500">
            Drop here
          </div>
        ) : (
          leads.map((lead) => (
            <motion.div key={lead.id} variants={kanbanItemVariants}>
              <KanbanCard
                lead={lead}
                onClick={() => onCardClick?.(lead.id)}
                onDoubleClick={() => onCardDoubleClick?.(lead.id)}
                onView={(id) => onCardDoubleClick?.(id)}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onConvert={onConvert}
                onDelete={onDelete}
              />
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
}

export const KanbanPhaseColumn = memo(
  function KanbanPhaseColumn({
    column,
    locale: _locale,
    onCardClick,
    onCardDoubleClick,
    onCreate,
    onStatusChange,
    onEdit,
    onConvert,
    onDelete,
  }: KanbanPhaseColumnProps) {
    const { t } = useTranslation("crm");

    // Get phase label from i18n
    const phaseLabel = t(`leads.phases.${column.phase.id}`);

    // Phase color
    const phaseColor = PHASE_COLORS[column.phase.id] || "gray";

    // Header color class (V6.6: amber, blue, purple, green)
    const headerColorClass: Record<string, string> = {
      amber: "border-l-amber-500",
      blue: "border-l-blue-500",
      green: "border-l-green-500",
      purple: "border-l-purple-500",
      orange: "border-l-orange-500",
      gray: "border-l-gray-500",
    };

    return (
      <motion.div
        data-testid="kanban-phase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-full flex-col rounded-lg border border-gray-200 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-800/50"
      >
        {/* Phase Header */}
        <div
          className={cn(
            "sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-b border-l-4 border-gray-200/50 bg-gray-50/95 p-3 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/95",
            headerColorClass[phaseColor]
          )}
        >
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {phaseLabel}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {column.totalCount}
          </Badge>
        </div>

        {/* Status Groups Container - Scrollable */}
        {/* V6.2-11: Always show all status drop zones, even when empty */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
          {column.statusGroups.map((group) => {
            return (
              <StatusDropZone
                key={group.status}
                status={group.status}
                statusLabel={t(`leads.status.${group.status}`)}
                statusColor={STATUS_COLORS[group.status] || "gray"}
                leads={group.leads}
                onCardClick={onCardClick}
                onCardDoubleClick={onCardDoubleClick}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onConvert={onConvert}
                onDelete={onDelete}
              />
            );
          })}
          {/* Show empty state only if no status groups exist (shouldn't happen) */}
          {column.statusGroups.length === 0 && (
            <EmptyColumn columnId={column.id} onCreate={onCreate} />
          )}
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // Custom areEqual for performance
    if (prevProps.column.id !== nextProps.column.id) return false;
    if (prevProps.column.totalCount !== nextProps.column.totalCount)
      return false;
    if (prevProps.locale !== nextProps.locale) return false;

    // Compare status groups
    if (
      prevProps.column.statusGroups.length !==
      nextProps.column.statusGroups.length
    )
      return false;

    return prevProps.column.statusGroups.every((group, i) => {
      const nextGroup = nextProps.column.statusGroups[i];
      if (!nextGroup) return false;
      if (group.status !== nextGroup.status) return false;
      if (group.leads.length !== nextGroup.leads.length) return false;
      return group.leads.every((lead, j) => {
        const nextLead = nextGroup.leads[j];
        return nextLead && lead.id === nextLead.id;
      });
    });
  }
);
