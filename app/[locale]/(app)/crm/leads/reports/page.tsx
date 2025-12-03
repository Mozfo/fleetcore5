/**
 * Leads Reports Page - BI & Analytics Dashboard
 *
 * Purpose: Manager's tool for consultation, BI, and data extraction
 * Different from Pipeline (which is the daily workspace for sales team)
 *
 * Features:
 * - Quick search to find prospect contact info
 * - KPIs dashboard with trends
 * - Cold leads extraction
 * - Export for external BI tools
 * - Server-side pagination for 10k+ leads
 */

import { auth } from "@clerk/nextjs/server";
import { localizedRedirect } from "@/lib/navigation";
import { LeadsReportsClient } from "@/components/crm/leads/reports/LeadsReportsClient";

interface ReportsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeadsReportsPage({ params }: ReportsPageProps) {
  const { userId } = await auth();
  const { locale } = await params;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-gray-50 dark:bg-gray-950">
      <LeadsReportsClient locale={locale as "en" | "fr"} />
    </div>
  );
}
