/**
 * Lead Scoring Service - CRM Lead Qualification Algorithms
 *
 * This service implements 3 scoring algorithms for automatic lead qualification:
 * 1. calculateFitScore(): Evaluate if lead matches target customer profile (0-60 points)
 * 2. calculateEngagementScore(): Measure prospect interest and behavior (0-100 points)
 * 3. calculateQualificationScore(): Composite score to determine lead_stage (0-100 points)
 *
 * Scoring Formula:
 * - qualification_score = (fit_score × 0.6) + (engagement_score × 0.4)
 * - Thresholds: SQL ≥70, MQL ≥40, TOF <40
 *
 * Configuration is loaded from crm_settings table (lead_scoring_config).
 *
 * @module lib/services/crm/lead-scoring.service
 */

import { CrmSettingsRepository } from "@/lib/repositories/crm/settings.repository";
import { CountryService } from "./country.service";
import { prisma } from "@/lib/prisma";

// ===== TYPES & INTERFACES =====

/**
 * Lead scoring configuration structure
 * Loaded from crm_settings.lead_scoring_config
 */
export interface ScoringConfig {
  fleet_size_points: Record<string, { vehicles: number; points: number }>;
  country_tier_points: {
    tier1: { countries: string[]; points: number };
    tier2: { countries: string[]; points: number };
    tier3: { countries: string[]; points: number };
    tier4: { countries: string[]; points: number };
    tier5: { points: number };
  };
  message_length_thresholds: {
    detailed: { min: number; points: number };
    substantial: { min: number; points: number };
    minimal: { min: number; points: number };
    none: { points: number };
  };
  phone_points: { provided: number; missing: number };
  page_views_thresholds: {
    very_engaged: { min: number; points: number };
    interested: { min: number; points: number };
    curious: { min: number; points: number };
    normal: { points: number };
  };
  time_on_site_thresholds: {
    deep_read: { min: number; points: number };
    moderate: { min: number; points: number };
    brief: { min: number; points: number };
    quick: { points: number };
  };
  qualification_stage_thresholds: {
    sales_qualified: number;
    marketing_qualified: number;
    top_of_funnel: number;
  };
  qualification_weights: {
    fit: number;
    engagement: number;
  };
}

/**
 * Input for fit score calculation
 */
export interface FitScoreInput {
  fleet_size: string | null;
  country_code: string | null;
}

/**
 * Input for engagement score calculation
 */
export interface EngagementScoreInput {
  message?: string | null;
  phone?: string | null;
  metadata?: LeadMetadata | null;
}

/**
 * Lead metadata structure (from Json field)
 */
export interface LeadMetadata {
  page_views?: number;
  time_on_site?: number;
  [key: string]: unknown; // Extensible for other properties
}

/**
 * Lead stage type (aligned with Prisma enum)
 *
 * Note: 'opportunity' is included for type completeness but is NOT
 * assigned by scoring algorithms. It's set during the separate
 * lead-to-opportunity conversion flow.
 */
export type LeadStage =
  | "top_of_funnel"
  | "marketing_qualified"
  | "sales_qualified"
  | "opportunity";

/**
 * Detailed breakdown for transparency and audit trail
 */
export interface ScoringBreakdown {
  fit: {
    fleet_points: number;
    country_points: number;
    total: number;
  };
  engagement: {
    message_points: number;
    phone_points: number;
    page_views_points: number;
    time_on_site_points: number;
    total: number;
  };
  qualification: {
    formula: string;
    fit_weight: number;
    engagement_weight: number;
    total: number;
    stage: LeadStage;
  };
}

/**
 * Result of qualification scoring
 */
export interface QualificationResult {
  fit_score: number; // 0-60
  engagement_score: number; // 0-100
  qualification_score: number; // 0-100 (rounded)
  lead_stage: LeadStage;
  breakdown: ScoringBreakdown;
}

// ===== SERVICE CLASS =====

/**
 * Lead Scoring Service
 *
 * Provides algorithms for automatic lead qualification based on
 * fit score (target customer profile) and engagement score (prospect behavior).
 *
 * Configuration is loaded dynamically from crm_settings table.
 */
export class LeadScoringService {
  private settingsRepo: CrmSettingsRepository;
  private countryService: CountryService;

  constructor() {
    this.settingsRepo = new CrmSettingsRepository(prisma);
    this.countryService = new CountryService();
  }

  /**
   * Load scoring configuration from database
   *
   * @returns Scoring configuration
   * @throws Error if configuration not found
   */
  private async loadConfig(): Promise<ScoringConfig> {
    const config = await this.settingsRepo.getSettingValue<ScoringConfig>(
      "lead_scoring_config"
    );

    if (!config) {
      throw new Error(
        "Lead scoring configuration not found in crm_settings. " +
          "Run seed script: pnpm tsx scripts/seed-crm-settings.ts"
      );
    }

    return config;
  }

