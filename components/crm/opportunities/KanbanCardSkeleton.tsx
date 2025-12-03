/**
 * KanbanCardSkeleton - Skeleton de chargement pour une carte opportunity
 * Identique au pattern LeadCardSkeleton
 */

export function KanbanCardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Header: Company */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Contact Name */}
      <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />

      {/* Value + Probability */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-5 w-12 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Days in Stage */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Footer: Owner */}
      <div className="flex items-center gap-2 border-t border-gray-200 pt-2 dark:border-gray-800">
        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  );
}
