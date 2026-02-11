import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { FCBadge } from "./FCBadge";

interface FCKanbanCardProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant: "default" | "primary" | "success" | "warning" | "danger" | "info";
  };
  meta?: ReactNode;
  avatar?: ReactNode;
  className?: string;
  onClick?: () => void;
  isDragging?: boolean;
}

/**
 * FCKanbanCard - Unified Kanban card for Leads, Opportunities, Quotes
 *
 * Compact (p-3), vivid badge, hover shadow, grab cursor.
 * Replaces inconsistent card styles across CRM pipelines.
 */
export function FCKanbanCard({
  title,
  subtitle,
  badge,
  meta,
  avatar,
  className,
  onClick,
  isDragging = false,
}: FCKanbanCardProps) {
  return (
    <article
      onClick={onClick}
      className={cn(
        "rounded-fc-lg border-fc-border-light border bg-white p-3 dark:border-gray-700 dark:bg-gray-900",
        "hover:border-fc-border-medium hover:shadow-fc-md transition-all duration-150",
        "cursor-grab",
        isDragging &&
          "shadow-fc-lg ring-fc-primary-500/50 cursor-grabbing ring-2",
        onClick && "cursor-pointer",
        className
      )}
    >
      {/* Header row */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {avatar}
          <h3 className="text-fc-text-primary truncate text-sm font-medium dark:text-white">
            {title}
          </h3>
        </div>
        {badge && (
          <FCBadge variant={badge.variant} size="sm">
            {badge.label}
          </FCBadge>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-fc-text-secondary mb-2 truncate text-xs dark:text-gray-400">
          {subtitle}
        </p>
      )}

      {/* Meta row */}
      {meta && (
        <div className="text-fc-text-muted flex items-center gap-2 text-xs dark:text-gray-500">
          {meta}
        </div>
      )}
    </article>
  );
}
