/**
 * Lead Schemas — Facade re-exporting validators from 3 source modules.
 * Debt E-014: Sources will be consolidated in Phase 4.
 */

// API v1 lead validators
export {
  CreateLeadSchema,
  UpdateLeadSchema,
  type CreateLeadInput,
  type UpdateLeadInput,
} from "@/lib/validators/crm/lead.validators";

// Public form validators
export {
  LeadCreateSchema,
  LeadQualifySchema,
  LeadQuerySchema,
  type LeadCreateInput,
  type LeadQualifyInput,
  type LeadQueryInput,
} from "@/lib/validators/crm.validators";

// Status transition validators
export {
  leadStatusEnum,
  updateStatusSchema,
  qualifyLeadSchema,
  type UpdateStatusInput,
  type QualifyLeadInput,
} from "@/lib/validators/crm/lead-status.validators";
