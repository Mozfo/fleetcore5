/**
 * Lead Detail Manager Page - Server Component
 *
 * Manager/Supervisor view with KPI cards, audit-oriented table,
 * row click navigation to lead profile.
 */

import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { LeadsDetailPage } from "@/features/crm/leads/components/leads-detail-page";

export default async function LeadDetailManagerPage() {
  const session = await getSession();
  if (!session) {
    notFound();
  }

  return <LeadsDetailPage />;
}
