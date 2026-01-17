/**
 * useCrmFeatureFlags - Hook to load CRM feature flags from crm_settings
 *
 * Returns feature flags that control UI visibility:
 * - opportunities_enabled: Show/hide Opportunities in sidebar
 * - quotes_enabled: Show/hide Quotes in sidebar
 *
 * V6.2-11: Opportunities FREEZE (future upsell), Quotes INLINE in Lead (Segment 4)
 *
 * @example
 * const { opportunitiesEnabled, quotesEnabled, isLoading } = useCrmFeatureFlags();
 *
 * @see app/api/public/crm/feature-flags/route.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

interface FeatureFlagsResponse {
  success: boolean;
  data: {
    opportunities_enabled: boolean;
    quotes_enabled: boolean;
  };
}

// ============================================================
// DEFAULTS (fallback if API unavailable)
// ============================================================

const DEFAULT_FLAGS = {
  opportunities_enabled: false,
  quotes_enabled: false,
};

// ============================================================
// FETCHER
// ============================================================

const fetcher = async (url: string): Promise<FeatureFlagsResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

// ============================================================
// HOOK
// ============================================================

export function useCrmFeatureFlags() {
  const { data, error, isLoading } = useSWR<FeatureFlagsResponse>(
    "/api/public/crm/feature-flags",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes cache (flags don't change often)
      revalidateOnReconnect: false,
      shouldRetryOnError: false, // Use defaults on error
    }
  );

  // Extract flags from API response or use defaults
  const flags = data?.success && data?.data ? data.data : DEFAULT_FLAGS;

  return {
    opportunitiesEnabled: flags.opportunities_enabled,
    quotesEnabled: flags.quotes_enabled,
    isLoading,
    error,
  };
}

export default useCrmFeatureFlags;
