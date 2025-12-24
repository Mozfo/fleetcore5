/**
 * Lead Service - Single Source of Truth for Lead Data
 *
 * This service is the ONLY point of access for Lead-related data.
 * All components and pages MUST use this service, never Prisma directly.
 *
 * Architecture:
 * - LeadService (business logic) → LeadRepository (data access) → Prisma → DB
 * - No Prisma includes in components/pages
 * - Currency derivation: Lead.country_code → dir_country_locales → currency
 *
 * @module lib/services/crm/lead.service
 */

import { prisma } from "@/lib/prisma";
import { LeadRepository } from "@/lib/repositories/crm/lead.repository";
import type { ILeadRepository } from "@/lib/repositories/crm/lead.repository.interface";
import type {
  Lead360View,
  LeadWithCountry,
  LeadCountryDataResult,
  OpportunitySummary,
  QuoteSummary,
  TimelineEntry,
} from "@/lib/types/crm/lead.types";

/**
 * LeadService - Business Logic for Lead 360 View
 *
 * PRINCIPLE: Lead = Golden Record (Single Source of Truth)
 * - All prospect data is centralized in the Lead
 * - Opportunities and Quotes REFERENCE Lead via FK
 * - Currency is DERIVED from Lead.country_code, not hardcoded
 */
export class LeadService {
  private repository: ILeadRepository;

  constructor(repository?: ILeadRepository) {
    this.repository = repository || new LeadRepository(prisma);
  }

  // ============================================
  // CORE METHODS
  // ============================================

  /**
   * Get Lead by ID
   *
   * Basic lead data without relations
   *
   * @param leadId - Lead UUID
   * @returns Lead or null
   */
  async getById(leadId: string) {
    return this.repository.findById(leadId);
  }

  /**
   * Get Lead with Country and Locale data
   *
   * CRITICAL for currency derivation
   * Flow: Lead.country_code → crm_countries → dir_country_locales → currency
   *
   * @param leadId - Lead UUID
   * @returns Lead with country/locale or null
   */
  async getLeadWithCountry(leadId: string): Promise<LeadWithCountry | null> {
    return this.repository.findWithCountry(leadId);
  }

  /**
   * Get Country Data for a Lead
   *
   * Used by QuoteForm to:
   * 1. Determine currency (from dir_country_locales)
   * 2. Filter catalogue by country
   * 3. Check GDPR requirements
   *
   * @param leadId - Lead UUID
   * @returns Country data with currency or error
   */
  async getCountryData(leadId: string): Promise<LeadCountryDataResult> {
    const lead = await this.repository.findWithCountry(leadId);

    if (!lead) {
      return {
        success: false,
        error: `Lead not found: ${leadId}`,
      };
    }

    if (!lead.country_code) {
      return {
        success: false,
        error: "Lead has no country_code set",
      };
    }

    const country = lead.crm_countries;
    if (!country) {
      return {
        success: false,
        error: `Country not found: ${lead.country_code}`,
      };
    }

    // country_locale comes from dir_country_locales (manually joined)
    const locale = lead.country_locale;
    if (!locale) {
      return {
        success: false,
        error: `Locale not configured for country: ${lead.country_code}`,
      };
    }

    return {
      success: true,
      data: {
        country_code: lead.country_code,
        currency: locale.currency,
        currency_symbol: locale.currency_symbol,
        primary_locale: locale.primary_locale,
        is_gdpr: country.country_gdpr,
        is_operational: country.is_operational,
      },
    };
  }

  // ============================================
  // LEAD 360 VIEW
  // ============================================

  /**
   * Get Complete Lead 360 View
   *
   * Returns all data needed for the Lead Browser:
   * - Lead with country/locale
   * - All opportunities
   * - All quotes (via opportunities)
   * - Timeline (activities + events)
   * - Scoring breakdown
   * - Statistics
   *
   * @param leadId - Lead UUID
   * @returns Complete Lead 360 view or null
   */
  async getLead360(leadId: string): Promise<Lead360View | null> {
    // 1. Get lead with country data
    const lead = await this.repository.findWithCountry(leadId);
    if (!lead) {
      return null;
    }

    // 2. Get related data in parallel
    const [opportunities, quotes, timeline] = await Promise.all([
      this.repository.findOpportunities(leadId),
      this.repository.findQuotes(leadId),
      this.repository.findTimeline(leadId),
    ]);

    // 3. Derive currency from country_locale (dir_country_locales)
    const currency = lead.country_locale?.currency || null;

    // 4. Calculate statistics
    const stats = this.calculateStats(opportunities, quotes);

    // 5. Build scoring object
    const scoring = {
      fit_score: lead.fit_score ? Number(lead.fit_score) : null,
      engagement_score: lead.engagement_score
        ? Number(lead.engagement_score)
        : null,
      qualification_score: lead.qualification_score,
    };

    return {
      lead,
      currency,
      opportunities,
      quotes,
      timeline,
      scoring,
      stats,
    };
  }

  // ============================================
  // OPPORTUNITIES
  // ============================================

  /**
   * Get all Opportunities for a Lead
   *
   * @param leadId - Lead UUID
   * @returns Array of opportunity summaries
   */
  async getOpportunities(leadId: string): Promise<OpportunitySummary[]> {
    return this.repository.findOpportunities(leadId);
  }

  // ============================================
  // QUOTES
  // ============================================

  /**
   * Get all Quotes for a Lead (via Opportunities)
   *
   * @param leadId - Lead UUID
   * @returns Array of quote summaries
   */
  async getQuotes(leadId: string): Promise<QuoteSummary[]> {
    return this.repository.findQuotes(leadId);
  }

  // ============================================
  // TIMELINE
  // ============================================

  /**
   * Get Timeline for a Lead
   *
   * Aggregates activities, opportunity events, quote events
   *
   * @param leadId - Lead UUID
   * @returns Sorted timeline entries
   */
  async getTimeline(leadId: string): Promise<TimelineEntry[]> {
    return this.repository.findTimeline(leadId);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Calculate statistics from opportunities and quotes
   */
  private calculateStats(
    opportunities: OpportunitySummary[],
    quotes: QuoteSummary[]
  ) {
    const openOpportunities = opportunities.filter((o) => o.status === "open");
    const wonOpportunities = opportunities.filter((o) => o.status === "won");

    const totalPipelineValue = openOpportunities.reduce(
      (sum, o) => sum + (o.expected_value || 0),
      0
    );
    const totalWonValue = wonOpportunities.reduce(
      (sum, o) => sum + (o.expected_value || 0),
      0
    );

    return {
      total_opportunities: opportunities.length,
      open_opportunities: openOpportunities.length,
      won_opportunities: wonOpportunities.length,
      total_quotes: quotes.length,
      total_pipeline_value: totalPipelineValue,
      total_won_value: totalWonValue,
    };
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

/**
 * Default LeadService instance
 *
 * Usage in Server Actions:
 * ```typescript
 * import { leadService } from "@/lib/services/crm/lead.service";
 *
 * export async function getLeadAction(leadId: string) {
 *   return leadService.getLead360(leadId);
 * }
 * ```
 */
export const leadService = new LeadService();
