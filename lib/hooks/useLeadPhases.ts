/**
 * useLeadPhases - Hook for Kanban phase-based columns
 *
 * V6.3: Maps 8 lead statuses into 4 Kanban phases for display (one-call close).
 *
 * Kanban Phases:
 * 1. Incomplet: new
 * 2. Démo: demo
 * 3. Proposition: proposal_sent, payment_pending
 * 4. Terminé: converted, lost, nurturing, disqualified
 *
 * V6.3 changes:
 * - demo_scheduled → demo (renamed)
 * - qualified, demo_completed → REMOVED (one-call close philosophy)
 * - 5 phases → 4 phases
 *
 * @example
 * const { phases, getPhaseForStatus, groupLeadsByPhase } = useLeadPhases();
 */

"use client";

import { useMemo } from "react";
import useSWR from "swr";
import type { Lead } from "@/types/crm";

// ============================================================
// TYPES
// ============================================================

export interface StatusConfig {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  phase: string;
  probability: number;
  color: string;
  icon: string;
  description?: string;
  allowed_transitions: string[];
  is_terminal?: boolean;
  is_won?: boolean;
  requires_reason?: boolean;
}

export interface PhaseConfig {
  value: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  order: number;
}

export interface WorkflowSettingValue {
  version: string;
  statuses: StatusConfig[];
  phases: PhaseConfig[];
}

interface SettingApiResponse {
  success: boolean;
  data?: {
    id: string;
    setting_key: string;
    setting_value: WorkflowSettingValue;
    version: number;
  };
  error?: { code: string; message: string };
}

// Kanban phase definition (5 columns for UI display)
export interface KanbanPhase {
  id: string;
  label_en: string;
  label_fr: string;
  label_ar?: string;
  order: number;
  color: string;
  statuses: string[];
}

// Kanban column with leads grouped by phase
export interface KanbanPhaseColumn {
  id: string;
  phase: KanbanPhase;
  leads: Lead[];
  statusGroups: Array<{
    status: string;
    statusConfig: StatusConfig;
    leads: Lead[];
  }>;
  totalCount: number;
}

// ============================================================
// CONSTANTS - Kanban Phase Mapping (4 columns V6.3)
// ============================================================

/**
 * Kanban UI phase mapping (4 columns V6.3 one-call close)
 * Maps 8 DB statuses to 4 Kanban columns
 */
export const KANBAN_PHASES: KanbanPhase[] = [
  {
    id: "incomplete",
    label_en: "Incomplete",
    label_fr: "Incomplet",
    label_ar: "غير مكتمل",
    order: 1,
    color: "gray",
    statuses: ["new"],
  },
  {
    id: "demo",
    label_en: "Demo",
    label_fr: "Démo",
    label_ar: "عرض توضيحي",
    order: 2,
    color: "blue",
    statuses: ["demo"],
  },
  {
    id: "proposal",
    label_en: "Proposal",
    label_fr: "Proposition",
    label_ar: "عرض",
    order: 3,
    color: "orange",
    statuses: ["proposal_sent", "payment_pending"],
  },
  {
    id: "completed",
    label_en: "Completed",
    label_fr: "Terminé",
    label_ar: "مكتمل",
    order: 4,
    color: "green",
    statuses: ["converted", "lost", "nurturing", "disqualified"],
  },
];

// Reverse mapping: status -> phase id
const STATUS_TO_PHASE: Record<string, string> = {};
KANBAN_PHASES.forEach((phase) => {
  phase.statuses.forEach((status) => {
    STATUS_TO_PHASE[status] = phase.id;
  });
});

// ============================================================
// DEFAULTS (fallback if API unavailable) - V6.3 8 statuts
// ============================================================

export const DEFAULT_STATUSES: StatusConfig[] = [
  {
    value: "new",
    label_en: "New",
    label_fr: "Nouveau",
    label_ar: "جديد",
    phase: "incomplete",
    probability: 5,
    color: "#6B7280",
    icon: "sparkles",
    allowed_transitions: ["demo", "nurturing", "disqualified"],
  },
  {
    value: "demo",
    label_en: "Demo",
    label_fr: "Démo",
    label_ar: "عرض توضيحي",
    phase: "demo",
    probability: 50,
    color: "#3B82F6",
    icon: "calendar",
    allowed_transitions: ["proposal_sent", "nurturing", "lost", "disqualified"],
  },
  {
    value: "proposal_sent",
    label_en: "Proposal Sent",
    label_fr: "Proposition envoyée",
    label_ar: "تم إرسال العرض",
    phase: "proposal",
    probability: 85,
    color: "#F97316",
    icon: "document-text",
    allowed_transitions: ["payment_pending", "lost", "nurturing"],
  },
  {
    value: "payment_pending",
    label_en: "Payment Pending",
    label_fr: "Paiement en attente",
    label_ar: "في انتظار الدفع",
    phase: "proposal",
    probability: 90,
    color: "#EAB308",
    icon: "credit-card",
    allowed_transitions: ["converted", "lost"],
  },
  {
    value: "converted",
    label_en: "Converted",
    label_fr: "Converti",
    label_ar: "تم التحويل",
    phase: "completed",
    probability: 100,
    color: "#22C55E",
    icon: "badge-check",
    allowed_transitions: [],
    is_terminal: true,
    is_won: true,
  },
  {
    value: "lost",
    label_en: "Lost",
    label_fr: "Perdu",
    label_ar: "خسر",
    phase: "completed",
    probability: 0,
    color: "#EF4444",
    icon: "x-circle",
    allowed_transitions: ["nurturing"],
    requires_reason: true,
  },
  {
    value: "nurturing",
    label_en: "Nurturing",
    label_fr: "En nurturing",
    label_ar: "رعاية",
    phase: "completed",
    probability: 15,
    color: "#8B5CF6",
    icon: "clock",
    allowed_transitions: ["demo", "proposal_sent", "lost"],
    requires_reason: true,
  },
  {
    value: "disqualified",
    label_en: "Disqualified",
    label_fr: "Disqualifié",
    label_ar: "غير مؤهل",
    phase: "completed",
    probability: 0,
    color: "#1F2937",
    icon: "ban",
    allowed_transitions: [],
    is_terminal: true,
    requires_reason: true,
  },
];

