/**
 * useLeadStatuses - Hook pour charger les statuts de lead dynamiquement
 *
 * Charge les configurations depuis crm_settings via l'API,
 * avec fallback sur valeurs par défaut et cache SWR.
 *
 * @example
 * const { statuses, getLabel, getColor, getIcon, canTransitionTo, isLoading } = useLeadStatuses();
 *
 * @see app/api/v1/crm/settings/[key]/route.ts
 */

"use client";

import useSWR from "swr";

// ============================================================
// TYPES
// ============================================================

export interface LeadStatusConfig {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  color: string;
  icon: string;
  order: number;
  is_active?: boolean;
  is_initial?: boolean;
  is_terminal?: boolean;
  is_success?: boolean;
  can_create_opportunity?: boolean;
  transitions_to: string[];
}

interface LeadStatusSettingValue {
  default: string;
  statuses: LeadStatusConfig[];
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: LeadStatusSettingValue;
    version: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

// ============================================================
// DEFAULTS (fallback si API indisponible) - V6.3 8 statuts
// ============================================================

export const DEFAULT_LEAD_STATUSES: LeadStatusConfig[] = [
  {
    value: "new",
    label_en: "New",
    label_fr: "Nouveau",
    color: "gray",
    icon: "sparkles",
    order: 1,
    is_initial: true,
    transitions_to: ["demo", "nurturing", "disqualified"],
  },
  {
    value: "demo",
    label_en: "Demo",
    label_fr: "Démo",
    color: "blue",
    icon: "calendar",
    order: 2,
    transitions_to: ["proposal_sent", "nurturing", "lost", "disqualified"],
  },
  {
    value: "proposal_sent",
    label_en: "Proposal Sent",
    label_fr: "Proposition envoyée",
    color: "orange",
    icon: "document-text",
    order: 3,
    transitions_to: ["payment_pending", "lost", "nurturing"],
  },
  {
    value: "payment_pending",
    label_en: "Payment Pending",
    label_fr: "Paiement en attente",
    color: "yellow",
    icon: "credit-card",
    order: 4,
    transitions_to: ["converted", "lost"],
  },
  {
    value: "converted",
    label_en: "Converted",
    label_fr: "Converti",
    color: "green",
    icon: "badge-check",
    order: 5,
    is_terminal: true,
    is_success: true,
    transitions_to: [],
  },
  {
    value: "lost",
    label_en: "Lost",
    label_fr: "Perdu",
    color: "red",
    icon: "x-circle",
    order: 6,
    transitions_to: ["nurturing"],
  },
  {
    value: "nurturing",
    label_en: "Nurturing",
    label_fr: "En nurturing",
    color: "purple",
    icon: "clock",
    order: 7,
    transitions_to: ["demo", "proposal_sent", "lost"],
  },
  {
    value: "disqualified",
    label_en: "Disqualified",
    label_fr: "Disqualifié",
    color: "gray",
    icon: "ban",
    order: 8,
    is_terminal: true,
    transitions_to: [],
  },
];

export const DEFAULT_LEAD_STATUS = "new";

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

export function useLeadStatuses() {
  const { data, error, isLoading, mutate } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/lead_status_workflow",
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
  const statuses: LeadStatusConfig[] =
    data?.success && data?.data?.setting_value?.statuses
      ? data.data.setting_value.statuses.filter((s) => s.is_active !== false)
      : DEFAULT_LEAD_STATUSES;

  // Get default value
  const defaultValue =
    data?.success && data?.data?.setting_value?.default
      ? data.data.setting_value.default
      : DEFAULT_LEAD_STATUS;

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
  const getStatus = (value: string): LeadStatusConfig | undefined => {
    return statuses.find((s) => s.value === value);
  };

  /**
   * Check if transition from one status to another is allowed
   */
  const canTransitionTo = (fromStatus: string, toStatus: string): boolean => {
    const status = statuses.find((s) => s.value === fromStatus);
    if (!status) return false;
    return status.transitions_to.includes(toStatus);
  };

  /**
   * Get valid next statuses from current status
   */
  const getValidTransitions = (currentStatus: string): LeadStatusConfig[] => {
    const status = statuses.find((s) => s.value === currentStatus);
    if (!status) return [];
    return status.transitions_to
      .map((v) => statuses.find((s) => s.value === v))
      .filter((s): s is LeadStatusConfig => s !== undefined);
  };

  /**
   * Check if a status is terminal (disqualified, converted, lost)
   */
  const isTerminal = (value: string): boolean => {
    const status = statuses.find((s) => s.value === value);
    return status?.is_terminal === true;
  };

  /**
   * Check if a status is a success outcome (converted)
   */
  const isSuccess = (value: string): boolean => {
    const status = statuses.find((s) => s.value === value);
    return status?.is_success === true;
  };

  /**
   * Check if a status allows creating an opportunity
   */
  const canCreateOpportunity = (value: string): boolean => {
    const status = statuses.find((s) => s.value === value);
    return status?.can_create_opportunity === true;
  };

  /**
   * Get all values as array
   */
  const getValues = (): string[] => {
    return sortedStatuses.map((s) => s.value);
  };

  /**
   * Get initial status (for new leads)
   */
  const getInitialStatus = (): LeadStatusConfig | undefined => {
    return sortedStatuses.find((s) => s.is_initial);
  };

  /**
   * Get non-terminal statuses (for filtering active leads)
   */
  const getActiveStatuses = (): LeadStatusConfig[] => {
    return sortedStatuses.filter((s) => !s.is_terminal);
  };

  /**
   * Get terminal statuses (for filtering closed leads)
   */
  const getTerminalStatuses = (): LeadStatusConfig[] => {
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
    canTransitionTo,
    getValidTransitions,
    isTerminal,
    isSuccess,
    canCreateOpportunity,
    getValues,
    getInitialStatus,
    getActiveStatuses,
    getTerminalStatuses,

    // State
    isLoading,
    error,

    // Actions
    refresh: mutate,
  };
}

export default useLeadStatuses;
