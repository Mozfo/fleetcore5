import { getCurrentUser } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import LeadsList from "./components/LeadsList";
import LeadStats from "./components/LeadStats";

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; country?: string; search?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/en/login");
  }

  const filters = await searchParams;
  const { status, country, search } = filters;

  // Build filters
  const where: Prisma.crm_leadsWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (country) {
    where.country_code = country;
  }

  if (search) {
    where.OR = [
      { first_name: { contains: search, mode: "insensitive" } },
      { last_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company_name: { contains: search, mode: "insensitive" } },
    ];
  }

  // Fetch leads
  const leads = await db.crm_leads.findMany({
    where,
    orderBy: { created_at: "desc" },
  });

  // Calculate stats using groupBy for better performance (1 query instead of 6)
  const [statusGroups, total] = await Promise.all([
    db.crm_leads.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.crm_leads.count(),
  ]);

  // Transform groupBy results into stats object
  const stats = {
    total,
    pending: statusGroups.find((g) => g.status === "new")?._count._all || 0,
    contacted: 0,
    qualified:
      statusGroups.find((g) => g.status === "qualified")?._count._all || 0,
    accepted:
      statusGroups.find((g) => g.status === "converted")?._count._all || 0,
    refused: statusGroups.find((g) => g.status === "lost")?._count._all || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Leads Management
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and track your demo requests
        </p>
      </div>

      <LeadStats stats={stats} />

      <LeadsList leads={leads} />
    </div>
  );
}
