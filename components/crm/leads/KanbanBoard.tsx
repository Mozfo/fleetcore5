/**
 * KanbanBoard - Board Kanban principal avec 4 colonnes + Drag & Drop
 * NEW | WORKING | QUALIFIED | LOST
 * AnimatePresence pour transitions smooth lors des filtres
 * Responsive: Desktop (4 cols) | Tablet (scroll) | Mobile (stack)
 * DnD via @dnd-kit: DndContext + DragOverlay
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
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { useTranslation } from "react-i18next";
import type {
  KanbanColumn as KanbanColumnType,
  Lead,
  LeadStatus,
} from "@/types/crm";

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onCreate?: () => void;
  isLoading?: boolean;
  /** Callback appelé quand un lead est drop sur une nouvelle colonne (D5-B implémentera l'API) */
  onStatusChange?: (leadId: string, newStatus: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}

export function KanbanBoard({
  columns,
  onCardClick,
  onCardDoubleClick,
  onCreate,
  isLoading = false,
  onStatusChange,
  onEdit,
  onConvert,
  onDelete,
}: KanbanBoardProps) {
  const { t } = useTranslation("crm");

  // State pour le drag & drop
  const [_activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);

  // Sensors: distance minimum de 8px avant activation (évite drag accidentel)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handler: début du drag
  const handleDragStart = (event: DragStartEvent) => {
    const leadId = event.active.id as string;
    setActiveId(leadId);
    // Trouver le lead dans les colonnes
    const lead = columns.flatMap((c) => c.leads).find((l) => l.id === leadId);
    setActiveLead(lead || null);
  };

  // Handler: fin du drag
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (over && active.id !== over.id) {
      const newStatus = over.id as LeadStatus;
      onStatusChange?.(active.id as string, newStatus);
    }
  };

  // Calculate total leads across all columns
  const totalLeads = columns.reduce((sum, col) => sum + col.count, 0);

  // Loading State
  if (isLoading) {
    return (
      <div className="grid h-[calc(100vh-280px)] grid-cols-1 gap-4 lg:grid-cols-4">
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

  // Empty State - No leads at all
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
              ? {
                  label: t("leads.empty.create_lead"),
                  onClick: onCreate,
                }
              : undefined
          }
        />
      </motion.div>
    );
  }

  // Kanban Board avec DndContext
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key="kanban-board"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-[calc(100vh-280px)] grid-cols-1 gap-4 lg:grid-cols-4"
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCardClick={onCardClick}
              onCardDoubleClick={onCardDoubleClick}
              onCreate={column.id === "new" ? onCreate : undefined}
              onView={onCardDoubleClick}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onConvert={onConvert}
              onDelete={onDelete}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* DragOverlay: affiche une copie de la card pendant le drag */}
      <DragOverlay>
        {activeLead ? <KanbanCard lead={activeLead} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