// ============================================================
// FETCHER
// ============================================================

const fetcher = async (url: string): Promise<SettingApiResponse> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return res.json();
};

// ============================================================
// HOOK
// ============================================================

export function useLeadPhases() {
  const { data, error, isLoading } = useSWR<SettingApiResponse>(
    "/api/v1/crm/settings/lead_status_workflow",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute cache
      shouldRetryOnError: true,
      errorRetryCount: 2,
    }
  );

  // Extract statuses from API or use defaults
  const statuses: StatusConfig[] = useMemo(() => {
    if (data?.success && data?.data?.setting_value?.statuses) {
      return data.data.setting_value.statuses;
    }
    return DEFAULT_STATUSES;
  }, [data]);

  // Create status map for quick lookups
  const statusMap = useMemo(() => {
    const map = new Map<string, StatusConfig>();
    statuses.forEach((s) => map.set(s.value, s));
    return map;
  }, [statuses]);

  /**
   * Get the Kanban phase for a given status
   */
  const getPhaseForStatus = (status: string): KanbanPhase | undefined => {
    const phaseId = STATUS_TO_PHASE[status];
    return KANBAN_PHASES.find((p) => p.id === phaseId);
  };

  /**
   * Get status config by value
   */
  const getStatusConfig = (status: string): StatusConfig | undefined => {
    return statusMap.get(status);
  };

  /**
   * Get localized status label
   */
  const getStatusLabel = (status: string, locale: string = "en"): string => {
    const config = statusMap.get(status);
    if (!config) return status;
    if (locale === "fr") return config.label_fr;
    if (locale === "ar") return config.label_ar || config.label_en;
    return config.label_en;
  };

  /**
   * Get localized phase label
   */
  const getPhaseLabel = (phaseId: string, locale: string = "en"): string => {
    const phase = KANBAN_PHASES.find((p) => p.id === phaseId);
    if (!phase) return phaseId;
    if (locale === "fr") return phase.label_fr;
    if (locale === "ar") return phase.label_ar || phase.label_en;
    return phase.label_en;
  };

  /**
   * Group leads into Kanban phase columns
   */
  const groupLeadsByPhase = (leads: Lead[]): KanbanPhaseColumn[] => {
    return KANBAN_PHASES.map((phase) => {
      // Get all leads in this phase
      const phaseLeads = leads.filter((lead) =>
        phase.statuses.includes(lead.status)
      );

      // Group by status within the phase
      // V6.2-11 FIX: Keep ALL status groups (even empty ones) to have droppable zones
      const statusGroups = phase.statuses.map((status) => {
        const statusLeads = phaseLeads.filter((lead) => lead.status === status);
        const config = statusMap.get(status);
        return {
          status,
          statusConfig:
            config ??
            DEFAULT_STATUSES.find((s) => s.value === status) ??
            DEFAULT_STATUSES[0],
          leads: statusLeads,
        };
      });
      // REMOVED: .filter((group) => group.leads.length > 0) - This was blocking D&D to empty statuses!

      return {
        id: phase.id,
        phase,
        leads: phaseLeads,
        statusGroups,
        totalCount: phaseLeads.length,
      };
    });
  };

  /**
   * Check if a status transition is allowed
   */
  const canTransitionTo = (fromStatus: string, toStatus: string): boolean => {
    const config = statusMap.get(fromStatus);
    if (!config) return false;
    return config.allowed_transitions.includes(toStatus);
  };

  /**
   * Get all statuses in a Kanban phase
   */
  const getStatusesInPhase = (phaseId: string): StatusConfig[] => {
    const phase = KANBAN_PHASES.find((p) => p.id === phaseId);
    if (!phase) return [];
    return phase.statuses
      .map((s) => statusMap.get(s))
      .filter((s): s is StatusConfig => s !== undefined);
  };

  return {
    // Data
    phases: KANBAN_PHASES,
    statuses,
    statusMap,

    // Helpers
    getPhaseForStatus,
    getStatusConfig,
    getStatusLabel,
    getPhaseLabel,
    groupLeadsByPhase,
    canTransitionTo,
    getStatusesInPhase,

    // State
    isLoading,
    error,
  };
}

export default useLeadPhases;
