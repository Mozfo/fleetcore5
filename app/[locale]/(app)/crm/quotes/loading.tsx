/**
 * Loading state for Quotes page
 * Matches the layout of QuotesPageClient
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function QuotesLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <Skeleton className="mb-2 h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="space-y-3">
            {/* Column header */}
            <div className="flex items-center justify-between rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-8" />
            </div>
            {/* Cards */}
            {[...Array(2)].map((_, j) => (
              <div
                key={j}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <Skeleton className="mb-2 h-4 w-24" />
                <Skeleton className="mb-3 h-5 w-full" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
