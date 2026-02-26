/**
 * useCrmFeatureFlags - CRM feature flags
 *
 * Returns feature flags that control UI visibility:
 * - opportunities_enabled: Show/hide Opportunities in sidebar
 * - quotes_enabled: Show/hide Quotes in sidebar
 *
 * Currently returns static defaults (both disabled).
 * When feature_flags are seeded in crm_settings DB table,
 * restore the SWR fetch from git history (commit before this change).
 *
 * V6.2-11: Opportunities FREEZE (future upsell), Quotes INLINE in Lead (Segment 4)
 */

"use client";

const FLAGS = {
  opportunities_enabled: false,
  quotes_enabled: false,
} as const;

export function useCrmFeatureFlags() {
  return {
    opportunitiesEnabled: FLAGS.opportunities_enabled,
    quotesEnabled: FLAGS.quotes_enabled,
    isLoading: false,
    error: undefined,
  };
}

export default useCrmFeatureFlags;
