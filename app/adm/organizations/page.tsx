import { db } from "@/lib/prisma";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function OrganizationsPage() {
  // Fetch HQ provider to exclude from org list
  const hqProvider = await db.adm_providers.findFirst({
    where: { is_headquarters: true },
    select: { id: true },
  });

  const organizations = await db.adm_tenants.findMany({
    where: {
      ...(hqProvider ? { NOT: { id: hqProvider.id } } : {}),
    },
    orderBy: {
      created_at: "desc",
    },
  });

  // Calculate stats
  const stats = {
    total: organizations.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Organizations
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage client organizations
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-1">
        <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Organizations
          </h3>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {stats.total}
          </p>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            All Organizations
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-600 uppercase dark:text-gray-400">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {organizations.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-600 dark:text-gray-400"
                  >
                    No organizations found
                  </td>
                </tr>
              ) : (
                organizations.map((org) => (
                  <tr
                    key={org.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {org.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {org.auth_organization_id || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {org.country_code || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {org.created_at
                          ? format(new Date(org.created_at), "MMM d, yyyy")
                          : "N/A"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
