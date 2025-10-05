import { currentUser } from "@clerk/nextjs/server";
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
  const user = await currentUser();

  if (!user) {
    redirect("/en/login");
  }

  const filters = await searchParams;
  const { status, country, search } = filters;

  // Build filters
  const where: Prisma.sys_demo_leadWhereInput = {};

  if (status) {
    where.status = status;
  }

  if (country) {
    where.country_code = country;
  }

  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { demo_company_name: { contains: search, mode: "insensitive" } },
    ];
  }

  // Fetch leads
  const leads = await db.sys_demo_lead.findMany({
    where,
    orderBy: { created_at: "desc" },
    include: {
      activities: {
        orderBy: { activity_date: "desc" },
        take: 1,
      },
    },
  });

  // Calculate stats
  const stats = {
    total: await db.sys_demo_lead.count(),
    pending: await db.sys_demo_lead.count({ where: { status: "pending" } }),
    contacted: await db.sys_demo_lead.count({
      where: { status: "contacted" },
    }),
    qualified: await db.sys_demo_lead.count({
      where: { status: "qualified" },
    }),
    accepted: await db.sys_demo_lead.count({ where: { status: "accepted" } }),
    refused: await db.sys_demo_lead.count({ where: { status: "refused" } }),
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
