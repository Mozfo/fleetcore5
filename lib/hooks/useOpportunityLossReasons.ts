/**
 * useOpportunityLossReasons - Hook pour charger les loss reasons dynamiquement
 *
 * Charge les configurations depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { reasons, getLabel, isRecoverable, requiresCompetitorName } = useOpportunityLossReasons();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 * @see scripts/seed-crm-settings.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export type LossReasonCategory =
  | "price"
  | "product"
  | "competition"
  | "timing"
  | "other";

export interface LossReasonConfig {
  value: string;
  label_en: string;
  label_fr: string;
  category: LossReasonCategory;
  order: number;
  is_active: boolean;
  is_recoverable: boolean;
  recovery_delay_days: number | null;
  require_competitor_name: boolean;
}

export interface RecoveryWorkflowConfig {
  auto_create_followup: boolean;
  send_reminder_email: boolean;
  reminder_days_before: number;
  auto_reopen: boolean;
}

interface LossReasonsSettingValue {
  default: string | null;
  reasons: LossReasonConfig[];
  recovery_workflow: RecoveryWorkflowConfig;
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: LossReasonsSettingValue;
    version: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// DEFAULTS (fallback si API indisponible)
// ============================================================

export const DEFAULT_LOSS_REASONS: LossReasonConfig[] = [
  {
    value: "price_too_high",
    label_en: "Price too high",
    label_fr: "Prix trop élevé",
    category: "price",
    order: 1,
    is_active: true,
    is_recoverable: true,
    recovery_delay_days: 90,
    require_competitor_name: false,
  },
  {
    value: "no_budget",
    label_en: "No budget",
    label_fr: "Pas de budget",
    category: "price",
    order: 2,
    is_active: true,
    is_recoverable: true,
    recovery_delay_days: 180,
    require_competitor_name: false,
  },
  {
    value: "feature_missing",
    label_en: "Feature missing",
    label_fr: "Fonctionnalité manquante",
    category: "product",
    order: 4,
    is_active: true,
    is_recoverable: true,
    recovery_delay_days: 120,
    require_competitor_name: false,
  },
  {
    value: "competitor_won_price",
    label_en: "Competitor won (price)",
    label_fr: "Concurrent gagné (prix)",
    category: "competition",
    order: 7,
    is_active: true,
    is_recoverable: true,
    recovery_delay_days: 180,
    require_competitor_name: true,
  },
  {
    value: "project_cancelled",
    label_en: "Project cancelled",
    label_fr: "Projet annulé",
    category: "timing",
    order: 9,
    is_active: true,
    is_recoverable: true,
    recovery_delay_days: 90,
    require_competitor_name: false,
  },
  {
    value: "other",
    label_en: "Other",
    label_fr: "Autre",
    category: "other",
    order: 99,
    is_active: true,
    is_recoverable: false,
    recovery_delay_days: null,
    require_competitor_name: false,
  },
];

export const DEFAULT_RECOVERY_WORKFLOW: RecoveryWorkflowConfig = {
  auto_create_followup: true,
  send_reminder_email: true,
  reminder_days_before: 7,
  auto_reopen: false,
};

// ============================================================
// FETCHER
// ============================================================

const fetcher = async (url: string): Promise<SettingApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch: ${res.status}`);
  }
  return res.json();
};

// ============================================================
// HOOK
// ============================================================

export function useOpportunityLossReasons() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/opportunity_loss_reasons",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract reasons from API response or use defaults
  // IMPORTANT: Use `!== false` instead of truthy check because some reasons
  // may not have is_active field defined (defaults to true)
  const reasons: LossReasonConfig[] =
    data?.success && data?.data?.setting_value?.reasons
      ? data.data.setting_value.reasons.filter((r) => r.is_active !== false)
      : DEFAULT_LOSS_REASONS;

  // Extract recovery workflow config
  const recoveryWorkflow =
    data?.success && data?.data?.setting_value?.recovery_workflow
      ? data.data.setting_value.recovery_workflow
      : DEFAULT_RECOVERY_WORKFLOW;

  // Sort reasons by order
  const sortedReasons = [...reasons].sort((a, b) => a.order - b.order);

  // Get unique categories from active reasons
  const categories = [...new Set(sortedReasons.map((r) => r.category))];

  /**
   * Get localized label for a reason value
   */
  const getLabel = (value: string, locale: string = "en"): string => {
    const reason = reasons.find((r) => r.value === value);
    if (!reason) return value;
    return locale === "fr" ? reason.label_fr : reason.label_en;
  };

  /**
   * Get category for a reason value
   */
  const getCategory = (value: string): LossReasonCategory | string => {
    const reason = reasons.find((r) => r.value === value);
    return reason?.category || "other";
  };

  /**
   * Check if a reason is recoverable
   */
  const isRecoverable = (value: string): boolean => {
    const reason = reasons.find((r) => r.value === value);
    return reason?.is_recoverable === true;
  };

  /**
   * Get recovery delay in days for a reason
   */
  const getRecoveryDelay = (value: string): number | null => {
    const reason = reasons.find((r) => r.value === value);
    return reason?.recovery_delay_days ?? null;
  };

  /**
   * Check if a reason requires competitor name
   */
  const requiresCompetitorName = (value: string): boolean => {
    const reason = reasons.find((r) => r.value === value);
    return reason?.require_competitor_name === true;
  };

  /**
   * Get all reasons for a specific category
   */
  const getReasonsByCategory = (
    category: LossReasonCategory
  ): LossReasonConfig[] => {
    return sortedReasons.filter((r) => r.category === category);
  };

  /**
   * Get reason config by value
   */
  const getReason = (value: string): LossReasonConfig | undefined => {
    return reasons.find((r) => r.value === value);
  };

  /**
   * Get all values as array
   */
  const getValues = (): string[] => {
    return sortedReasons.map((r) => r.value);
  };

  return {
    // Data
    reasons: sortedReasons,
    recoveryWorkflow,
    categories,

    // Helpers
    getLabel,
    getCategory,
    isRecoverable,
    getRecoveryDelay,
    requiresCompetitorName,
    getReasonsByCategory,
    getReason,
    getValues,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useOpportunityLossReasons;
