/**
 * Quotes Pipeline Page - Vue principale des devis
 * Server Component: fetch initial via actions
 * Filtres: gérés côté client avec useMemo (instantané)
 */

import { Suspense, cache } from "react";
import { getSession } from "@/lib/auth/server";
import { QuotesPageClient } from "@/components/crm/quotes/QuotesPageClient";
import { localizedRedirect } from "@/lib/navigation";
import {
  listQuotesAction,
  getQuoteStatsAction,
} from "@/lib/actions/crm/quote.actions";
import type { quote_status } from "@prisma/client";
import type { Quote } from "@/lib/repositories/crm/quote.repository";

export interface QuotesFilters {
  status: quote_status | "all";
  search?: string;
  min_value?: number;
  max_value?: number;
  valid_until_before?: string;
  valid_until_after?: string;
}

interface QuotesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    status?: string;
    search?: string;
    min_value?: string;
    max_value?: string;
    valid_until_before?: string;
    valid_until_after?: string;
  }>;
}

/**
 * Parse URL search params into QuotesFilters
 */
function parseFiltersFromURL(searchParams: {
  status?: string;
  search?: string;
  min_value?: string;
  max_value?: string;
  valid_until_before?: string;
  valid_until_after?: string;
}): QuotesFilters {
  return {
    status: (searchParams.status as quote_status | "all") || "all",
    search: searchParams.search || undefined,
    min_value: searchParams.min_value
      ? parseFloat(searchParams.min_value)
      : undefined,
    max_value: searchParams.max_value
      ? parseFloat(searchParams.max_value)
      : undefined,
    valid_until_before: searchParams.valid_until_before || undefined,
    valid_until_after: searchParams.valid_until_after || undefined,
  };
}

/**
 * Fetch ALL quotes via server action
 */
const fetchAllQuotes = cache(
  async (): Promise<{
    quotes: Quote[];
    stats: Partial<Record<quote_status, number>>;
  }> => {
    const [quotesResult, statsResult] = await Promise.all([
      listQuotesAction({
        page: 1,
        limit: 200,
        sortBy: "created_at",
        sortOrder: "desc",
      }),
      getQuoteStatsAction(),
    ]);

    return {
      quotes: quotesResult.success ? quotesResult.quotes : [],
      stats: statsResult.success ? statsResult.stats : {},
    };
  }
);

export default async function QuotesPage({
  params,
  searchParams,
}: QuotesPageProps) {
  const session = await getSession();
  const { locale } = await params;

  if (!session) {
    localizedRedirect("login", locale as "en" | "fr");
  }

  const searchParamsData = await searchParams;
  const initialFilters = parseFiltersFromURL(searchParamsData);

  const { quotes, stats } = await fetchAllQuotes();

  return (
    <div className="h-full">
      <Suspense
        fallback={
          <div className="space-y-6">
            <div className="h-32 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900" />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                  <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        <QuotesPageClient
          allQuotes={quotes}
          stats={stats}
          initialFilters={initialFilters}
        />
      </Suspense>
    </div>
  );
}
