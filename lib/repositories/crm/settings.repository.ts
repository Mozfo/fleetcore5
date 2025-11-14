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
} as const;

/**
 * Repository for CRM settings
 * Manages global CRM configuration as key-value pairs
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
   * @returns Array of settings
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
   * @returns Array of all settings
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
    display_order: number;
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
        display_order: number;
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
