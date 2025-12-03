"use client";

/**
 * BulkActionsBar - Floating action bar for bulk operations on leads
 * Pattern: Contextual toolbar that appears when items are selected
 * @see https://www.nngroup.com/videos/bulk-actions-design-guidelines/
 * @see https://www.eleken.co/blog-posts/bulk-actions-ux
 */

import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, RefreshCw, Download, Trash2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface BulkActionsBarProps {
  selectedCount: number;
  onAssign: () => void;
  onChangeStatus: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionsBar({
  selectedCount,
  onAssign,
  onChangeStatus,
  onExport,
  onDelete,
  onClearSelection,
}: BulkActionsBarProps) {
  const { t } = useTranslation("crm");

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
        >
          <div className="bg-background flex items-center gap-2 rounded-lg border px-4 py-2.5 shadow-lg">
            {/* Selection count */}
            <span className="text-sm font-medium">
              {t("leads.bulk_actions.selected", { count: selectedCount })}
            </span>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Assign action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onAssign}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("leads.bulk_actions.assign")}
              </span>
            </Button>

            {/* Change status action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onChangeStatus}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("leads.bulk_actions.status")}
              </span>
            </Button>

            {/* Export action */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("leads.bulk_actions.export")}
              </span>
            </Button>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Delete action - destructive */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-destructive hover:text-destructive gap-2"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t("leads.bulk_actions.delete")}
              </span>
            </Button>

            {/* Clear selection */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="ml-1 h-8 w-8"
              title={t("leads.bulk_actions.clear_selection")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
