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
import { getPhaseConfig } from "@/lib/config/pipeline-status";

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
        "rounded-fc-md transition-all duration-200",
        leads.length === 0 ? "min-h-[40px]" : "min-h-[60px]",
        isOver && "bg-primary/10 ring-primary ring-2",
        leads.length === 0 &&
          !isOver &&
          "border-border border border-dashed opacity-60"
      )}
    >
      {/* Status header */}
      <div className="flex items-center gap-2 px-1 py-1.5">
        <FCBadge variant={badgeVariant} size="sm">
          {statusLabel}
        </FCBadge>
        <span className="text-muted-foreground text-xs">{leads.length}</span>
      </div>

      {/* Cards or drop indicator */}
      <motion.div
        variants={kanbanContainerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-1.5"
      >
        {leads.length === 0
          ? isOver && (
              <div className="border-primary text-primary flex items-center justify-center rounded border-2 border-dashed py-3 text-xs font-medium">
                Drop here
              </div>
            )
          : leads.map((lead) => (
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
            ))}
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

    // Phase header colors from pipeline-status config
    const phaseCfg = getPhaseConfig(column.phase.id);

    // Calculate average score for this phase's leads
    const phaseLeads = column.leads;
    const scores = phaseLeads
      .map((l) => l.qualification_score)
      .filter((s): s is number => s !== null && s !== undefined);
    const avgScore =
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null;

    return (
      <motion.div
        data-testid="kanban-phase"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-fc-lg border-border bg-card/50 flex h-full flex-col border"
      >
        {/* Phase Header - Salesforce Lightning style (60px, tinted, left border) */}
        <div
          className={cn(
            "border-border sticky top-0 z-10 rounded-t-lg border-b border-l-4 px-3 py-3 backdrop-blur-sm",
            phaseCfg.borderLeft,
            phaseCfg.bgSubtle
          )}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wide uppercase">
              {phaseLabel}
            </h3>
            <span
              className={cn(
                "inline-flex min-w-[28px] items-center justify-center rounded-full px-2 text-xs font-bold text-white",
                phaseCfg.bg
              )}
              style={{ height: 24 }}
            >
              {column.totalCount}
            </span>
          </div>
          {avgScore !== null && (
            <p className="text-muted-foreground mt-1 text-[11px]">
              {t("leads.stats.avg_score", { defaultValue: "Avg Score" })}:{" "}
              <span className="text-foreground font-semibold">{avgScore}</span>
            </p>
          )}
        </div>

        {/* Status Groups Container - Scrollable */}
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
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
