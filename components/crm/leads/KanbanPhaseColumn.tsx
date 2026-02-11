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
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type {
  KanbanPhaseColumn as KanbanPhaseColumnType,
  Lead,
  LeadStatus,
} from "@/types/crm";
import { FCBadge } from "@/components/fc";
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

// Status → FCBadge variant mapping (V6.6: 10 statuts)
type BadgeVariant =
  | "default"
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info";
const STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
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

interface KanbanPhaseColumnProps {
  column: KanbanPhaseColumnType;
  locale: string;
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onCreate?: () => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}

// Status droppable zone component
function StatusDropZone({
  status,
  statusLabel,
  badgeVariant,
  leads,
  onCardClick,
  onCardDoubleClick,
  onStatusChange,
  onEdit,
  onConvert,
  onDisqualify,
  onDelete,
}: {
  status: string;
  statusLabel: string;
  badgeVariant: BadgeVariant;
  leads: Lead[];
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid="status-group"
      className={cn(
        "rounded-fc-md min-h-[60px] transition-all duration-200",
        isOver &&
          "bg-fc-primary-50/50 ring-fc-primary-500 ring-2 dark:bg-blue-900/20",
        leads.length === 0 &&
          "border-fc-border-light border border-dashed dark:border-gray-700"
      )}
    >
      {/* Status header */}
      <div className="flex items-center gap-2 px-1 py-1.5">
        <FCBadge variant={badgeVariant} size="sm">
          {statusLabel}
        </FCBadge>
        <span className="text-fc-text-muted text-xs dark:text-gray-400">
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
          <div className="text-fc-text-muted flex items-center justify-center py-2 text-xs dark:text-gray-500">
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
                onDisqualify={onDisqualify}
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
    onDisqualify,
    onDelete,
  }: KanbanPhaseColumnProps) {
    const { t } = useTranslation("crm");

    // Get phase label from i18n
    const phaseLabel = t(`leads.phases.${column.phase.id}`);

    // Phase color
    const phaseColor = PHASE_COLORS[column.phase.id] || "gray";

    // Phase indicator color (Cosmos rounded pill)
    const phaseIndicatorClass: Record<string, string> = {
      amber: "bg-fc-warning-500",
      blue: "bg-fc-primary-500",
      green: "bg-fc-success-500",
      purple: "bg-purple-500",
      orange: "bg-orange-500",
      gray: "bg-fc-neutral-500",
    };

    return (
      <motion.div
        data-testid="kanban-phase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-fc-lg border-fc-border-light bg-fc-bg-card/50 flex h-full flex-col border dark:border-gray-700 dark:bg-gray-800/50"
      >
        {/* Phase Header */}
        <div className="border-fc-border-light bg-fc-bg-card/95 sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-b px-3 py-2.5 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-5 w-1.5 rounded-full",
                phaseIndicatorClass[phaseColor] || "bg-fc-neutral-500"
              )}
            />
            <h3 className="text-fc-text-primary text-sm font-semibold tracking-wide uppercase dark:text-gray-300">
              {phaseLabel}
            </h3>
          </div>
          <span
            className="bg-fc-neutral-500 inline-flex min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold text-white"
            style={{ height: 24 }}
          >
            {column.totalCount}
          </span>
        </div>

        {/* Status Groups Container - Scrollable */}
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {column.statusGroups.map((group) => {
            return (
              <StatusDropZone
                key={group.status}
                status={group.status}
                statusLabel={t(`leads.status.${group.status}`)}
                badgeVariant={STATUS_BADGE_VARIANT[group.status] || "default"}
                leads={group.leads}
                onCardClick={onCardClick}
                onCardDoubleClick={onCardDoubleClick}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onConvert={onConvert}
                onDisqualify={onDisqualify}
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
