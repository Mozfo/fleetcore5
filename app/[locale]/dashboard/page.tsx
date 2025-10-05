import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back,{" "}
          {user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "User"}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Leads
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Pending
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Qualified
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
