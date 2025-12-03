"use client";

/**
 * ViewToggle - Toggle entre vue Kanban et vue Table
 * Persistance localStorage avec SSR-safe pattern
 */

import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ViewMode = "kanban" | "table";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  const { t } = useTranslation("crm");

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("kanban")}
        className={cn(
          "h-8 gap-1.5 px-3 text-xs",
          value === "kanban"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        )}
        aria-pressed={value === "kanban"}
        title={t("leads.view_toggle.kanban")}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">
          {t("leads.view_toggle.kanban")}
        </span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange("table")}
        className={cn(
          "h-8 gap-1.5 px-3 text-xs",
          value === "table"
            ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        )}
        aria-pressed={value === "table"}
        title={t("leads.view_toggle.table")}
      >
        <List className="h-4 w-4" />
        <span className="hidden sm:inline">{t("leads.view_toggle.table")}</span>
      </Button>
    </div>
  );
}
