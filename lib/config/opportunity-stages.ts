/**
 * Opportunity Pipeline Stages Configuration
 *
 * Defines the sales pipeline stages with their associated:
 * - probability: Default win probability percentage
 * - maxDays: Maximum days before a deal is considered "rotting"
 * - color: Tailwind color for UI display
 * - labelKey: i18n translation key
 *
 * Note: WON/LOST are handled via the `status` field (opportunity_status enum),
 * not as stages. When status becomes 'won' or 'lost', the stage remains as-is.
 *
 * @module lib/config/opportunity-stages
 */

/**
 * Opportunity stage configuration
 */
export interface OpportunityStageConfig {
  /** Stage identifier stored in DB */
  value: string;
  /** Default display label (fallback if i18n not available) */
  label: string;
  /** i18n translation key */
  labelKey: string;
  /** Default probability percentage (0-100) */
  probability: number;
  /** Maximum days before deal rotting alert */
  maxDays: number;
  /** Tailwind color class suffix (e.g., "blue" for bg-blue-500) */
  color: string;
  /** Order in pipeline (1-based) */
  order: number;
}

/**
 * Pipeline stages configuration
 *
 * Order: QUALIFICATION → DEMO → PROPOSAL → NEGOTIATION → CONTRACT_SENT
 */
export const OPPORTUNITY_STAGES: readonly OpportunityStageConfig[] = [
  {
    value: "qualification",
    label: "Qualification",
    labelKey: "crm:opportunity.stages.qualification",
    probability: 20,
    maxDays: 14,
    color: "blue",
    order: 1,
  },
  {
    value: "demo",
    label: "Demo",
    labelKey: "crm:opportunity.stages.demo",
    probability: 40,
    maxDays: 10,
    color: "purple",
    order: 2,
  },
  {
    value: "proposal",
    label: "Proposal",
    labelKey: "crm:opportunity.stages.proposal",
    probability: 60,
    maxDays: 14,
    color: "yellow",
    order: 3,
  },
  {
    value: "negotiation",
    label: "Negotiation",
    labelKey: "crm:opportunity.stages.negotiation",
    probability: 80,
    maxDays: 10,
    color: "orange",
    order: 4,
  },
  {
    value: "contract_sent",
    label: "Contract Sent",
    labelKey: "crm:opportunity.stages.contract_sent",
    probability: 90,
    maxDays: 7,
    color: "green",
    order: 5,
  },
] as const;

/**
 * Type for valid opportunity stage values
 */
export type OpportunityStageValue =
  (typeof OPPORTUNITY_STAGES)[number]["value"];

/**
 * All valid stage values as an array (useful for Zod enum)
 */
export const OPPORTUNITY_STAGE_VALUES = OPPORTUNITY_STAGES.map(
  (s) => s.value
) as [string, ...string[]];

/**
 * Get stage configuration by value
 */
export function getStageConfig(
  stage: string
): OpportunityStageConfig | undefined {
  return OPPORTUNITY_STAGES.find((s) => s.value === stage);
}

/**
 * Get probability for a given stage
 * Returns 0 if stage not found
 */
export function getStageProbability(stage: string): number {
  return getStageConfig(stage)?.probability ?? 0;
}

/**
 * Get max days for a given stage
 * Returns 14 (default) if stage not found
 */
export function getStageMaxDays(stage: string): number {
  return getStageConfig(stage)?.maxDays ?? 14;
}

/**
 * Get color for a given stage
 * Returns "gray" if stage not found
 */
export function getStageColor(stage: string): string {
  return getStageConfig(stage)?.color ?? "gray";
}

/**
 * Get next stage in pipeline (or undefined if at end)
 */
export function getNextStage(
  currentStage: string
): OpportunityStageConfig | undefined {
  const current = getStageConfig(currentStage);
  if (!current) return undefined;

  return OPPORTUNITY_STAGES.find((s) => s.order === current.order + 1);
}

/**
 * Get previous stage in pipeline (or undefined if at beginning)
 */
export function getPreviousStage(
  currentStage: string
): OpportunityStageConfig | undefined {
  const current = getStageConfig(currentStage);
  if (!current) return undefined;

  return OPPORTUNITY_STAGES.find((s) => s.order === current.order - 1);
}

/**
 * Check if moving from one stage to another is valid
 * (can only move forward or backward by one step, or stay same)
 */
export function isValidStageTransition(
  fromStage: string,
  toStage: string
): boolean {
  const from = getStageConfig(fromStage);
  const to = getStageConfig(toStage);

  if (!from || !to) return false;

  // Allow same stage (no change)
  if (from.value === to.value) return true;

  // Allow forward or backward by 1 step
  const diff = to.order - from.order;
  return diff === 1 || diff === -1;
}

/**
 * Get stages for dropdown/select UI
 * Returns array of { value, label } for use in forms
 */
export function getStagesForSelect(): Array<{ value: string; label: string }> {
  return OPPORTUNITY_STAGES.map((s) => ({
    value: s.value,
    label: s.label,
  }));
}

/**
 * Default stage for new opportunities
 */
export const DEFAULT_OPPORTUNITY_STAGE = "qualification";

/**
 * Default probability for new opportunities
 */
export const DEFAULT_OPPORTUNITY_PROBABILITY = 20;
