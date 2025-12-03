/**
 * Lead Detail Loading State - Skeleton UI
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header Skeleton */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        {/* Title + Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 - Contact */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-24" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-48" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-32" />
                </div>
              </div>
            </div>

            {/* Card 2 - Company */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-24" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-24" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </div>

            {/* Card 3 - Scoring */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-20" />
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
                <div>
                  <div className="mb-1 flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              </div>
            </div>

            {/* Card 4 - Assignment */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-28" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-1 h-3 w-20" />
                  <Skeleton className="h-5 w-36" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-28" />
                </div>
              </div>
            </div>

            {/* Card 5 - GDPR */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-32" />
              <div className="space-y-4">
                <div>
                  <Skeleton className="mb-1 h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div>
                  <Skeleton className="mb-1 h-3 w-12" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </div>

            {/* Card 6 - Message */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <Skeleton className="mb-4 h-5 w-20" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
