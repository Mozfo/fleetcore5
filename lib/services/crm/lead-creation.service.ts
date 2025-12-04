/**
 * Lead Creation Service - Complete Lead Creation Orchestration
 *
 * This service orchestrates the complete lead creation flow:
 * 1. Generate unique lead code (LEAD-2025-001)
 * 2. Calculate scoring (fit score + engagement score)
 * 3. Determine lead priority based on qualification score
 * 4. Assign to appropriate sales representative
 * 5. Create lead in database with all computed fields
 *
 * Used by POST /api/v1/crm/leads endpoint to provide a single,
 * transactional operation for lead creation with automatic qualification.
 *
 * @module lib/services/crm/lead-creation.service
 */

import { prisma } from "@/lib/prisma";
import { LeadRepository } from "@/lib/repositories/crm/lead.repository";
import {
  CrmSettingsRepository,
  CrmSettingKey,
} from "@/lib/repositories/crm/settings.repository";
import { LeadScoringService } from "./lead-scoring.service";
import { LeadAssignmentService } from "./lead-assignment.service";
import { CountryService } from "./country.service";
import { ValidationError } from "@/lib/core/errors";
import { sendNotification } from "@/lib/notifications";
import { logger } from "@/lib/logger";
import type { CreateLeadInput } from "@/lib/validators/crm/lead.validators";
import type { crm_leads } from "@prisma/client";

/**
 * Result of lead creation orchestration
 *
 * Includes the created lead record plus computed scoring and assignment details.
 */
export interface LeadCreationResult {
  lead: crm_leads;
  scoring: {
    fit_score: number;
    engagement_score: number;
    qualification_score: number;
    lead_stage: string;
  };
  assignment: {
    assigned_to: string | null;
    assignment_reason: string;
  };
}

/**
 * Eligible employee structure for assignment
 * Matches adm_provider_employees table structure
 */
interface EligibleEmployee {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  title: string;
  status: string;
}

/**
 * Priority configuration structure from crm_settings
 */
interface PriorityConfig {
  priority_levels: string[];
  thresholds: {
    [level: string]: {
      min: number;
      color: string;
      label: string;
      order: number;
    };
  };
  default: string;
}

/**
 * Lead Creation Service
 *
 * Orchestrates complete lead creation flow with automatic scoring,
 * priority determination, and sales rep assignment.
 *
 * @example
 * ```typescript
 * const service = new LeadCreationService();
 * const result = await service.createLead(
 *   {
 *     email: "ceo@bigfleet.ae",
 *     fleet_size: "500+",
 *     country_code: "AE",
 *     message: "We need fleet management...",
 *     source: "website"
 *   },
 *   "tenant-uuid",
 *   "user-uuid"
 * );
 * // Returns: { lead, scoring, assignment }
 * ```
 */
export class LeadCreationService {
  private leadRepo: LeadRepository;
  private settingsRepo: CrmSettingsRepository;
  private scoringService: LeadScoringService;
  private assignmentService: LeadAssignmentService;
  private countryService: CountryService;

  constructor() {
    this.leadRepo = new LeadRepository(prisma);
    this.settingsRepo = new CrmSettingsRepository(prisma);
    this.scoringService = new LeadScoringService();
    this.assignmentService = new LeadAssignmentService();
    this.countryService = new CountryService();
  }

