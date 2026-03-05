/**
 * Lead Detail Page - Server Component
 *
 * V4C: Uses LeadProfilePage (client component with Refine useOne).
 * The old LeadDetailPage.tsx (Server SQL CTE) is preserved in components/
 * but no longer imported here.
 */

import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { LeadProfilePage } from "@/features/crm/leads/components/profile/LeadProfilePage";

interface LeadPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    notFound();
  }

  // UUID format validation
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  return <LeadProfilePage leadId={id} />;
}
