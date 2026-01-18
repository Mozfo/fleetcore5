import { BaseRepository } from "@/lib/core/base.repository";
import { PrismaClient, crm_settings } from "@prisma/client";
import type { SortFieldWhitelist } from "@/lib/core/validation";

/**
 * Whitelist of fields allowed for sorting settings
 */
export const SETTINGS_SORT_FIELDS = [
  "id",
  "setting_key",
  "category",
  "data_type",
  "is_active",
  "is_system",
  "version",
  "display_order",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * CRM Setting record type
 */
export type CrmSetting = crm_settings;

/**
 * Typed setting value
 */
export type SettingValue<T = unknown> = T;

/**
 * Setting categories enum
 */
export const SettingCategory = {
  SCORING: "scoring",
  ASSIGNMENT: "assignment",
  QUALIFICATION: "qualification",
  STAGES: "stages",
  WORKFLOWS: "workflows",
  NOTIFICATIONS: "notifications",
  SLA: "sla",
  VALIDATION: "validation",
  INTEGRATIONS: "integrations",
  UI: "ui",
} as const;

/**
 * CRM Setting keys enum
 */
export const CrmSettingKey = {
  LEAD_SCORING_CONFIG: "lead_scoring_config",
  LEAD_ASSIGNMENT_RULES: "lead_assignment_rules",
  LEAD_PRIORITY_CONFIG: "lead_priority_config",
  LOCALE_TEMPLATE_MAPPING: "locale_template_mapping",
  // Phase 1.1: Pipeline & Loss Reasons settings
  LEAD_STAGES: "lead_stages",
  OPPORTUNITY_STAGES: "opportunity_stages",
  OPPORTUNITY_LOSS_REASONS: "opportunity_loss_reasons",
} as const;

/**
 * Repository for CRM settings
 *
 * NOTE: crm_settings is a GLOBAL table (no provider_id).
 * All settings are globally accessible. The is_system flag indicates
 * whether a setting is system-provided (true) or custom (false).
 *
 * @example
 * ```typescript
 * const repo = new CrmSettingsRepository(prisma);
 * const setting = await repo.getSetting('lead_scoring_config');
 * const value = await repo.getSettingValue<ScoringConfig>('lead_scoring_config');
 * ```
 */
export class CrmSettingsRepository extends BaseRepository<CrmSetting> {
  constructor(prisma: PrismaClient) {
    super(prisma.crm_settings, prisma);
  }

  /**
   * Get whitelist of fields allowed for sorting
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return SETTINGS_SORT_FIELDS;
  }

  /**
   * Get setting by key
   * Returns null if not found or inactive
   *
   * @param key - Setting key
   * @returns Setting record or null
   *
   * @example
   * ```typescript
   * const setting = await repo.getSetting('lead_scoring_config');
   * if (setting) {
   *   // Access setting.setting_value
   *   // Access setting.version for audit trail
   * }
   * ```
   */
  async getSetting(key: string): Promise<CrmSetting | null> {
    return await this.model.findFirst({
      where: {
        setting_key: key,
        is_active: true,
        deleted_at: null,
      },
    });
  }

  /**
   * Get setting value directly (typed)
   *
   * @param key - Setting key
   * @returns Typed value or null
   *
   * @example
   * ```typescript
   * interface ScoringConfig {
   *   fleet_size_points: Record<string, { vehicles: number; points: number }>;
   * }
   * const config = await repo.getSettingValue<ScoringConfig>('lead_scoring_config');
   * if (config) {
   *   // Access config.fleet_size_points['500+']
   * }
   * ```
   */
  async getSettingValue<T = unknown>(key: string): Promise<T | null> {
    const setting = await this.getSetting(key);
    return setting ? (setting.setting_value as T) : null;
  }

  /**
   * Get settings by category
   *
   * @param category - Category name
   * @returns Array of settings in the category
   *
   * @example
   * ```typescript
   * const scoringSettings = await repo.getSettingsByCategory('scoring');
   * for (const setting of scoringSettings) {
   *   // Access setting.setting_key and setting.setting_value
   * }
   * ```
   */
  async getSettingsByCategory(category: string): Promise<CrmSetting[]> {
    return await this.model.findMany({
      where: {
        category,
        is_active: true,
        deleted_at: null,
      },
      orderBy: {
        setting_key: "asc",
      },
    });
  }

  /**
   * Get all active settings
   *
   * @returns Array of all active settings
   *
   * @example
   * ```typescript
   * const allSettings = await repo.getAllSettings();
   * // Returns all active settings sorted by category and key
   * ```
   */
  async getAllSettings(): Promise<CrmSetting[]> {
    return await this.model.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      orderBy: [{ category: "asc" }, { setting_key: "asc" }],
    });
  }

  /**
   * Check if setting exists
   *
   * @param key - Setting key
   * @returns Boolean
   *
   * @example
   * ```typescript
   * const exists = await repo.exists('lead_scoring_config');
   * if (!exists) {
   *   // Create default setting
   * }
   * ```
   */
  async exists(key: string): Promise<boolean> {
    const count = await this.model.count({
      where: {
        setting_key: key,
        deleted_at: null,
      },
    });
    return count > 0;
  }

  /**
   * Get setting with UX metadata only (for admin UI)
   * Returns display_label, help_text, etc. without full setting_value
   *
   * @param key - Setting key
   * @returns Setting metadata or null
   *
   * @example
   * ```typescript
   * const metadata = await repo.getSettingMetadata('lead_scoring_config');
   * if (metadata) {
   *   // metadata.display_label: "Lead Scoring Algorithm"
   *   // metadata.help_text: "Configure how leads..."
   *   // metadata.ui_component: "nested_form"
   * }
   * ```
   */
  async getSettingMetadata(key: string): Promise<{
    setting_key: string;
    display_label: string | null;
    display_order: number | null;
    ui_component: string | null;
    help_text: string | null;
    documentation_url: string | null;
    category: string;
    data_type: string;
    is_system: boolean;
  } | null> {
    return await this.model.findFirst({
      where: {
        setting_key: key,
        is_active: true,
        deleted_at: null,
      },
      select: {
        setting_key: true,
        display_label: true,
        display_order: true,
        ui_component: true,
        help_text: true,
        documentation_url: true,
        category: true,
        data_type: true,
        is_system: true,
      },
    });
  }

  /**
   * Get all settings metadata grouped by category
   * Useful for building admin UI navigation
   *
   * @returns Map of category to settings metadata
   *
   * @example
   * ```typescript
   * const grouped = await repo.getAllSettingsMetadata();
   * for (const [category, settings] of grouped) {
   *   // category: 'scoring'
   *   // settings: [{ setting_key: 'lead_scoring_config', display_label: '...', ... }]
   * }
   * ```
   */
  async getAllSettingsMetadata(): Promise<
    Map<
      string,
      Array<{
        setting_key: string;
        display_label: string | null;
        display_order: number | null;
        ui_component: string | null;
        help_text: string | null;
        documentation_url: string | null;
        is_system: boolean;
      }>
    >
  > {
    const settings = await this.model.findMany({
      where: {
        is_active: true,
        deleted_at: null,
      },
      select: {
        setting_key: true,
        display_label: true,
        display_order: true,
        ui_component: true,
        help_text: true,
        documentation_url: true,
        category: true,
        is_system: true,
      },
      orderBy: [{ category: "asc" }, { display_order: "asc" }],
    });

    // Group by category
    const grouped = new Map<string, typeof settings>();

    for (const setting of settings) {
      const category = setting.category;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      const { category: _, ...settingWithoutCategory } = setting;
      const categoryGroup = grouped.get(category);
      if (categoryGroup) {
        categoryGroup.push(settingWithoutCategory);
      }
    }

    return grouped;
  }

  // ==========================================================================
  // WRITE OPERATIONS (Phase 1.1)
  // ==========================================================================

  /**
   * Upsert a setting by key
   * Creates new setting or updates existing one, incrementing version
   *
   * @param key - Setting key
   * @param data - Setting data to upsert
   * @param userId - ID of user making the change (for audit)
   * @returns Created or updated setting
   *
   * @example
   * ```typescript
   * const setting = await repo.upsertByKey(
   *   'opportunity_stages',
   *   { setting_value: newStagesConfig, category: 'pipeline' },
   *   userId
   * );
   * ```
   */
  async upsertByKey(
    key: string,
    data: {
      setting_value: unknown;
      category?: string;
      data_type?: string;
      description?: string;
      display_label?: string;
      help_text?: string;
      ui_component?: string;
      display_order?: number;
      is_system?: boolean;
    },
    userId: string | null
  ): Promise<CrmSetting> {
    const existing = await this.model.findFirst({
      where: { setting_key: key, deleted_at: null },
    });

    if (existing) {
      // Update existing - increment version
      return await this.model.update({
        where: { id: existing.id },
        data: {
          setting_value: data.setting_value as object,
          description: data.description ?? existing.description,
          display_label: data.display_label ?? existing.display_label,
          help_text: data.help_text ?? existing.help_text,
          ui_component: data.ui_component ?? existing.ui_component,
          display_order: data.display_order ?? existing.display_order,
          version: existing.version + 1,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    }

    // Create new setting
    return await this.model.create({
      data: {
        setting_key: key,
        setting_value: data.setting_value as object,
        category: data.category ?? "pipeline",
        data_type: data.data_type ?? "object",
        description: data.description ?? null,
        display_label: data.display_label ?? null,
        help_text: data.help_text ?? null,
        ui_component: data.ui_component ?? null,
        display_order: data.display_order ?? 0,
        is_system: data.is_system ?? false,
        is_active: true,
        version: 1,
        created_by: userId,
      },
    });
  }

  /**
   * Bulk update multiple settings in a transaction
   * Validates all updates before applying
   *
   * @param updates - Array of { key, value } pairs
   * @param userId - ID of user making the changes
   * @returns Number of settings updated
   *
   * @example
   * ```typescript
   * const count = await repo.bulkUpdate([
   *   { key: 'lead_stages', value: leadStagesConfig },
   *   { key: 'opportunity_stages', value: oppStagesConfig },
   * ], userId);
   * ```
   */
  async bulkUpdate(
    updates: Array<{ key: string; value: unknown }>,
    userId: string | null
  ): Promise<number> {
    let updatedCount = 0;

    // Use transaction to ensure atomicity
    await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        const existing = await tx.crm_settings.findFirst({
          where: { setting_key: update.key, deleted_at: null },
        });

        if (existing) {
          await tx.crm_settings.update({
            where: { id: existing.id },
            data: {
              setting_value: update.value as object,
              version: existing.version + 1,
              updated_by: userId,
              updated_at: new Date(),
            },
          });
          updatedCount++;
        }
      }
    });

    return updatedCount;
  }

  /**
   * Toggle active status of a setting
   *
   * @param key - Setting key
   * @param userId - ID of user making the change
   * @returns Updated setting
   *
   * @example
   * ```typescript
   * const setting = await repo.toggleActive('lead_stages', userId);
   * // setting.is_active is now toggled
   * ```
   */
  async toggleActive(
    key: string,
    userId: string | null
  ): Promise<CrmSetting | null> {
    const existing = await this.model.findFirst({
      where: { setting_key: key, deleted_at: null },
    });

    if (!existing) {
      return null;
    }

    return await this.model.update({
      where: { id: existing.id },
      data: {
        is_active: !existing.is_active,
        version: existing.version + 1,
        updated_by: userId,
        updated_at: new Date(),
      },
    });
  }

  /**
   * Soft delete a setting by key (sets deleted_at)
   * System settings cannot be deleted
   *
   * @param key - Setting key
   * @param userId - ID of user making the change
   * @returns Deleted setting or null if not found/system setting
   */
  async softDeleteByKey(
    key: string,
    userId: string | null
  ): Promise<CrmSetting | null> {
    const existing = await this.model.findFirst({
      where: { setting_key: key, deleted_at: null },
    });

    if (!existing || existing.is_system) {
      return null;
    }

    return await this.model.update({
      where: { id: existing.id },
      data: {
        deleted_at: new Date(),
        deleted_by: userId,
        is_active: false,
      },
    });
  }
}

