/**
 * NotificationTemplateRepository
 * Repository for managing notification templates (dir_notification_templates)
 *
 * Pattern: Extends BaseRepository (has deleted_at for soft-delete)
 * Domain: DIR (Global reference data, no tenant_id)
 */

import {
  PrismaClient,
  dir_notification_templates,
  notification_channel,
  lifecycle_status,
} from "@prisma/client";
import { BaseRepository } from "@/lib/core/base.repository";
import type { SortFieldWhitelist } from "@/lib/core/validation";
import type { PaginatedResult, PaginationOptions } from "@/lib/core/types";
import { prisma as singletonPrisma } from "@/lib/prisma";

/**
 * Whitelist of sortable fields for dir_notification_templates table
 *
 * ✅ All columns safe (reference table, no PII)
 * - Primary key: id
 * - Business data: template_code, template_name, channel
 * - Timestamps: created_at, updated_at
 * - Soft-delete: deleted_at (filtered automatically by BaseRepository)
 *
 * ❌ Excluded columns:
 * - JSONB fields: subject_translations, body_translations, variables (not sortable)
 * - Array fields: supported_countries, supported_locales (use GIN indexes instead)
 */
export const NOTIFICATION_TEMPLATE_SORT_FIELDS = [
  "id",
  "template_code",
  "template_name",
  "channel",
  "status",
  "created_at",
  "updated_at",
] as const satisfies SortFieldWhitelist;

/**
 * Type alias from Prisma
 */
export type NotificationTemplate = dir_notification_templates;

/**
 * NotificationTemplateRepository
 *
 * Manages notification templates with multi-language support:
 * - Template code (unique per channel): lead_confirmation, member_welcome, etc.
 * - Channel-specific templates: email, sms, slack, webhook, push
 * - JSONB translations: subject_translations, body_translations
 * - PostgreSQL array filters: supported_countries, supported_locales
 * - Handlebars variables: {{user_name}}, {{tenant_name}}, etc.
 *
 * Key Features:
 * - Soft-delete support (BaseRepository)
 * - UNIQUE constraint (template_code, channel)
 * - PostgreSQL array queries with GIN indexes
 * - JSONB extraction for locale-specific content
 *
 * @example
 * ```typescript
 * const repo = new NotificationTemplateRepository();
 * const template = await repo.findByTemplateCode('lead_confirmation', 'email');
 * // template.subject_translations => {"en": "...", "fr": "...", "ar": "..."}
 * ```
 */
export class NotificationTemplateRepository extends BaseRepository<dir_notification_templates> {
  /**
   * Constructor with optional Prisma Client injection
   *
   * @param prismaClient - Optional PrismaClient instance for dependency injection
   *                       (useful for testing with mock or SQLite clients)
   *                       Defaults to singleton instance if not provided
   *
   * @example
   * ```typescript
   * // Production: Use singleton (default)
   * const repo = new NotificationTemplateRepository()
   * ```
   *
   * @example
   * ```typescript
   * // Testing: Inject test client
   * const testPrisma = new PrismaClient({ datasources: { db: { url: 'file:test.db' } } })
   * const repo = new NotificationTemplateRepository(testPrisma)
   * ```
   */
  constructor(prismaClient?: PrismaClient) {
    const prisma = prismaClient || singletonPrisma;
    super(prisma.dir_notification_templates, prisma);
  }

  /**
   * Get whitelist of sortable fields
   * Required by BaseRepository abstract method
   */
  protected getSortWhitelist(): SortFieldWhitelist {
    return NOTIFICATION_TEMPLATE_SORT_FIELDS;
  }

  /**
   * Enable soft-delete filtering
   * dir_notification_templates has deleted_at column
   */
  protected shouldFilterDeleted(): boolean {
    return true;
  }

