import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient, crm_leads } from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PrismaTransaction } from "@/lib/core/types";
import type {
  LeadWithCountry,
  OpportunitySummary,
  QuoteSummary,
  TimelineEntry,
} from "@/lib/types/crm/lead.types";
import type { ILeadRepository, Lead } from "./lead.repository.interface";

/**
 * Whitelist of fields allowed for sorting leads.
 * Excludes PII (phone), notes, metadata, and soft-delete fields.
 */
export const LEAD_SORT_FIELDS = [
  "id",
  "lead_code",
  "email",
  "first_name",
  "last_name",
  "company_name",
  "status",
  "lead_stage",
  "fit_score",
  "engagement_score",
  "qualification_score",
  "created_at",
  "updated_at",
  "qualified_date",
  "converted_date",
] as const satisfies SortFieldWhitelist;

/**
 * Lead with relations (assigned employee and source)
 * Note: crm_lead_sources uses JSONB translations (name_translations, description_translations)
 */
export type LeadWithRelations = crm_leads & {
  eu1f9qh?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  crm_lead_sources?: {
    id: string;
    name_translations: Record<string, string>;
    description_translations?: Record<string, string>;
  } | null;
};

/**
 * Repository for managing CRM leads
 *
 * Implements ILeadRepository for decoupling from Prisma.
 *
 * Note: crm_leads table does NOT have tenant_id column.
 * Multi-tenant isolation is handled via assigned_to (employee → tenant).
 */
