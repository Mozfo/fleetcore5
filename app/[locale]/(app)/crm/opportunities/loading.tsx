/**
 * Loading skeleton for Opportunities Pipeline (Kanban) page
 * Provides visual feedback during route transitions
 * 5 columns: qualification, demo, proposal, negotiation, contract_sent
 */

export default function OpportunitiesPipelineLoading() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header skeleton */}
      <div className="shrink-0 space-y-4 border-b border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-4">
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="ml-auto h-10 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Kanban board skeleton - 5 columns for opportunities */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex gap-6">
          {/* 5 Kanban columns: qualification, demo, proposal, negotiation, contract_sent */}
          {[...Array(5)].map((_, colIndex) => (
            <div
              key={colIndex}
              className="w-72 shrink-0 rounded-lg bg-gray-100 p-4 dark:bg-gray-900"
            >
              {/* Column header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="h-5 w-24 animate-pulse rounded bg-gray-300 dark:bg-gray-700" />
                <div className="h-6 w-8 animate-pulse rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>

              {/* Cards skeleton */}
              <div className="space-y-3">
                {[...Array(3)].map((_, cardIndex) => (
                  <div
                    key={cardIndex}
                    className="animate-pulse rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800"
                  >
                    <div className="mb-2 h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="mb-3 h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                      </div>
                      {/* Value badge */}
                      <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
