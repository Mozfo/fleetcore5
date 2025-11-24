/**
 * LeadCardSkeleton - Skeleton loader pour KanbanCard
 * Utilise le composant Skeleton avec shimmer effect
 */

import { Skeleton } from "@/components/ui/skeleton";

export function LeadCardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header: Company + Flag + Stage */}
      <div className="flex items-start justify-between">
        <div className="flex flex-1 items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-5 w-10 rounded-full" />
        </div>
      </div>

      {/* Contact Name */}
      <Skeleton className="h-4 w-24" />

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-10" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      {/* Fleet Size + Priority */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>

      {/* Footer: Owner + Time */}
      <div className="flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}
