/**
 * QuoteColumnSelector - Column visibility and reordering selector
 * Based on OpportunityColumnSelector pattern
 */

"use client";

import { useState, useCallback } from "react";
import { Settings2, GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { QuoteColumnConfig } from "@/lib/config/quotes-columns";

interface QuoteColumnSelectorProps {
  columns: QuoteColumnConfig[];
  visibleColumns: string[];
  columnOrder: string[];
  onToggleColumn: (key: string) => void;
  onReorderColumns: (order: string[]) => void;
  onResetColumns: () => void;
}

export function QuoteColumnSelector({
  columns,
  visibleColumns,
  columnOrder,
  onToggleColumn,
  onReorderColumns,
  onResetColumns,
}: QuoteColumnSelectorProps) {
  const { t } = useTranslation("crm");
  const [isOpen, setIsOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Get columns in current order (excluding checkbox and actions)
  const orderedColumns = columnOrder
    .map((key) => columns.find((c) => c.key === key))
    .filter(
      (c): c is QuoteColumnConfig =>
        c !== undefined && c.key !== "checkbox" && c.key !== "actions"
    );

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, key: string) => {
    setDraggedItem(key);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", key);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, targetKey: string) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === targetKey) {
        setDraggedItem(null);
        return;
      }

      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetKey);

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedItem(null);
        return;
      }

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);

      onReorderColumns(newOrder);
      setDraggedItem(null);
    },
    [draggedItem, columnOrder, onReorderColumns]
  );

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const visibleCount = visibleColumns.filter(
    (v) => v !== "checkbox" && v !== "actions"
  ).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {t("quotes.columns.button", "Columns")}
          <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">
            {visibleCount}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">
            {t("quotes.columns.title", "Table Columns")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={onResetColumns}
          >
            <RotateCcw className="h-3 w-3" />
            {t("quotes.columns.reset", "Reset")}
          </Button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          <p className="mb-2 px-1 text-xs text-gray-500 dark:text-gray-400">
            {t("quotes.columns.drag_hint", "Drag to reorder columns")}
          </p>

          <div className="space-y-1">
            {orderedColumns.map((column) => {
              const isVisible = visibleColumns.includes(column.key);
              const isDragging = draggedItem === column.key;

              return (
                <div
                  key={column.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, column.key)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.key)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                    "hover:bg-gray-100 dark:hover:bg-gray-800",
                    isDragging && "opacity-50",
                    !isVisible && "text-gray-400"
                  )}
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="flex-1 truncate text-sm">
                    {t(column.labelKey, column.key)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleColumn(column.key);
                    }}
                    className={cn(
                      "rounded p-1 transition-colors",
                      isVisible
                        ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                  >
                    {isVisible ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <Separator />

        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          {t(
            "quotes.columns.showing",
            "Showing {{count}} of {{total}} columns",
            {
              count: visibleCount,
              total: orderedColumns.length,
            }
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