  /**
   * Create lead with complete orchestration
   *
   * Orchestrates all steps of lead creation:
   * - Generate unique lead code
   * - Calculate fit and engagement scores
   * - Determine qualification score and lead stage
   * - Calculate priority (low/medium/high/urgent)
   * - Fetch active employees
   * - Assign to appropriate sales rep
   * - Create lead in database
   *
   * @param input - Validated lead creation input
   * @param tenantId - Tenant UUID (from Clerk organization context)
   * @param createdBy - Employee UUID who created lead (optional, for internal leads)
   * @returns Complete lead creation result
   *
   * @throws Error if lead code generation fails
   * @throws Error if scoring configuration not found
   * @throws Error if assignment configuration not found
   * @throws Error if database create fails
   *
   * @example
   * ```typescript
   * const result = await service.createLead(
   *   { email: "test@example.com", source: "website" },
   *   "tenant-123",
   *   "user-456"
   * );
   *
   * // result.lead.lead_code: "LEAD-2025-001"
   * // result.scoring.lead_stage: "top_of_funnel"
   * // result.assignment.assigned_to: "emp-uuid"
   * ```
   */
  async createLead(
    input: CreateLeadInput,
    tenantId: string,
    createdBy?: string
  ): Promise<LeadCreationResult> {
    // STEP 0: GDPR validation (before any processing)
    if (input.country_code) {
      const isGdprCountry = await this.countryService.isGdprCountry(
        input.country_code
      );

      if (isGdprCountry) {
        // EU/EEA country → GDPR consent required
        if (!input.gdpr_consent) {
          throw new ValidationError(
            `GDPR consent required for EU/EEA countries (country: ${input.country_code})`
          );
        }

        if (!input.consent_ip) {
          throw new ValidationError(
            "Consent IP address required for GDPR compliance"
          );
        }
      }
    }

    // STEP 1: Generate unique lead code
    const currentYear = new Date().getFullYear();
    const lead_code = await this.leadRepo.generateLeadCode(currentYear);

    // STEP 2: Calculate scoring
    const scoring = await this.scoringService.calculateLeadScores({
      fleet_size: input.fleet_size,
      country_code: input.country_code,
      message: input.message,
      phone: input.phone,
      metadata: input.metadata,
    });

    // STEP 3: Determine priority based on qualification score
    const priority = await this.determinePriority(scoring.qualification_score);

    // STEP 4: Fetch active employees for assignment
    const activeEmployees = await prisma.adm_provider_employees.findMany({
      where: {
        status: "active",
        deleted_at: null,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        title: true,
        status: true,
      },
    });

    // STEP 5: Assign to sales rep
    const assignment = await this.assignmentService.assignToSalesRep(
      {
        fleet_size: input.fleet_size ?? null,
        country_code: input.country_code ?? null,
      },
      activeEmployees as EligibleEmployee[]
    );

    // STEP 5.5: Check expansion opportunity (non-operational countries)
    let enrichedMetadata = input.metadata || {};

    if (input.country_code) {
      const isOperational = await this.countryService.isOperational(
        input.country_code
      );

      if (!isOperational) {
        // FleetCore not yet available → Mark as expansion opportunity
        enrichedMetadata = {
          ...enrichedMetadata,
          expansion_opportunity: true,
          expansion_country: input.country_code,
          expansion_detected_at: new Date().toISOString(),
        };
      }
    }

    // STEP 6: Create lead in database
    // Use provided priority/assigned_to if given, otherwise use auto-calculated values
    const finalPriority = input.priority ?? priority;
    const finalAssignedTo =
      input.assigned_to_id ?? assignment.assigned_to ?? null;

    const leadData = {
      lead_code,
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name,
      company_name: input.company_name ?? null,
      phone: input.phone ?? null,
      fleet_size: input.fleet_size ?? null,
      country_code: input.country_code ?? null,
      city: input.city ?? null,
      website_url: input.website_url ?? null,
      current_software: input.current_software ?? null,
      message: input.message ?? null,
      source: input.source ?? null,
      utm_source: input.utm_source ?? null,
      utm_medium: input.utm_medium ?? null,
      utm_campaign: input.utm_campaign ?? null,

      // Scoring fields
      fit_score: scoring.fit_score,
      engagement_score: scoring.engagement_score,
      qualification_score: scoring.qualification_score,
      lead_stage: scoring.lead_stage,

      // Assignment (use provided or auto-assigned)
      assigned_to: finalAssignedTo,

      // Priority (use provided or auto-calculated)
      priority: finalPriority,

      // Status
      status: "new",

      // GDPR fields (only for EU/EEA countries)
      gdpr_consent: input.gdpr_consent ?? null,
      consent_at: input.gdpr_consent ? new Date() : null,
      consent_ip: input.consent_ip ?? null,

      // Metadata (enriched with expansion flag if applicable)
      metadata: enrichedMetadata,
    };

    const lead = await this.leadRepo.create(
      leadData,
      createdBy ?? "",
      tenantId
    );

    // STEP 7: Send notification to assigned sales rep (if assigned)
    if (assignment.assigned_to) {
      // Find the assigned employee to get their email and name
      const assignedEmployee = activeEmployees.find(
        (emp) => emp.id === assignment.assigned_to
      );

      if (assignedEmployee) {
        const leadName =
          [input.first_name, input.last_name].filter(Boolean).join(" ") ||
          input.email.split("@")[0];

        try {
          const notificationResult = await sendNotification(
            "crm.sales.assignment",
            assignedEmployee.email,
            {
              employee_name: assignedEmployee.first_name,
              lead_name: leadName,
              company_name: input.company_name || "N/A",
              priority: finalPriority as "urgent" | "high" | "medium" | "low",
              fit_score: scoring.fit_score,
              qualification_score: scoring.qualification_score,
              lead_stage: scoring.lead_stage,
              fleet_size: input.fleet_size || "N/A",
              country_code: input.country_code || "N/A",
              lead_detail_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.io"}/crm/leads/${lead.id}`,
            },
            {
              leadId: lead.id,
              tenantId,
              idempotencyKey: `sales_rep_assignment_${lead.id}`,
            }
          );

          logger.info(
            {
              leadId: lead.id,
              leadCode: lead.lead_code,
              assignedTo: assignedEmployee.email,
              notificationQueued: notificationResult.success,
              queueId: notificationResult.queueId,
            },
            "[Lead Creation] Sales rep assignment notification queued"
          );
        } catch (notificationError) {
          // Log error but don't fail lead creation
          logger.error(
            {
              leadId: lead.id,
              error:
                notificationError instanceof Error
                  ? notificationError.message
                  : "Unknown",
            },
            "[Lead Creation] Failed to queue sales rep assignment notification"
          );
        }
      }
    }

    return {
      lead,
      scoring: {
        fit_score: scoring.fit_score,
        engagement_score: scoring.engagement_score,
        qualification_score: scoring.qualification_score,
        lead_stage: scoring.lead_stage,
      },
      assignment: {
        assigned_to: assignment.assigned_to,
        assignment_reason: assignment.assignment_reason,
      },
    };
  }

