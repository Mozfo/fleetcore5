/**
 * CRM Settings Loading State
 */

export default function CrmSettingsLoading() {
  return (
    <div className="flex h-full flex-col space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-10 w-24 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid flex-1 gap-6 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
        <div className="h-96 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </div>
    </div>
  );
}