  /**
   * Find template by template_code and channel
   * Respects UNIQUE constraint (template_code, channel)
   *
   * @param code - Template code (e.g., 'lead_confirmation', 'member_welcome')
   * @param channel - Notification channel ('email', 'sms', 'slack', 'webhook', 'push')
   * @returns Template or null if not found
   *
   * @example
   * ```typescript
   * const template = await repo.findByTemplateCode('lead_confirmation', 'email');
   * if (template) {
   *   const translations = template.subject_translations as Record<string, string>;
   *   const subject = translations['fr'] || translations['en'];
   * }
   * ```
   */
  async findByTemplateCode(
    code: string,
    channel: notification_channel
  ): Promise<dir_notification_templates | null> {
    return await this.model.findFirst({
      where: {
        template_code: code,
        channel,
        deleted_at: null,
      },
    });
  }

  /**
   * Find all templates for a specific channel
   *
   * @param channel - Notification channel
   * @param options - Pagination options
   * @returns Paginated list of templates
   *
   * @example
   * ```typescript
   * const emailTemplates = await repo.findByChannel('email', { page: 1, limit: 20 });
   * // Returns all email templates sorted by template_code
   * ```
   */
  async findByChannel(
    channel: notification_channel,
    options: PaginationOptions = {}
  ): Promise<PaginatedResult<dir_notification_templates>> {
    return await this.findMany(
      {
        channel,
      },
      {
        ...options,
        sortBy: options.sortBy || "template_code",
        sortOrder: options.sortOrder || "asc",
      }
    );
  }

  /**
   * Find templates supporting a specific country and locale
   * Uses PostgreSQL array operators with GIN indexes for performance
   *
   * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., 'FR', 'AE')
   * @param locale - ISO 639-1 locale code (e.g., 'fr', 'ar')
   * @param channel - Optional channel filter
   * @returns List of matching templates
   *
   * @example
   * ```typescript
   * // Find all templates for French users in France
   * const templates = await repo.findByCountryAndLocale('FR', 'fr');
   * // Uses: WHERE 'FR' = ANY(supported_countries) AND 'fr' = ANY(supported_locales)
   * // GIN indexes: idx_dir_notification_templates_countries_gin, idx_dir_notification_templates_locales_gin
   * ```
   *
   * @example
   * ```typescript
   * // Find email templates for Arabic users in UAE
   * const templates = await repo.findByCountryAndLocale('AE', 'ar', 'email');
   * ```
   */
  async findByCountryAndLocale(
    countryCode: string,
    locale: string,
    channel?: notification_channel
  ): Promise<dir_notification_templates[]> {
    const where: Record<string, unknown> = {
      supported_countries: {
        has: countryCode.toUpperCase(),
      },
      supported_locales: {
        has: locale.toLowerCase(),
      },
      deleted_at: null,
    };

    if (channel) {
      where.channel = channel;
    }

    return await this.model.findMany({
      where,
      orderBy: {
        template_code: "asc",
      },
    });
  }

  /**
   * Find templates supporting a specific locale
   * Useful for NotificationService.selectTemplate() locale cascade
   *
   * @param locale - ISO 639-1 locale code (e.g., 'en', 'fr', 'ar')
   * @param channel - Optional channel filter
   * @returns List of templates supporting this locale
   *
   * @example
   * ```typescript
   * const frenchTemplates = await repo.findByLocale('fr', 'email');
   * // Returns all email templates with 'fr' in supported_locales
   * ```
   */
  async findByLocale(
    locale: string,
    channel?: notification_channel
  ): Promise<dir_notification_templates[]> {
    const where: Record<string, unknown> = {
      supported_locales: {
        has: locale.toLowerCase(),
      },
      deleted_at: null,
    };

    if (channel) {
      where.channel = channel;
    }

    return await this.model.findMany({
      where,
      orderBy: {
        template_code: "asc",
      },
    });
  }

  /**
   * Find templates supporting a specific country
   *
   * @param countryCode - ISO 3166-1 alpha-2 country code
   * @param channel - Optional channel filter
   * @returns List of templates supporting this country
   *
   * @example
   * ```typescript
   * const uaeTemplates = await repo.findByCountry('AE');
   * // Returns all templates with 'AE' in supported_countries
   * ```
   */
  async findByCountry(
    countryCode: string,
    channel?: notification_channel
  ): Promise<dir_notification_templates[]> {
    const where: Record<string, unknown> = {
      supported_countries: {
        has: countryCode.toUpperCase(),
      },
      deleted_at: null,
    };

    if (channel) {
      where.channel = channel;
    }

    return await this.model.findMany({
      where,
      orderBy: {
        template_code: "asc",
      },
    });
  }

