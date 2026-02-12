"use client";

import { X, GripVertical, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetWrapperProps {
  title: string;
  children: React.ReactNode;
  onRemove?: () => void;
  isEditing?: boolean;
  className?: string;
}

/**
 * WidgetWrapper - Container for dashboard widgets
 *
 * Features:
 * - Drag handle for react-grid-layout
 * - Remove button in edit mode
 * - Consistent styling
 */
export function WidgetWrapper({
  title,
  children,
  onRemove,
  isEditing = false,
  className,
}: WidgetWrapperProps) {
  return (
    <div
      className={cn(
        "rounded-fc-lg border-fc-border-light flex h-full flex-col border bg-white dark:border-gray-700 dark:bg-gray-900",
        isEditing && "ring-fc-primary-500/20 ring-2",
        className
      )}
    >
      {/* Header */}
      <div className="border-fc-border-light flex items-center justify-between border-b px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {isEditing && (
            <GripVertical className="text-fc-text-muted drag-handle h-4 w-4 cursor-grab active:cursor-grabbing" />
          )}
          <h3 className="text-fc-text-primary text-sm font-medium dark:text-white">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <button className="text-fc-text-muted hover:bg-fc-bg-hover rounded p-1 hover:text-gray-600 dark:hover:bg-gray-800">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
          {isEditing && onRemove && (
            <button
              onClick={onRemove}
              className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
