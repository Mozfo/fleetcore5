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
        "flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900",
        isEditing && "ring-2 ring-blue-500/20",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {isEditing && (
            <GripVertical className="drag-handle h-4 w-4 cursor-grab text-gray-400 active:cursor-grabbing" />
          )}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>

        <div className="flex items-center gap-1">
          {!isEditing && (
            <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
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
