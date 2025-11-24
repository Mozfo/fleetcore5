/**
 * KanbanColumn - Colonne Kanban avec hover highlight (préparation DnD)
 * Affiche le titre, le count, et la liste de leads avec animation stagger
 */

"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { KanbanColumn as KanbanColumnType } from "@/types/crm";
import { KanbanCard } from "./KanbanCard";
import { EmptyColumn } from "./EmptyColumn";
import {
  kanbanContainerVariants,
  kanbanItemVariants,
} from "@/lib/animations/kanban-variants";

interface KanbanColumnProps {
  column: KanbanColumnType;
  onCardClick?: (leadId: string) => void;
  onCreate?: () => void;
}

export function KanbanColumn({
  column,
  onCardClick,
  onCreate,
}: KanbanColumnProps) {
  const { t } = useTranslation("crm");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{
        backgroundColor: "rgba(59, 130, 246, 0.02)",
        borderColor: "rgba(59, 130, 246, 0.2)",
      }}
      className="flex h-full flex-col rounded-lg border border-gray-200 bg-gray-50/50 transition-colors dark:border-gray-800 dark:bg-gray-900/50"
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
              <KanbanCard lead={lead} onClick={() => onCardClick?.(lead.id)} />
            </motion.div>
          ))
        ) : (
          <EmptyColumn columnId={column.id} onCreate={onCreate} />
        )}
      </motion.div>
    </motion.div>
  );
}
