/**
 * KanbanPhaseBoard - Board Kanban avec 4 phases + Drag & Drop
 *
 * V6.6: 4 colonnes phase-based:
 * - Contact (callback_requested)
 * - Démo (demo)
 * - Proposition (proposal_sent, payment_pending)
 * - Finalisé (converted, lost, nurturing)
 *
 * Hidden from Kanban: new, email_verified, disqualified
 *
 * Leads are grouped by status within each phase column.
 * DnD allows moving leads between statuses.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadCardSkeleton } from "./LeadCardSkeleton";
import { KanbanPhaseColumn } from "./KanbanPhaseColumn";
import { KanbanCard } from "./KanbanCard";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import type {
  Lead,
  LeadStatus,
  KanbanPhaseColumn as KanbanPhaseColumnType,
} from "@/types/crm";

interface KanbanPhaseBoardProps {
  columns: KanbanPhaseColumnType[];
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onCreate?: () => void;
  isLoading?: boolean;
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}

export function KanbanPhaseBoard({
  columns,
  onCardClick,
  onCardDoubleClick,
  onCreate,
  isLoading = false,
  onStatusChange,
  onEdit,
  onConvert,
  onDisqualify,
  onDelete,
}: KanbanPhaseBoardProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  // DnD state
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Sensors: 8px distance before activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    const leadId = event.active.id as string;
    const lead = columns.flatMap((c) => c.leads).find((l) => l.id === leadId);
    setActiveLead(lead || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (over && active.id !== over.id) {
      // over.id is the target status (droppable id)
      const newStatus = over.id as LeadStatus;
      onStatusChange?.(active.id as string, newStatus);
    }
  };

  // Calculate totals
  const totalLeads = columns.reduce((sum, col) => sum + col.totalCount, 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-1 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <LeadCardSkeleton />
            <LeadCardSkeleton />
            <LeadCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (totalLeads === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <EmptyState
          icon={<Inbox className="h-16 w-16 text-gray-400" />}
          title={t("leads.empty.no_results")}
          description={t("leads.empty.no_results_desc")}
          action={
            onCreate
              ? { label: t("leads.empty.create_lead"), onClick: onCreate }
              : undefined
          }
        />
      </motion.div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="kanban-phase-board"
          data-testid="kanban-board"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-full grid-cols-1 gap-3 lg:grid-cols-4"
        >
          {columns.map((column) => (
            <KanbanPhaseColumn
              key={column.id}
              column={column}
              locale={locale}
              onCardClick={onCardClick}
              onCardDoubleClick={onCardDoubleClick}
              onCreate={column.id === "contact" ? onCreate : undefined}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onConvert={onConvert}
              onDisqualify={onDisqualify}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