  /**
   * Determine lead priority based on qualification score
   *
   * Uses configurable thresholds from crm_settings (lead_priority_config).
   * This allows dynamic adjustment of priority levels without code changes.
   *
   * Default mapping (configurable):
   * - 80-100 points → urgent (top 20%, immediate action)
   * - 70-79 points → high (SQL, priority follow-up)
   * - 40-69 points → medium (MQL, nurture campaign)
   * - 0-39 points → low (TOF, automated drip)
   *
   * @param qualificationScore - Score from 0-100
   * @returns Priority level (e.g., 'urgent', 'high', 'medium', 'low')
   *
   * @example
   * ```typescript
   * await determinePriority(85); // Returns: "urgent"
   * await determinePriority(76); // Returns: "high"
   * await determinePriority(55); // Returns: "medium"
   * await determinePriority(25); // Returns: "low"
   * ```
   */
  private async determinePriority(qualificationScore: number): Promise<string> {
    try {
      const config = await this.settingsRepo.getSettingValue<PriorityConfig>(
        CrmSettingKey.LEAD_PRIORITY_CONFIG
      );

      if (!config) {
        return "medium";
      }

      // Sort thresholds by min score descending
      const sortedThresholds = Object.entries(config.thresholds).sort(
        ([, a], [, b]) => b.min - a.min
      );

      // Find first threshold where score >= min
      for (const [level, threshold] of sortedThresholds) {
        if (qualificationScore >= threshold.min) {
          return level;
        }
      }

      // Fallback to default
      return config.default;
    } catch (_error) {
      return "medium";
    }
  }
}
