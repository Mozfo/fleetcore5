/**
 * Create Quote Page
 * Server Component that loads opportunities for selection
 */

import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { QuoteForm } from "@/components/crm/quotes/QuoteForm";
import { localizedRedirect } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface NewQuotePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ opportunity_id?: string }>;
}

async function fetchOpportunities() {
  const opportunities = await db.crm_opportunities.findMany({
    where: {
      deleted_at: null,
      status: "open",
    },
    include: {
      crm_leads_crm_opportunities_lead_idTocrm_leads: {
        select: {
          company_name: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
    take: 100,
  });

  return opportunities.map((opp) => ({
    id: opp.id,
    title:
      opp.crm_leads_crm_opportunities_lead_idTocrm_leads?.company_name ||
      "Unknown",
    stage: opp.stage,
    expected_value: opp.expected_value ? Number(opp.expected_value) : null,
    currency: opp.currency || "EUR",
    lead: opp.crm_leads_crm_opportunities_lead_idTocrm_leads
      ? {
          company_name:
            opp.crm_leads_crm_opportunities_lead_idTocrm_leads.company_name,
          first_name:
            opp.crm_leads_crm_opportunities_lead_idTocrm_leads.first_name,
          last_name:
            opp.crm_leads_crm_opportunities_lead_idTocrm_leads.last_name,
          email: opp.crm_leads_crm_opportunities_lead_idTocrm_leads.email,
        }
      : null,
  }));
}

export default async function NewQuotePage({
  params,
  searchParams,
}: NewQuotePageProps) {
  const { userId } = await auth();
  const { locale } = await params;
  const { opportunity_id } = await searchParams;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const opportunities = await fetchOpportunities();

  return (
    <div className="h-full overflow-y-auto">
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl space-y-6 p-6">
            <Skeleton className="h-10 w-48" />
            <div className="space-y-4 rounded-lg border p-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        }
      >
        <QuoteForm
          mode="create"
          opportunities={opportunities}
          preselectedOpportunityId={opportunity_id}
          locale={locale as "en" | "fr"}
        />
      </Suspense>
    </div>
  );
}
