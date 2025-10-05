import { db } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch global stats for admin backoffice
  const [totalLeads, qualifiedLeads, totalOrgs, convertedLeads] =
    await Promise.all([
      db.sys_demo_lead.count(),
      db.sys_demo_lead.count({ where: { status: "qualified" } }),
      db.organization.count(),
      db.sys_demo_lead.count({ where: { status: "converted" } }),
    ]);

  // Calculate conversion rate
  const conversionRate =
    totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0";

  const stats = [
    {
      name: "Total Leads",
      value: totalLeads,
      description: "All demo requests received",
      color: "blue",
    },
    {
      name: "Qualified Leads",
      value: qualifiedLeads,
      description: "Leads marked as qualified",
      color: "green",
    },
    {
      name: "Total Organizations",
      value: totalOrgs,
      description: "Client organizations",
      color: "purple",
    },
    {
      name: "Conversion Rate",
      value: `${conversionRate}%`,
      description: "Leads converted to customers",
      color: "orange",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    green:
      "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    purple:
      "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
    orange:
      "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          FleetCore backoffice overview and metrics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.name}
              </h3>
              <span
                className={`rounded-full px-2 py-1 text-xs font-medium ${colorClasses[stat.color as keyof typeof colorClasses]}`}
              >
                {stat.color}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Quick Actions
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/adm/leads"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-blue-600 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-400 dark:hover:bg-blue-900/20"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              Manage Leads
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View and qualify demo requests
            </p>
          </Link>
          <Link
            href="/adm/organizations"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-purple-600 hover:bg-purple-50 dark:border-gray-700 dark:hover:border-purple-400 dark:hover:bg-purple-900/20"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              Manage Organizations
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              View client organizations
            </p>
          </Link>
          <Link
            href="/adm/leads?status=pending"
            className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-green-600 hover:bg-green-50 dark:border-gray-700 dark:hover:border-green-400 dark:hover:bg-green-900/20"
          >
            <h3 className="font-medium text-gray-900 dark:text-white">
              Pending Leads
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Review new demo requests
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