export class LeadRepository
  extends BaseRepository<Lead>
  implements ILeadRepository
{
  constructor(prisma: PrismaClient) {
    super(prisma.crm_leads, prisma);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return LEAD_SORT_FIELDS;
  }

  /**
   * Find a lead by email address (case insensitive)
   *
   * @param email - Email address to search (case insensitive)
   * @returns Lead with relations or null if not found
   *
   * @example
   * ```typescript
   * const lead = await leadRepo.findByEmail('contact@example.com');
   * if (lead) {
   *   // Access assigned employee and source
   *   const employee = lead.eu1f9qh;
   *   const source = lead.crm_lead_sources;
   * }
   * ```
   */
  async findByEmail(email: string): Promise<LeadWithRelations | null> {
    return await this.model.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive", // Case insensitive search
        },
        deleted_at: null, // Exclude soft-deleted leads
      },
      include: {
        // Include assigned employee (if any)
        eu1f9qh: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        // Include lead source (if any)
        crm_lead_sources: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Count active leads assigned to a specific employee
   *
   * V6.3: Active leads have status: 'new', 'demo', 'proposal_sent', 'payment_pending'
   *
   * @param assignedTo - UUID of the assigned employee
   * @returns Count of active leads (excludes terminal statuses, soft-deleted)
   *
   * @example
   * ```typescript
   * const activeCount = await leadRepo.countActiveLeads('employee-uuid');
   * // Returns number of active leads for the employee
   * ```
   */
  async countActiveLeads(assignedTo: string): Promise<number> {
    return await this.model.count({
      where: {
        assigned_to: assignedTo,
        status: {
          in: ["new", "demo", "proposal_sent", "payment_pending"], // V6.3: Active statuses only
        },
        deleted_at: null, // Exclude soft-deleted leads
      },
    });
  }

  /**
   * Generate a unique lead code for the given year
   * Format: LEAD-YYYY-NNNNN (e.g., LEAD-2025-00001)
   *
   * Sequence resets at the beginning of each calendar year.
   * Supports optional transaction context for atomic lead creation.
   *
   * Note: This method does NOT handle retry logic. Race conditions
   * causing unique constraint violations (P2002) should be handled
   * at the service layer by re-calling this method.
   *
   * @param year - Calendar year (e.g., 2025)
   * @param tx - Optional Prisma transaction for atomic operations
   * @returns Next available unique lead code for the year
   *
   * @example
   * ```typescript
   * // Outside transaction
   * const code = await repository.generateLeadCode(2025);
   * // Returns: 'LEAD-2025-00001' (first of year)
   * ```
   *
   * @example
   * ```typescript
   * // Inside transaction (atomic lead creation)
   * await prisma.$transaction(async (tx) => {
   *   const code = await repository.generateLeadCode(2025, tx);
   *   const lead = await tx.crm_leads.create({
   *     data: { lead_code: code, ...data }
   *   });
   *   return lead;
   * });
   * ```
   */
  async generateLeadCode(
    year: number,
    tx?: PrismaTransaction
  ): Promise<string> {
    // 1. Determine model (transaction-aware)
    const model = tx ? tx.crm_leads : this.model;

    // 2. Construire le préfixe pour l'année
    const prefix = `LEAD-${year}-`;

    // 3. Trouver le dernier lead_code de l'année (tri alphabétique DESC)
    const lastLead = await model.findFirst({
      where: {
        lead_code: { startsWith: prefix },
        deleted_at: null, // Exclure soft-deleted
      },
      orderBy: { lead_code: "desc" }, // Tri DESC => dernier en premier
      select: { lead_code: true }, // Optimisation: charger uniquement lead_code
    });

    // 4. Calculer le prochain numéro de séquence
    let nextSequence = 1; // Défaut: premier lead de l'année

    if (lastLead?.lead_code) {
      // Extraire le numéro séquentiel du dernier code
      const parts = lastLead.lead_code.split("-"); // ['LEAD', '2025', '00042']

      if (parts.length === 3) {
        const currentSeq = parseInt(parts[2], 10); // 42

        // Si parsing réussit (pas NaN), incrémenter
        if (!isNaN(currentSeq)) {
          nextSequence = currentSeq + 1; // 43
        }
        // Si parsing échoue (format invalide), garder nextSequence = 1
      }
      // Si split ne donne pas 3 parties, garder nextSequence = 1
    }

    // 5. Formater avec padding 5 chiffres minimum
    const paddedSeq = nextSequence.toString().padStart(5, "0");

    // 6. Retourner le code complet
    return `${prefix}${paddedSeq}`;
  }

  // ============================================
  // LEAD 360 VIEW METHODS
  // ============================================

  /**
   * Find Lead with Country and Locale data
   *
   * CRITICAL for currency derivation:
   * Lead.country_code → crm_countries (GDPR, operational)
   *                   → dir_country_locales (currency, locale)
   *
   * Note: crm_countries and dir_country_locales are NOT linked via FK.
   * They share country_code as unique key, so we join manually.
   *
   * @param id - Lead UUID
   * @returns Lead with country and locale data or null
   */
  async findWithCountry(id: string): Promise<LeadWithCountry | null> {
    // 1. Get lead with country relation
    const lead = await this.prisma.crm_leads.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        crm_countries: true,
      },
    });

    if (!lead) {
      return null;
    }

    // 2. Get locale data from dir_country_locales (manual join on country_code)
    let country_locale = null;
    if (lead.country_code) {
      const locale = await this.prisma.dir_country_locales.findUnique({
        where: { country_code: lead.country_code },
        select: {
          currency: true,
          currency_symbol: true,
          primary_locale: true,
          timezone: true,
        },
      });
      country_locale = locale;
    }

    return {
      ...lead,
      country_locale,
    };
  }

  /**
   * Find all Opportunities for a Lead
   *
   * Returns summary data for Lead 360 view
   *
   * @param leadId - Lead UUID
   * @returns Array of opportunity summaries
   */
  async findOpportunities(leadId: string): Promise<OpportunitySummary[]> {
    const opportunities = await this.prisma.crm_opportunities.findMany({
      where: {
        lead_id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        stage: true,
        status: true,
        expected_value: true,
        currency: true,
        probability_percent: true,
        expected_close_date: true,
        won_date: true,
        lost_date: true,
        created_at: true,
        crm_pipelines: {
          select: {
            name_translations: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    return opportunities.map((opp) => ({
      id: opp.id,
      stage: opp.stage,
      status: opp.status,
      expected_value: opp.expected_value ? Number(opp.expected_value) : null,
      currency: opp.currency,
      probability_percent: opp.probability_percent
        ? Number(opp.probability_percent)
        : null,
      expected_close_date: opp.expected_close_date,
      won_date: opp.won_date,
      lost_date: opp.lost_date,
      created_at: opp.created_at,
      pipeline_name_translations: opp.crm_pipelines
        ?.name_translations as Record<string, string> | null,
    }));
  }

  /**
   * Find all Quotes for a Lead (via Opportunities)
   *
   * @param leadId - Lead UUID
   * @returns Array of quote summaries
   */
  async findQuotes(leadId: string): Promise<QuoteSummary[]> {
    // First get all opportunity IDs for this lead
    const opportunities = await this.prisma.crm_opportunities.findMany({
      where: {
        lead_id: leadId,
        deleted_at: null,
      },
      select: { id: true },
    });

    const opportunityIds = opportunities.map((o) => o.id);

    if (opportunityIds.length === 0) {
      return [];
    }

    const quotes = await this.prisma.crm_quotes.findMany({
      where: {
        opportunity_id: { in: opportunityIds },
        deleted_at: null,
      },
      select: {
        id: true,
        quote_reference: true,
        status: true,
        subtotal: true,
        discount_amount: true,
        total_value: true,
        currency: true,
        valid_until: true,
        created_at: true,
        opportunity_id: true,
      },
      orderBy: { created_at: "desc" },
    });

    return quotes.map((quote) => ({
      id: quote.id,
      quote_number: quote.quote_reference,
      status: quote.status,
      subtotal: Number(quote.subtotal),
      discount_amount: quote.discount_amount
        ? Number(quote.discount_amount)
        : null,
      total_amount: quote.total_value ? Number(quote.total_value) : 0,
      currency: quote.currency,
      valid_until: quote.valid_until,
      created_at: quote.created_at,
      opportunity_id: quote.opportunity_id,
    }));
  }

  /**
   * Build Timeline for a Lead
   *
   * Aggregates:
   * - Activities (crm_lead_activities)
   * - Opportunity creation events
   * - Quote creation events
   *
   * @param leadId - Lead UUID
   * @returns Sorted timeline entries (newest first)
   */
  async findTimeline(leadId: string): Promise<TimelineEntry[]> {
    const timeline: TimelineEntry[] = [];

    // 1. Get activities (crm_lead_activities has no deleted_at or created_by FK)
    const activities = await this.prisma.crm_lead_activities.findMany({
      where: {
        lead_id: leadId,
      },
      select: {
        id: true,
        activity_type: true,
        title: true,
        description: true,
        metadata: true,
        created_at: true,
        performed_by: true,
        performed_by_name: true,
      },
      orderBy: { created_at: "desc" },
    });

    for (const activity of activities) {
      // created_at can be null in this table
      if (!activity.created_at) continue;

      timeline.push({
        id: activity.id,
        type: this.mapActivityType(activity.activity_type),
        title: activity.title || activity.activity_type,
        description: activity.description,
        metadata: (activity.metadata as Record<string, unknown>) || {},
        created_at: activity.created_at,
        created_by: activity.performed_by_name
          ? {
              id: activity.performed_by || "",
              first_name: activity.performed_by_name.split(" ")[0] || "",
              last_name:
                activity.performed_by_name.split(" ").slice(1).join(" ") ||
                null,
            }
          : null,
        entity_id: activity.id,
        entity_type: "activity",
      });
    }

    // 2. Get opportunity events
    const opportunities = await this.prisma.crm_opportunities.findMany({
      where: {
        lead_id: leadId,
        deleted_at: null,
      },
      select: {
        id: true,
        stage: true,
        expected_value: true,
        currency: true,
        created_at: true,
        eqtkd3: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    for (const opp of opportunities) {
      const value = opp.expected_value ? Number(opp.expected_value) : null;
      timeline.push({
        id: `opp-${opp.id}`,
        type: "opportunity_created",
        title: "Opportunity created",
        description: value
          ? `Expected value: ${value}${opp.currency ? ` ${opp.currency}` : ""}`
          : null,
        metadata: { stage: opp.stage, expected_value: value },
        created_at: opp.created_at,
        created_by: opp.eqtkd3,
        entity_id: opp.id,
        entity_type: "opportunity",
      });
    }

    // 3. Get quote events (get opportunity IDs first)
    const oppIds = opportunities.map((o) => o.id);

    if (oppIds.length > 0) {
      const quotes = await this.prisma.crm_quotes.findMany({
        where: {
          opportunity_id: { in: oppIds },
          deleted_at: null,
        },
        select: {
          id: true,
          quote_reference: true,
          total_value: true,
          currency: true,
          status: true,
          created_at: true,
          created_by: true,
        },
        orderBy: { created_at: "desc" },
      });

      // Get employee names for creators
      const creatorIds = quotes
        .map((q) => q.created_by)
        .filter((id): id is string => !!id);

      const creators =
        creatorIds.length > 0
          ? await this.prisma.adm_provider_employees.findMany({
              where: { id: { in: creatorIds } },
              select: { id: true, first_name: true, last_name: true },
            })
          : [];

      const creatorMap = new Map(creators.map((c) => [c.id, c]));

      for (const quote of quotes) {
        timeline.push({
          id: `quote-${quote.id}`,
          type: "quote_created",
          title: `Quote ${quote.quote_reference} created`,
          description: `Total: ${Number(quote.total_value || 0)} ${quote.currency}`,
          metadata: {
            quote_number: quote.quote_reference,
            total_amount: Number(quote.total_value || 0),
            status: quote.status,
          },
          created_at: quote.created_at,
          created_by: quote.created_by
            ? creatorMap.get(quote.created_by) || null
            : null,
          entity_id: quote.id,
          entity_type: "quote",
        });
      }
    }

    // 4. Sort by date (newest first)
    timeline.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return timeline;
  }

  /**
   * Map activity_type to TimelineEntryType
   */
  private mapActivityType(activityType: string): TimelineEntry["type"] {
    const mapping: Record<string, TimelineEntry["type"]> = {
      note: "note_added",
      email: "email_sent",
      call: "call_logged",
      meeting: "meeting_scheduled",
      status_change: "status_changed",
      stage_change: "stage_changed",
      assignment: "assigned",
    };
    return mapping[activityType] || "activity_added";
  }
}
