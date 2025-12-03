/**
 * Loading skeleton for Leads Reports page
 */

export default function LeadsReportsLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 overflow-auto p-6">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mt-2 h-4 w-96 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Search skeleton */}
        <div className="mb-6">
          <div className="h-12 w-full max-w-2xl animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Stats cards skeleton */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-64 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Filters skeleton */}
        <div className="mb-4 flex items-center gap-4">
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="ml-auto h-10 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>

        {/* Table skeleton */}
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="flex gap-4">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                />
              ))}
            </div>
          </div>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex gap-4 border-b border-gray-100 p-4 last:border-b-0 dark:border-gray-800"
            >
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="h-4 w-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
