"use client";

/**
 * Generic BulkActionsBar — floating action bar for any DataTable page.
 * Actions are passed as props, making it reusable across CRM, Admin, etc.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface BulkAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: "default" | "destructive";
}

interface DataTableBulkActionsProps {
  selectedCount: number;
  selectedLabel?: string;
  actions: BulkAction[];
  onClearSelection: () => void;
  clearLabel?: string;
}

export function DataTableBulkActions({
  selectedCount,
  selectedLabel,
  actions,
  onClearSelection,
  clearLabel,
}: DataTableBulkActionsProps) {
  const defaultActions = actions.filter((a) => a.variant !== "destructive");
  const destructiveActions = actions.filter((a) => a.variant === "destructive");

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
            <span className="text-sm font-medium">
              {selectedLabel ?? `${selectedCount} selected`}
            </span>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {defaultActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  variant="ghost"
                  size="sm"
                  onClick={action.onClick}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{action.label}</span>
                </Button>
              );
            })}

            {destructiveActions.length > 0 && (
              <>
                <Separator orientation="vertical" className="mx-1 h-6" />
                {destructiveActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.label}
                      variant="ghost"
                      size="sm"
                      onClick={action.onClick}
                      className="text-destructive hover:text-destructive gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{action.label}</span>
                    </Button>
                  );
                })}
              </>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={onClearSelection}
              className="ml-1 h-8 w-8"
              title={clearLabel ?? "Clear selection"}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