  /**
   * Calculate fit score based on fleet size and target market
   *
   * Evaluates if the lead matches FleetCore's target customer profile:
   * - Fleet size: Larger fleets = higher score (up to 40 points)
   * - Country: Strategic markets = higher score (up to 20 points)
   *
   * @param input - Fleet size and country code
   * @returns Fit score (0-60 points)
   *
   * @example
   * ```typescript
   * const score = await service.calculateFitScore({
   *   fleet_size: "500+",
   *   country_code: "AE"
   * });
   * // Returns: 60 (40 + 20)
   * ```
   */
  async calculateFitScore(input: FitScoreInput): Promise<number> {
    const config = await this.loadConfig();

    // Calculate fleet points
    const fleetSize = input.fleet_size || "unknown";
    const fleetData =
      config.fleet_size_points[fleetSize] ||
      config.fleet_size_points["unknown"];
    const fleetPoints = fleetData?.points || 10;

    // Calculate country points
    const countryCode = input.country_code?.toUpperCase() || "";
    let countryPoints = config.country_tier_points.tier5.points; // Default

    if (countryCode) {
      // Check if FleetCore is operational in this country
      const isOperational =
        await this.countryService.isOperational(countryCode);

      if (!isOperational) {
        // Non-operational country → Fixed 5 points (expansion opportunity)
        countryPoints = 5;
      } else {
        // Operational country → Use tier-based scoring
        if (config.country_tier_points.tier1.countries.includes(countryCode)) {
          countryPoints = config.country_tier_points.tier1.points;
        } else if (
          config.country_tier_points.tier2.countries.includes(countryCode)
        ) {
          countryPoints = config.country_tier_points.tier2.points;
        } else if (
          config.country_tier_points.tier3.countries.includes(countryCode)
        ) {
          countryPoints = config.country_tier_points.tier3.points;
        } else if (
          config.country_tier_points.tier4.countries.includes(countryCode)
        ) {
          countryPoints = config.country_tier_points.tier4.points;
        }
      }
    }

    return fleetPoints + countryPoints;
  }

  /**
   * Calculate engagement score based on prospect behavior
   *
   * Measures prospect interest and engagement through:
   * - Message length: Detailed messages = higher interest (up to 30 points)
   * - Phone provided: Willingness to be contacted (20 points)
   * - Page views: Website exploration depth (up to 30 points)
   * - Time on site: Content engagement duration (up to 20 points)
   *
   * @param input - Message, phone, and behavioral metadata
   * @returns Engagement score (0-100 points)
   *
   * @example
   * ```typescript
   * const score = await service.calculateEngagementScore({
   *   message: "I need fleet management for 200 vehicles...",
   *   phone: "+33612345678",
   *   metadata: { page_views: 12, time_on_site: 720 }
   * });
   * // Returns: 100 (30+20+30+20)
   * ```
   */
  async calculateEngagementScore(input: EngagementScoreInput): Promise<number> {
    const config = await this.loadConfig();

    // Message points
    const messagePoints = this.calculateMessagePoints(
      input.message,
      config.message_length_thresholds
    );

    // Phone points
    const phoneProvided = input.phone && input.phone.trim().length > 0;
    const phonePoints = phoneProvided
      ? config.phone_points.provided
      : config.phone_points.missing;

    // Page views points
    const pageViews = input.metadata?.page_views ?? 0;
    const pageViewsPoints = this.calculatePageViewsPoints(
      pageViews,
      config.page_views_thresholds
    );

    // Time on site points
    const timeOnSite = input.metadata?.time_on_site ?? 0;
    const timeOnSitePoints = this.calculateTimeOnSitePoints(
      timeOnSite,
      config.time_on_site_thresholds
    );

    return messagePoints + phonePoints + pageViewsPoints + timeOnSitePoints;
  }

