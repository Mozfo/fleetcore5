/**
 * useOpportunityStatuses - Hook pour charger les statuts d'opportunité dynamiquement
 *
 * Charge les configurations depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { statuses, getLabel, getColor, getIcon, isLoading } = useOpportunityStatuses();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export interface OpportunityStatusConfig {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  color: string;
  icon: string;
  order: number;
  is_active?: boolean;
  is_terminal?: boolean;
  is_success?: boolean;
}

interface OpportunityStatusSettingValue {
  default: string;
  statuses: OpportunityStatusConfig[];
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: OpportunityStatusSettingValue;
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

export const DEFAULT_OPPORTUNITY_STATUSES: OpportunityStatusConfig[] = [
  {
    value: "open",
    label_en: "Open",
    label_fr: "Ouvert",
    color: "blue",
    icon: "folder-open",
    order: 1,
    is_active: true,
  },
  {
    value: "won",
    label_en: "Won",
    label_fr: "Gagné",
    color: "green",
    icon: "trophy",
    order: 2,
    is_terminal: true,
    is_success: true,
  },
  {
    value: "lost",
    label_en: "Lost",
    label_fr: "Perdu",
    color: "red",
    icon: "x-circle",
    order: 3,
    is_terminal: true,
  },
  {
    value: "on_hold",
    label_en: "On Hold",
    label_fr: "En attente",
    color: "yellow",
    icon: "pause-circle",
    order: 4,
    is_active: false,
  },
  {
    value: "cancelled",
    label_en: "Cancelled",
    label_fr: "Annulé",
    color: "gray",
    icon: "ban",
    order: 5,
    is_terminal: true,
  },
];

export const DEFAULT_OPPORTUNITY_STATUS = "open";

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

export function useOpportunityStatuses() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/opportunity_status_types",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract statuses from API response or use defaults
  // IMPORTANT: Use `!== false` instead of truthy check because some statuses
  // may not have is_active field defined (defaults to true)
  const statuses: OpportunityStatusConfig[] =
    data?.success && data?.data?.setting_value?.statuses
      ? data.data.setting_value.statuses.filter((s) => s.is_active !== false)
      : DEFAULT_OPPORTUNITY_STATUSES;

  // Get default value
  const defaultValue =
    data?.success && data?.data?.setting_value?.default
      ? data.data.setting_value.default
      : DEFAULT_OPPORTUNITY_STATUS;

  // Sort statuses by order
  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  /**
   * Get localized label for a status value
   */
  const getLabel = (value: string, locale: string = "en"): string => {
    const status = statuses.find((s) => s.value === value);
    if (!status) return value;
    if (locale === "fr") return status.label_fr;
    if (locale === "ar") return status.label_ar || status.label_en;
    return status.label_en;
  };

  /**
   * Get Tailwind color class suffix for a status value
   */
  const getColor = (value: string): string => {
    const status = statuses.find((s) => s.value === value);
    return status?.color || "gray";
  };

  /**
   * Get icon name for a status value
   */
  const getIcon = (value: string): string => {
    const status = statuses.find((s) => s.value === value);
    return status?.icon || "circle";
  };

  /**
   * Get status config by value
   */
  const getStatus = (value: string): OpportunityStatusConfig | undefined => {
    return statuses.find((s) => s.value === value);
  };

  /**
   * Check if a status is terminal (won, lost, cancelled)
   */
  const isTerminal = (value: string): boolean => {
    const status = statuses.find((s) => s.value === value);
    return status?.is_terminal === true;
  };

  /**
   * Check if a status is a success outcome (won)
   */
  const isSuccess = (value: string): boolean => {
    const status = statuses.find((s) => s.value === value);
    return status?.is_success === true;
  };

  /**
   * Get all values as array
   */
  const getValues = (): string[] => {
    return sortedStatuses.map((s) => s.value);
  };

  /**
   * Get non-terminal statuses (for filtering active opportunities)
   */
  const getActiveStatuses = (): OpportunityStatusConfig[] => {
    return sortedStatuses.filter((s) => !s.is_terminal);
  };

  /**
   * Get terminal statuses (for filtering closed opportunities)
   */
  const getTerminalStatuses = (): OpportunityStatusConfig[] => {
    return sortedStatuses.filter((s) => s.is_terminal);
  };

  return {
    // Data
    statuses: sortedStatuses,
    defaultValue,

    // Helpers
    getLabel,
    getColor,
    getIcon,
    getStatus,
    isTerminal,
    isSuccess,
    getValues,
    getActiveStatuses,
    getTerminalStatuses,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useOpportunityStatuses;
