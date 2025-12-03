/**
 * Loading skeleton for Leads Browser page
 * Provides visual feedback during route transitions
 */

export default function LeadsBrowserLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left panel - Master list skeleton */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        {/* Search bar skeleton */}
        <div className="border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="h-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* Filter pills skeleton */}
        <div className="flex gap-2 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
          <div className="h-7 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-7 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-7 w-14 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        {/* List items skeleton */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="px-3 py-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="h-5 w-5 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-5 w-16 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - Detail skeleton */}
      <div className="flex-1 bg-gray-50 dark:bg-gray-950">
        <div className="h-full p-6">
          {/* Detail header skeleton */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <div className="mb-2 h-7 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
            <div className="flex gap-2">
              <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
            </div>
          </div>

          {/* Detail cards skeleton */}
          <div className="grid grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
