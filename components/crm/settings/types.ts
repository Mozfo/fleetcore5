/**
 * CRM Settings Types
 *
 * Type definitions for CRM configuration settings
 *
 * @module components/crm/settings/types
 */

/**
 * Single setting data from database
 */
export interface SettingData {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  version: number;
  updated_at: string | null;
}

/**
 * All CRM settings data for the page
 */
export interface CrmSettingsData {
  leadStages: SettingData | null;
  opportunityStages: SettingData | null;
  lossReasons: SettingData | null;
}

/**
 * Tab configuration
 */
export interface SettingsTab {
  id: string;
  labelKey: string;
  icon: string;
  enabled: boolean;
  phase: number;
}

/**
 * Lead stage from settings
 */
export interface LeadStageConfig {
  value: string;
  label_en: string;
  label_fr: string;
  color: string;
  order: number;
  is_active: boolean;
  auto_actions: string[];
}

/**
 * Lead stages setting value
 */
export interface LeadStagesSettingValue {
  stages: LeadStageConfig[];
  transitions: Record<string, string[]>;
  default_stage: string;
}

/**
 * Opportunity stage from settings
 */
export interface OpportunityStageConfig {
  value: string;
  label_en: string;
  label_fr: string;
  probability: number;
  max_days: number;
  color: string;
  order: number;
  deal_rotting: boolean;
  is_active: boolean;
}

/**
 * Opportunity final stages
 */
export interface FinalStagesConfig {
  won: {
    label_en: string;
    label_fr: string;
    probability: 100;
  };
  lost: {
    label_en: string;
    label_fr: string;
    probability: 0;
  };
}

/**
 * Deal rotting config
 */
export interface DealRottingConfig {
  enabled: boolean;
  use_stage_max_days: boolean;
  global_threshold_days: number | null;
  alert_owner: boolean;
  alert_manager: boolean;
  cron_time: string;
}

/**
 * Opportunity stages setting value
 */
export interface OpportunityStagesSettingValue {
  stages: OpportunityStageConfig[];
  final_stages: FinalStagesConfig;
  rotting: DealRottingConfig;
}

/**
 * Loss reason from settings
 */
export interface LossReasonConfig {
  value: string;
  label_en: string;
  label_fr: string;
  category: "price" | "product" | "competition" | "timing" | "other";
  order: number;
  is_active: boolean;
  is_recoverable: boolean;
  recovery_delay_days: number | null;
  require_competitor_name: boolean;
}

/**
 * Recovery workflow config
 */
export interface RecoveryWorkflowConfig {
  auto_create_followup: boolean;
  send_reminder_email: boolean;
  reminder_days_before: number;
  auto_reopen: boolean;
}

/**
 * Loss reasons setting value
 */
export interface LossReasonsSettingValue {
  default: string | null;
  reasons: LossReasonConfig[];
  recovery_workflow: RecoveryWorkflowConfig;
}

/**
 * Simplified Lead stage for UI editing
 * (subset of LeadStageConfig without optional fields)
 */
export interface LeadStage {
  value: string;
  label_en: string;
  label_fr: string;
  color: string;
  order: number;
}

/**
 * Simplified Opportunity stage for UI editing
 * (subset of OpportunityStageConfig without optional fields)
 */
export interface OpportunityStage {
  value: string;
  label_en: string;
  label_fr: string;
  color: string;
  order: number;
  probability: number;
  max_days: number;
}