  /**
   * Calculate qualification score and determine lead stage
   *
   * Combines fit and engagement scores using weighted formula:
   * qualification_score = (fit × 0.6) + (engagement × 0.4)
   *
   * Lead stage determination:
   * - SQL (Sales Qualified): score >= 70
   * - MQL (Marketing Qualified): 40 <= score < 70
   * - TOF (Top of Funnel): score < 40
   *
   * @param fitScore - Fit score (0-60)
   * @param engagementScore - Engagement score (0-100)
   * @returns Qualification result with score, stage, and breakdown
   *
   * @example
   * ```typescript
   * const result = await service.calculateQualificationScore(60, 100);
   * // Returns: {
   * //   fit_score: 60,
   * //   engagement_score: 100,
   * //   qualification_score: 76,
   * //   lead_stage: 'sales_qualified',
   * //   breakdown: { ... }
   * // }
   * ```
   */
  async calculateQualificationScore(
    fitScore: number,
    engagementScore: number
  ): Promise<QualificationResult> {
    const config = await this.loadConfig();

    // Calculate weighted qualification score
    const rawScore =
      fitScore * config.qualification_weights.fit +
      engagementScore * config.qualification_weights.engagement;
    const qualification_score = Math.round(rawScore);

    // Determine lead stage
    let lead_stage: LeadStage;
    if (
      qualification_score >=
      config.qualification_stage_thresholds.sales_qualified
    ) {
      lead_stage = "sales_qualified";
    } else if (
      qualification_score >=
      config.qualification_stage_thresholds.marketing_qualified
    ) {
      lead_stage = "marketing_qualified";
    } else {
      lead_stage = "top_of_funnel";
    }

    // Build breakdown for audit trail
    const breakdown: ScoringBreakdown = {
      fit: {
        fleet_points: 0, // Will be populated by caller if needed
        country_points: 0,
        total: fitScore,
      },
      engagement: {
        message_points: 0, // Will be populated by caller if needed
        phone_points: 0,
        page_views_points: 0,
        time_on_site_points: 0,
        total: engagementScore,
      },
      qualification: {
        formula: `(fit × ${config.qualification_weights.fit}) + (engagement × ${config.qualification_weights.engagement})`,
        fit_weight: config.qualification_weights.fit,
        engagement_weight: config.qualification_weights.engagement,
        total: qualification_score,
        stage: lead_stage,
      },
    };

    return {
      fit_score: fitScore,
      engagement_score: engagementScore,
      qualification_score,
      lead_stage,
      breakdown,
    };
  }

  /**
   * All-in-one: Calculate all scores from lead data
   *
   * Convenience method that orchestrates all 3 scoring algorithms.
   * Useful for processing lead data from forms or database queries.
   *
   * @param leadData - Partial lead data (from DB or form)
   * @returns Complete qualification result
   *
   * @example
   * ```typescript
   * const result = await service.calculateLeadScores({
   *   fleet_size: "101-500",
   *   country_code: "FR",
   *   message: "We manage 200 taxis...",
   *   phone: "+33612345678",
   *   metadata: { page_views: 7, time_on_site: 450 }
   * });
   * ```
   */
  async calculateLeadScores(
    leadData: Partial<{
      fleet_size: string | null;
      country_code: string | null;
      message: string | null;
      phone: string | null;
      metadata: LeadMetadata | null;
    }>
  ): Promise<QualificationResult> {
    const fit = await this.calculateFitScore({
      fleet_size: leadData.fleet_size ?? null,
      country_code: leadData.country_code ?? null,
    });

    const engagement = await this.calculateEngagementScore({
      message: leadData.message ?? null,
      phone: leadData.phone ?? null,
      metadata: leadData.metadata ?? null,
    });

    return await this.calculateQualificationScore(fit, engagement);
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Calculate points for message length
   *
   * Uses cascade logic (early return) to avoid point accumulation.
   * Scoring:
   * - > 200 chars: 30 points (detailed needs expressed)
   * - > 100 chars: 20 points (substantial interest)
   * - > 20 chars: 10 points (minimal interest)
   * - <= 20 chars or empty: 0 points
   *
   * @param message - Message text
   * @param thresholds - Message length thresholds from config
   * @returns Message points (0-30)
   */
  private calculateMessagePoints(
    message: string | null | undefined,
    thresholds: ScoringConfig["message_length_thresholds"]
  ): number {
    if (!message) return thresholds.none.points;

    const length = message.trim().length;

    if (length > thresholds.detailed.min) {
      return thresholds.detailed.points;
    }
    if (length > thresholds.substantial.min) {
      return thresholds.substantial.points;
    }
    if (length > thresholds.minimal.min) {
      return thresholds.minimal.points;
    }

    return thresholds.none.points;
  }

  /**
   * Calculate points for page views
   *
   * @param pageViews - Number of pages visited
   * @param thresholds - Page views thresholds from config
   * @returns Page views points (5-30)
   */
  private calculatePageViewsPoints(
    pageViews: number,
    thresholds: ScoringConfig["page_views_thresholds"]
  ): number {
    if (pageViews > thresholds.very_engaged.min) {
      return thresholds.very_engaged.points;
    }
    if (pageViews > thresholds.interested.min) {
      return thresholds.interested.points;
    }
    if (pageViews > thresholds.curious.min) {
      return thresholds.curious.points;
    }
    return thresholds.normal.points;
  }

  /**
   * Calculate points for time on site
   *
   * @param timeOnSite - Time spent on site (seconds)
   * @param thresholds - Time on site thresholds from config
   * @returns Time on site points (5-20)
   */
  private calculateTimeOnSitePoints(
    timeOnSite: number,
    thresholds: ScoringConfig["time_on_site_thresholds"]
  ): number {
    if (timeOnSite > thresholds.deep_read.min) {
      return thresholds.deep_read.points;
    }
    if (timeOnSite > thresholds.moderate.min) {
      return thresholds.moderate.points;
    }
    if (timeOnSite > thresholds.brief.min) {
      return thresholds.brief.points;
    }
    return thresholds.quick.points;
  }
}
