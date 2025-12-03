/**
 * KanbanColumn - Colonne droppable pour opportunités
 * Affiche: titre, count, valeur totale, et liste d'opportunities
 */

"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { KanbanCard } from "./KanbanCard";
import type { OpportunityKanbanColumn as ColumnType } from "@/types/crm";
import {
  kanbanContainerVariants,
  kanbanItemVariants,
} from "@/lib/animations/kanban-variants";

interface KanbanColumnProps {
  column: ColumnType;
  onCardClick?: (opportunityId: string) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return value.toString();
}

export const KanbanColumn = memo(
  function KanbanColumn({ column, onCardClick }: KanbanColumnProps) {
    const { t } = useTranslation("crm");

    // dnd-kit droppable hook
    const { setNodeRef, isOver } = useDroppable({
      id: column.id,
    });

    // Color mapping for columns
    const colorClasses: Record<string, string> = {
      blue: "bg-blue-500",
      purple: "bg-purple-500",
      yellow: "bg-yellow-500",
      orange: "bg-orange-500",
      green: "bg-green-500",
    };

    return (
      <motion.div
        ref={setNodeRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex h-full flex-col rounded-lg border border-gray-200 bg-gray-50/50 transition-all duration-200 dark:border-gray-700 dark:bg-gray-800/50",
          isOver && "bg-blue-50/30 ring-2 ring-blue-500 dark:bg-blue-900/30"
        )}
      >
        {/* Column Header */}
        <div className="sticky top-0 z-10 flex flex-col gap-2 rounded-t-lg border-b border-gray-200/50 bg-gray-50/95 p-4 pb-3 backdrop-blur-sm dark:border-gray-800/50 dark:bg-gray-900/95">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2 w-2 rounded-full",
                  colorClasses[column.color] || "bg-gray-500"
                )}
              />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {column.title}
              </h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {column.count}
            </Badge>
          </div>
          {/* Value summary */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{t("opportunity.column.value", "Value")}</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {formatCurrency(column.totalValue)}
            </span>
          </div>
        </div>

        {/* Cards Container - Scrollable */}
        <motion.div
          variants={kanbanContainerVariants}
          initial="hidden"
          animate="visible"
          className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 pt-3"
        >
          {column.opportunities.length > 0 ? (
            column.opportunities.map((opportunity) => (
              <motion.div key={opportunity.id} variants={kanbanItemVariants}>
                <KanbanCard
                  opportunity={opportunity}
                  onClick={() => onCardClick?.(opportunity.id)}
                />
              </motion.div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-gray-400">
                {t("opportunity.column.empty", "No deals in this stage")}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.column.id !== nextProps.column.id) return false;
    if (
      prevProps.column.opportunities.length !==
      nextProps.column.opportunities.length
    )
      return false;
    if (prevProps.column.totalValue !== nextProps.column.totalValue)
      return false;

    return prevProps.column.opportunities.every((opp, i) => {
      const nextOpp = nextProps.column.opportunities[i];
      return (
        nextOpp &&
        opp.id === nextOpp.id &&
        opp.updated_at === nextOpp.updated_at
      );
    });
  }
);
