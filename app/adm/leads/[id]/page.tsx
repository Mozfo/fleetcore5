import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import ActivityTimeline from "./components/ActivityTimeline";
import AddActivityForm from "./components/AddActivityForm";
import UpdateLeadForm from "./components/UpdateLeadForm";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  const { id } = await params;

  if (!user) {
    redirect("/en/login");
  }

  const lead = await db.crm_leads.findUnique({
    where: { id },
  });

  if (!lead) {
    notFound();
  }

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<
      string,
      "pending" | "contacted" | "qualified" | "accepted" | "refused"
    > = {
      pending: "pending",
      contacted: "contacted",
      qualified: "qualified",
      accepted: "accepted",
      refused: "refused",
    };

    return (
      <Badge variant={statusMap[status || "pending"] || "default"}>
        {status || "pending"}
      </Badge>
    );
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Lead Details
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage lead information
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Information Card */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Lead Information
            </h2>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Full Name
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.full_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Email
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.email}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Phone
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.phone || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Company
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.demo_company_name}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Country
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.country_code === "AE" ? "🇦🇪 UAE" : "🇫🇷 France"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fleet Size
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.fleet_size}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Status
                </dt>
                <dd className="mt-1">{getStatusBadge(lead.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Message
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {lead.message || "-"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(lead.created_at)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Qualified Date
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(lead.qualified_date)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Update Lead Form */}
          <UpdateLeadForm lead={lead} />
        </div>

        {/* Activity Section */}
        <div className="space-y-6">
          {/* Add Activity Form */}
          <AddActivityForm leadId={lead.id} />

          {/* Activity Timeline */}
          <ActivityTimeline activities={[]} />
        </div>
      </div>
    </div>
  );
}
