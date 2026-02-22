/**
 * Quote Detail Page
 * Full page view of a quote with all details and items
 */

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/server";
import { getQuoteWithRelationsAction } from "@/lib/actions/crm/quote.actions";
import { QuoteDetailClient } from "@/components/crm/quotes/QuoteDetailClient";
import { localizedRedirect } from "@/lib/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface QuoteDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export default async function QuoteDetailPage({
  params,
}: QuoteDetailPageProps) {
  const session = await getSession();
  const { locale, id } = await params;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const result = await getQuoteWithRelationsAction(id);

  if (!result.success || !result.quote) {
    notFound();
  }

  return (
    <div className="h-full p-6">
      <Suspense
        fallback={
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>

            {/* Content skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <Skeleton className="h-64 w-full rounded-lg" />
                <Skeleton className="h-48 w-full rounded-lg" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>
          </div>
        }
      >
        <QuoteDetailClient
          quote={result.quote}
          locale={locale as "en" | "fr"}
        />
      </Suspense>
    </div>
  );
}