  /**
   * Find all active templates
   * Filters by lifecycle_status = 'active'
   *
   * @param channel - Optional channel filter
   * @returns List of active templates
   *
   * @example
   * ```typescript
   * const activeTemplates = await repo.findActive('email');
   * // Returns all active email templates
   * ```
   */
  async findActive(
    channel?: notification_channel
  ): Promise<dir_notification_templates[]> {
    const where: Record<string, unknown> = {
      status: "active" as lifecycle_status,
      deleted_at: null,
    };

    if (channel) {
      where.channel = channel;
    }

    return await this.model.findMany({
      where,
      orderBy: {
        template_code: "asc",
      },
    });
  }

  /**
   * Check if a template exists (template_code + channel combination)
   * Useful for validation before creating duplicates
   *
   * @param code - Template code
   * @param channel - Notification channel
   * @returns True if template exists (respects UNIQUE constraint)
   *
   * @example
   * ```typescript
   * const exists = await repo.templateExists('lead_confirmation', 'email');
   * if (exists) {
   *   throw new Error('Template already exists');
   * }
   * ```
   */
  async templateExists(
    code: string,
    channel: notification_channel
  ): Promise<boolean> {
    const count = await this.model.count({
      where: {
        template_code: code,
        channel,
        deleted_at: null,
      },
    });
    return count > 0;
  }

  /**
   * Get all unique template codes across all channels
   * Useful for UI template selector
   *
   * @returns List of unique template codes sorted alphabetically
   *
   * @example
   * ```typescript
   * const codes = await repo.getAllTemplateCodes();
   * // Returns: ['driver_onboarding', 'insurance_expiry', 'lead_confirmation', ...]
   * ```
   */
  async getAllTemplateCodes(): Promise<string[]> {
    const templates = await this.model.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        template_code: true,
      },
      distinct: ["template_code"],
      orderBy: {
        template_code: "asc",
      },
    });

    return templates.map((t: { template_code: string }) => t.template_code);
  }

  /**
   * Get all available channels
   *
   * @returns List of channels with at least one template
   *
   * @example
   * ```typescript
   * const channels = await repo.getAvailableChannels();
   * // Returns: ['email', 'sms', 'slack']
   * ```
   */
  async getAvailableChannels(): Promise<notification_channel[]> {
    const templates = await this.model.findMany({
      where: {
        deleted_at: null,
      },
      select: {
        channel: true,
      },
      distinct: ["channel"],
      orderBy: {
        channel: "asc",
      },
    });

    return templates.map((t: { channel: notification_channel }) => t.channel);
  }

  /**
   * Get template with locale-specific subject and body
   * Extracts from JSONB fields for a specific locale
   *
   * @param code - Template code
   * @param channel - Notification channel
   * @param locale - ISO 639-1 locale code
   * @param fallbackLocale - Fallback locale if requested locale not found (default: 'en')
   * @returns Template with extracted translations or null
   *
   * @example
   * ```typescript
   * const result = await repo.getTemplateForLocale('lead_confirmation', 'email', 'fr');
   * if (result) {
   *   // result.subject => French subject from subject_translations['fr']
   *   // result.body => French body from body_translations['fr']
   * }
   * ```
   */
  async getTemplateForLocale(
    code: string,
    channel: notification_channel,
    locale: string,
    fallbackLocale: string = "en"
  ): Promise<{
    template: dir_notification_templates;
    subject: string;
    body: string;
  } | null> {
    const template = await this.findByTemplateCode(code, channel);

    if (!template) {
      return null;
    }

    // Extract JSONB translations
    const subjectTranslations = template.subject_translations as Record<
      string,
      string
    >;
    const bodyTranslations = template.body_translations as Record<
      string,
      string
    >;

    // Try requested locale, then fallback
    const subject =
      subjectTranslations[locale] || subjectTranslations[fallbackLocale] || "";
    const body =
      bodyTranslations[locale] || bodyTranslations[fallbackLocale] || "";

    return {
      template,
      subject,
      body,
    };
  }
}