/**
 * Seed initial CRM settings
 * Creates lead_scoring_config and lead_assignment_rules
 *
 * @param prisma - Prisma client instance
 * @returns Number of settings seeded
 *
 * @example
 * ```typescript
 * import { seedCrmSettings } from '@/lib/repositories/crm/settings.repository';
 * const count = await seedCrmSettings(prisma);
 * ```
 */
export async function seedCrmSettings(prisma: PrismaClient): Promise<number> {
  const settings = [
    {
      setting_key: "lead_scoring_config",
      category: "scoring",
      data_type: "object",
      is_system: true,
      description:
        "Lead scoring algorithm configuration (fit score, engagement score, qualification thresholds)",
      setting_value: {
        fleet_size_points: {
          "500+": { vehicles: 600, points: 40 },
          "101-500": { vehicles: 250, points: 35 },
          "51-100": { vehicles: 75, points: 30 },
          "11-50": { vehicles: 30, points: 20 },
          "1-10": { vehicles: 5, points: 5 },
          unknown: { vehicles: 30, points: 10 },
        },
        country_tier_points: {
          tier1: { countries: ["AE", "SA", "QA"], points: 20 },
          tier2: { countries: ["FR"], points: 18 },
          tier3: { countries: ["KW", "BH", "OM"], points: 15 },
          tier4: {
            countries: [
              "DE",
              "IT",
              "ES",
              "BE",
              "NL",
              "PT",
              "AT",
              "IE",
              "DK",
              "SE",
              "FI",
              "GR",
              "PL",
              "CZ",
              "HU",
              "RO",
              "BG",
              "HR",
              "SI",
              "SK",
              "LT",
              "LV",
              "EE",
              "CY",
              "LU",
              "MT",
            ],
            points: 12,
          },
          tier5: { points: 5 },
        },
        message_length_thresholds: {
          detailed: { min: 200, points: 30 },
          substantial: { min: 100, points: 20 },
          minimal: { min: 20, points: 10 },
          none: { points: 0 },
        },
        phone_points: { provided: 20, missing: 0 },
        page_views_thresholds: {
          very_engaged: { min: 10, points: 30 },
          interested: { min: 5, points: 20 },
          curious: { min: 2, points: 10 },
          normal: { points: 5 },
        },
        time_on_site_thresholds: {
          deep_read: { min: 600, points: 20 },
          moderate: { min: 300, points: 15 },
          brief: { min: 120, points: 10 },
          quick: { points: 5 },
        },
        qualification_stage_thresholds: {
          sales_qualified: 70,
          marketing_qualified: 40,
          top_of_funnel: 0,
        },
        qualification_weights: {
          fit: 0.6,
          engagement: 0.4,
        },
      },
    },
    {
      setting_key: "lead_assignment_rules",
      category: "assignment",
      data_type: "object",
      is_system: true,
      description:
        "Lead assignment rules (fleet priority, geographic zones, round-robin, fallback)",
      setting_value: {
        fleet_size_priority: {
          "500+": {
            title_patterns: ["%Senior%Account%Manager%"],
            priority: 1,
          },
          "101-500": {
            title_patterns: ["%Account%Manager%"],
            exclude_patterns: ["%Senior%"],
            priority: 2,
          },
        },
        geographic_zones: {
          UAE: {
            countries: ["AE"],
            title_patterns: ["%UAE%", "%Emirates%"],
            priority: 10,
          },
          KSA: {
            countries: ["SA"],
            title_patterns: ["%KSA%", "%Saudi%"],
            priority: 11,
          },
          FRANCE: {
            countries: ["FR"],
            title_patterns: ["%France%"],
            priority: 12,
          },
          MENA: {
            countries: [
              "KW",
              "BH",
              "OM",
              "QA",
              "JO",
              "LB",
              "EG",
              "MA",
              "TN",
              "DZ",
            ],
            title_patterns: ["%MENA%", "%Middle East%"],
            priority: 13,
          },
          EU: {
            countries: [
              "DE",
              "IT",
              "ES",
              "BE",
              "NL",
              "PT",
              "AT",
              "IE",
              "DK",
              "SE",
              "FI",
              "GR",
              "PL",
              "CZ",
              "HU",
              "RO",
              "BG",
              "HR",
              "SI",
              "SK",
              "LT",
              "LV",
              "EE",
              "CY",
              "LU",
              "MT",
            ],
            title_patterns: ["%EU%", "%Europe%"],
            priority: 14,
          },
          INTERNATIONAL: {
            countries: [],
            title_patterns: ["%International%"],
            priority: 15,
          },
        },
        fallback: {
          employee_id: null,
          title_pattern: "%Sales%Manager%",
        },
      },
    },
    // ========================================================================
    // Pipeline Settings (Phase 1.6)
    // ========================================================================
    // V6.3: 8 statuts (lead_status_workflow)
    {
      setting_key: "lead_stages",
      category: "stages",
      data_type: "object",
      is_system: true,
      description: "Lead pipeline stages configuration (V6.3: 8 statuts)",
      setting_value: {
        stages: [
          {
            value: "new",
            label_en: "New",
            label_fr: "Nouveau",
            color: "gray",
            order: 1,
            is_active: true,
            is_initial: true,
            auto_actions: ["assign_to_queue"],
          },
          {
            value: "demo",
            label_en: "Demo",
            label_fr: "Démo",
            color: "blue",
            order: 2,
            is_active: true,
            auto_actions: [],
          },
          {
            value: "proposal_sent",
            label_en: "Proposal Sent",
            label_fr: "Proposition envoyée",
            color: "orange",
            order: 3,
            is_active: true,
            auto_actions: ["calculate_score"],
          },
          {
            value: "payment_pending",
            label_en: "Payment Pending",
            label_fr: "Paiement en attente",
            color: "amber",
            order: 4,
            is_active: true,
            auto_actions: [],
          },
          {
            value: "converted",
            label_en: "Converted",
            label_fr: "Converti",
            color: "green",
            order: 5,
            is_active: true,
            is_terminal: true,
            is_success: true,
            auto_actions: ["create_tenant"],
          },
          {
            value: "lost",
            label_en: "Lost",
            label_fr: "Perdu",
            color: "red",
            order: 6,
            is_active: true,
            auto_actions: [],
          },
          {
            value: "nurturing",
            label_en: "Nurturing",
            label_fr: "En nurturing",
            color: "purple",
            order: 7,
            is_active: true,
            auto_actions: ["add_to_sequence"],
          },
          {
            value: "disqualified",
            label_en: "Disqualified",
            label_fr: "Disqualifié",
            color: "gray",
            order: 8,
            is_active: true,
            is_terminal: true,
            auto_actions: ["archive"],
          },
        ],
        transitions: {
          new: ["demo", "nurturing", "disqualified"],
          demo: ["proposal_sent", "nurturing", "lost", "disqualified"],
          proposal_sent: ["payment_pending", "lost", "nurturing"],
          payment_pending: ["converted", "lost"],
          converted: [],
          lost: ["nurturing"],
          nurturing: ["demo", "proposal_sent", "lost"],
          disqualified: [],
        },
        default_stage: "new",
      },
    },
    {
      setting_key: "opportunity_stages",
      category: "stages",
      data_type: "object",
      is_system: true,
      description:
        "Opportunity pipeline stages with deal rotting configuration",
      setting_value: {
        stages: [
          {
            value: "qualification",
            label_en: "Qualification",
            label_fr: "Qualification",
            probability: 20,
            max_days: 14,
            color: "blue",
            order: 1,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "demo",
            label_en: "Demo",
            label_fr: "Démonstration",
            probability: 40,
            max_days: 10,
            color: "purple",
            order: 2,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "proposal",
            label_en: "Proposal",
            label_fr: "Proposition",
            probability: 60,
            max_days: 14,
            color: "yellow",
            order: 3,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "negotiation",
            label_en: "Negotiation",
            label_fr: "Négociation",
            probability: 80,
            max_days: 10,
            color: "orange",
            order: 4,
            deal_rotting: true,
            is_active: true,
          },
          {
            value: "contract_sent",
            label_en: "Contract Sent",
            label_fr: "Contrat envoyé",
            probability: 90,
            max_days: 7,
            color: "green",
            order: 5,
            deal_rotting: true,
            is_active: true,
          },
        ],
        final_stages: {
          won: { label_en: "Won", label_fr: "Gagné", probability: 100 },
          lost: { label_en: "Lost", label_fr: "Perdu", probability: 0 },
        },
        rotting: {
          enabled: true,
          use_stage_max_days: true,
          global_threshold_days: null,
          alert_owner: true,
          alert_manager: true,
          cron_time: "08:00",
        },
      },
    },
    {
      setting_key: "opportunity_loss_reasons",
      category: "workflows",
      data_type: "object",
      is_system: true,
      description: "Loss reasons for opportunities with recovery workflow",
      setting_value: {
        default: null,
        reasons: [
          // Price category
          {
            value: "price_too_high",
            label_en: "Price too high",
            label_fr: "Prix trop élevé",
            category: "price",
            order: 1,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "no_budget",
            label_en: "No budget",
            label_fr: "Pas de budget",
            category: "price",
            order: 2,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: false,
          },
          {
            value: "roi_not_demonstrated",
            label_en: "ROI not demonstrated",
            label_fr: "ROI non démontré",
            category: "price",
            order: 3,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          // Product category
          {
            value: "feature_missing",
            label_en: "Feature missing",
            label_fr: "Fonctionnalité manquante",
            category: "product",
            order: 4,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 120,
            require_competitor_name: false,
          },
          {
            value: "integration_missing",
            label_en: "Integration not available",
            label_fr: "Intégration non disponible",
            category: "product",
            order: 5,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "ui_too_complex",
            label_en: "UI too complex",
            label_fr: "Interface trop complexe",
            category: "product",
            order: 6,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
          // Competition category
          {
            value: "competitor_won_price",
            label_en: "Competitor won (price)",
            label_fr: "Concurrent gagné (prix)",
            category: "competition",
            order: 7,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: true,
          },
          {
            value: "competitor_won_features",
            label_en: "Competitor won (features)",
            label_fr: "Concurrent gagné (fonctionnalités)",
            category: "competition",
            order: 8,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: true,
          },
          // Timing category
          {
            value: "project_cancelled",
            label_en: "Project cancelled",
            label_fr: "Projet annulé",
            category: "timing",
            order: 9,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 90,
            require_competitor_name: false,
          },
          {
            value: "not_ready_now",
            label_en: "Not ready now",
            label_fr: "Pas prêt maintenant",
            category: "timing",
            order: 10,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          {
            value: "bad_timing",
            label_en: "Bad timing",
            label_fr: "Mauvais timing",
            category: "timing",
            order: 11,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 180,
            require_competitor_name: false,
          },
          // Other category
          {
            value: "no_response",
            label_en: "No response",
            label_fr: "Pas de réponse",
            category: "other",
            order: 12,
            is_active: true,
            is_recoverable: true,
            recovery_delay_days: 60,
            require_competitor_name: false,
          },
          {
            value: "bad_fit",
            label_en: "Bad product fit",
            label_fr: "Mauvais fit produit",
            category: "other",
            order: 13,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
          {
            value: "other",
            label_en: "Other",
            label_fr: "Autre",
            category: "other",
            order: 99,
            is_active: true,
            is_recoverable: false,
            recovery_delay_days: null,
            require_competitor_name: false,
          },
        ],
        recovery_workflow: {
          auto_create_followup: true,
          send_reminder_email: true,
          reminder_days_before: 7,
          auto_reopen: false,
        },
      },
    },
  ];

  for (const setting of settings) {
    await prisma.crm_settings.upsert({
      where: { setting_key: setting.setting_key },
      create: setting,
      update: {
        setting_value: setting.setting_value,
        description: setting.description,
      },
    });
  }

  return settings.length;
}
