/**
 * Edit Quote Page
 * Server Component that loads quote data and opportunities for editing
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/prisma";
import { getQuoteWithItemsAction } from "@/lib/actions/crm/quote.actions";
import { QuoteForm } from "@/components/crm/quotes/QuoteForm";
import { localizedRedirect } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface EditQuotePageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function fetchOpportunities() {
  const opportunities = await db.crm_opportunities.findMany({
    where: {
      deleted_at: null,
    },
    include: {
      xva1wvf: {
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
    title: opp.xva1wvf?.company_name || "Unknown",
    stage: opp.stage,
    expected_value: opp.expected_value ? Number(opp.expected_value) : null,
    currency: opp.currency || "EUR",
    lead: opp.xva1wvf
      ? {
          company_name: opp.xva1wvf.company_name,
          first_name: opp.xva1wvf.first_name,
          last_name: opp.xva1wvf.last_name,
          email: opp.xva1wvf.email,
        }
      : null,
  }));
}

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { userId } = await auth();
  const { locale, id } = await params;

  if (!userId) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const [quoteResult, opportunities] = await Promise.all([
    getQuoteWithItemsAction(id),
    fetchOpportunities(),
  ]);

  if (!quoteResult.success || !quoteResult.quote) {
    notFound();
  }

  // Only draft quotes can be edited
  if (quoteResult.quote.status !== "draft") {
    redirect(`/${locale}/crm/quotes/${id}`);
  }

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Suspense
        fallback={
          <div className="space-y-6">
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
          mode="edit"
          quote={quoteResult.quote}
          opportunities={opportunities}
          locale={locale as "en" | "fr"}
        />
      </Suspense>
    </div>
  );
}
