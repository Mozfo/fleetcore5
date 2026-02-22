/**
 * Leads Page - Vue CRM Leads (Table + Kanban)
 *
 * Server Component: auth only, no data fetching.
 * Data: fetched client-side via Refine useList (both table and kanban views).
 */

import { getSession } from "@/lib/auth/server";
import { LeadsViewRouter } from "@/features/crm/leads/components/leads-view-router";
import { localizedRedirect } from "@/lib/navigation";

interface LeadsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LeadsPage({ params }: LeadsPageProps) {
  const session = await getSession();
  const { locale } = await params;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  return (
    <div className="relative flex h-full flex-col">
      <LeadsViewRouter />
    </div>
  );
}
