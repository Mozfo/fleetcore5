"use client";

/**
 * ColumnSelector - Dropdown pour toggle visibilité et réordonner les colonnes
 * E1-D: Drag & drop avec @dnd-kit/sortable
 */

import { useState } from "react";
import { Settings2, RotateCcw, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import type { ColumnConfig } from "@/lib/config/leads-columns";
import { LOCKED_COLUMN_KEYS } from "@/lib/config/leads-columns";

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onToggle: (key: string) => void;
  onReset: () => void;
  onReorder: (activeKey: string, overKey: string) => void;
}

/**
 * Sortable column item
 */
function SortableColumnItem({
  column,
  onToggle,
}: {
  column: ColumnConfig;
  onToggle: (key: string) => void;
}) {
  const { t } = useTranslation("crm");
  const isLocked = LOCKED_COLUMN_KEYS.includes(column.key);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.key,
    disabled: isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Don't show locked columns (checkbox, actions) in the selector
  if (isLocked) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
        "hover:bg-accent hover:text-accent-foreground",
        isDragging && "bg-accent opacity-50"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground cursor-grab touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Checkbox for visibility */}
      <Checkbox
        id={`col-${column.key}`}
        checked={column.visible}
        onCheckedChange={() => onToggle(column.key)}
        className="mr-2"
      />

      {/* Label */}
      <label
        htmlFor={`col-${column.key}`}
        className="flex-1 cursor-pointer select-none"
      >
        {t(column.labelKey)}
      </label>
    </div>
  );
}

export function ColumnSelector({
  columns,
  onToggle,
  onReset,
  onReorder,
}: ColumnSelectorProps) {
  const { t } = useTranslation("crm");
  const [open, setOpen] = useState(false);

  // Filter out locked columns (not toggleable/reorderable)
  const sortableColumns = columns.filter(
    (c) => !LOCKED_COLUMN_KEYS.includes(c.key)
  );

  // Sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      onReorder(active.id as string, over.id as string);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {t("leads.table.column_selector.button")}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("leads.table.column_selector.label")}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {t("leads.table.column_selector.drag_hint")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Sortable list */}
        <div className="max-h-[300px] overflow-y-auto py-1">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableColumns.map((c) => c.key)}
              strategy={verticalListSortingStrategy}
            >
              {sortableColumns.map((column) => (
                <SortableColumnItem
                  key={column.key}
                  column={column}
                  onToggle={onToggle}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          {t("leads.table.column_selector.reset")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
