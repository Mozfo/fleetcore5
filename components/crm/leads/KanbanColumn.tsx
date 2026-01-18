/**
 * KanbanColumn - Colonne Kanban droppable via @dnd-kit
 * Affiche le titre, le count, et la liste de leads avec animation stagger
 * Highlight bleu quand une card est au-dessus (isOver)
 * PERF: memo avec areEqual custom pour éviter re-renders inutiles
 */

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import type { KanbanColumn as KanbanColumnType, LeadStatus } from "@/types/crm";
import { KanbanCard } from "./KanbanCard";
import { EmptyColumn } from "./EmptyColumn";
import {
  kanbanContainerVariants,
  kanbanItemVariants,
} from "@/lib/animations/kanban-variants";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick?: (leadId: string) => void;
  onCardDoubleClick?: (leadId: string) => void;
  onCreate?: () => void;
  onView?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: LeadStatus) => void;
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
}

export const KanbanColumn = memo(
  function KanbanColumn({
    column,
    onCardClick,
    onCardDoubleClick,
    onCreate,
    onView,
    onStatusChange,
    onEdit,
    onConvert,
    onDelete,
  }: KanbanColumnProps) {
    const { t } = useTranslation("crm");

    // Hook dnd-kit pour rendre la colonne droppable
    // V6.3: 8 statuts (new, demo, proposal_sent, payment_pending, converted, lost, nurturing, disqualified)
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
    });

    return (
      <motion.div
        ref={setNodeRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        whileHover={
          !isOver
            ? {
                backgroundColor: "rgba(59, 130, 246, 0.02)",
                borderColor: "rgba(59, 130, 246, 0.2)",
              }
            : undefined
        }
        className={cn(
          "flex h-full flex-col rounded-lg border border-gray-200 bg-gray-50/50 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800/50",
          // État isOver: highlight quand une card est au-dessus
          isOver && "bg-blue-50/30 ring-2 ring-blue-500 dark:bg-blue-900/30"
        )}
      >
        {/* Column Header - Sticky */}
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-lg border-b border-gray-200/50 bg-gray-50/95 p-4 pb-3 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/95">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t(`leads.columns.${column.id}`)}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {column.count}
          </Badge>
        </div>

        {/* Cards Container - Scrollable */}
        <motion.div
          variants={kanbanContainerVariants}
          initial="hidden"
          animate="visible"
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pt-3"
        >
          {column.leads.length > 0 ? (
            column.leads.map((lead) => (
              <motion.div key={lead.id} variants={kanbanItemVariants}>
                <KanbanCard
                  lead={lead}
                  onClick={() => onCardClick?.(lead.id)}
                  onDoubleClick={() => onCardDoubleClick?.(lead.id)}
                  onView={(id) => onView?.(id)}
                  onStatusChange={onStatusChange}
                  onEdit={onEdit}
                  onConvert={onConvert}
                  onDelete={onDelete}
                />
              </motion.div>
            ))
          ) : (
            <EmptyColumn columnId={column.id} onCreate={onCreate} />
          )}
        </motion.div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    // PERF: Custom areEqual - évite re-renders si les leads n'ont pas changé
    if (prevProps.column.id !== nextProps.column.id) return false;
    if (prevProps.column.leads.length !== nextProps.column.leads.length)
      return false;

    // Comparer les leads par id + updated_at
    return prevProps.column.leads.every((lead, i) => {
      const nextLead = nextProps.column.leads[i];
      return (
        nextLead &&
        lead.id === nextLead.id &&
        lead.updated_at === nextLead.updated_at
      );
    });
  }
);
