/**
 * Lead Types — Re-exports from @/types/crm (single source of truth).
 * Debt E-013: types/crm.ts is a God File — will be split in Phase 4.
 */

export type {
  Lead,
  LeadStatus,
  LeadStage,
  LeadPriority,
  LeadSource,
  FleetSize,
  LeadsApiResponse,
  LeadStatusConfig,
  FilterState,
} from "@/types/crm";

export {
  LEAD_STATUS_VALUES,
  LEAD_STAGE_VALUES,
  FLEET_SIZE_VALUES,
} from "@/types/crm";
