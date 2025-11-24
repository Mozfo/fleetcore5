/**
 * KanbanBoard - Board Kanban principal avec 3 colonnes
 * NEW | WORKING | QUALIFIED
 * AnimatePresence pour transitions smooth lors des filtres
 * Responsive: Desktop (3 cols) | Tablet (scroll) | Mobile (stack)
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadCardSkeleton } from "./LeadCardSkeleton";
import { KanbanColumn } from "./KanbanColumn";
import { useTranslation } from "react-i18next";
import type { KanbanColumn as KanbanColumnType } from "@/types/crm";

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  onCardClick?: (leadId: string) => void;
  onCreate?: () => void;
  isLoading?: boolean;
}

export function KanbanBoard({
  columns,
  onCardClick,
  onCreate,
  isLoading = false,
}: KanbanBoardProps) {
  const { t } = useTranslation("crm");

  // Calculate total leads across all columns
  const totalLeads = columns.reduce((sum, col) => sum + col.count, 0);

  // Loading State
  if (isLoading) {
    return (
      <div className="grid h-[calc(100vh-280px)] grid-cols-1 gap-6 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
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

  // Kanban Board
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="kanban-board"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="grid h-[calc(100vh-280px)] grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            onCardClick={onCardClick}
            onCreate={column.id === "new" ? onCreate : undefined}
          />
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
