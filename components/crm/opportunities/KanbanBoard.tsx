/**
 * KanbanBoard - Board Kanban avec 5 colonnes pipeline
 * QUALIFICATION | DEMO | PROPOSAL | NEGOTIATION | CONTRACT_SENT
 * DnD via @dnd-kit pour changer de stage
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
import { useTranslation } from "react-i18next";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { KanbanCardSkeleton } from "./KanbanCardSkeleton";
import type {
  Opportunity,
  OpportunityStage,
  OpportunityKanbanColumn as ColumnType,
} from "@/types/crm";

interface KanbanBoardProps {
  columns: ColumnType[];
  onStageChange: (opportunityId: string, newStage: OpportunityStage) => void;
  onCardClick?: (opportunityId: string) => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  columns,
  onStageChange,
  onCardClick,
  isLoading = false,
}: KanbanBoardProps) {
  const { t } = useTranslation("crm");

  // State for drag & drop
  const [activeOpportunity, setActiveOpportunity] =
    useState<Opportunity | null>(null);

  // Sensors: 8px minimum distance before activation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handler: drag start
  const handleDragStart = (event: DragStartEvent) => {
    const opportunityId = event.active.id as string;
    const opportunity = columns
      .flatMap((c) => c.opportunities)
      .find((o) => o.id === opportunityId);
    setActiveOpportunity(opportunity || null);
  };

  // Handler: drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveOpportunity(null);

    if (over && active.id !== over.id) {
      const newStage = over.id as OpportunityStage;
      onStageChange(active.id as string, newStage);
    }
  };

  // Calculate total opportunities
  const totalOpportunities = columns.reduce((sum, col) => sum + col.count, 0);

  // Loading State
  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-5 w-8 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
            </div>
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
            <KanbanCardSkeleton />
          </div>
        ))}
      </div>
    );
  }

  // Empty State
  if (totalOpportunities === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[400px] items-center justify-center"
      >
        <EmptyState
          icon={<Inbox className="h-16 w-16 text-gray-400" />}
          title={t("opportunity.empty.title", "No opportunities")}
          description={t(
            "opportunity.empty.description",
            "Start by converting qualified leads into opportunities"
          )}
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
          key="opportunity-kanban"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="grid h-full grid-cols-1 gap-4 lg:grid-cols-5"
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              onCardClick={onCardClick}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* DragOverlay: copy of card during drag */}
      <DragOverlay>
        {activeOpportunity ? (
          <KanbanCard opportunity={activeOpportunity} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
