/**
 * Loading state for Leads Directory page
 * Shows skeleton UI while data is being fetched
 */

export default function LeadsDirectoryLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Header skeleton */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl">
          {/* Title skeleton */}
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div>
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              <div className="mt-1 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </div>
          </div>

          {/* Search skeleton */}
          <div className="h-14 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
        </div>
      </div>

      {/* List skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              {/* Avatar skeleton */}
              <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />

              {/* Content skeleton */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>

              {/* Score skeleton */}
              <div className="hidden shrink-0 sm:block">
                <div className="h-6 w-8 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
