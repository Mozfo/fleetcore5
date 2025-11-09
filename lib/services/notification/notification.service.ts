/**
 * NotificationService
 * Service for managing notifications with ZÉRO HARDCODING locale selection
 *
 * Pattern: Extends BaseService (FleetCore standard)
 * Domain: Cross-domain (DIR + ADM + CRM)
 */

import {
  PrismaClient,
  notification_channel,
  notification_status,
  adm_notification_logs,
} from "@prisma/client";
import { BaseService } from "@/lib/core/base.service";
import { EmailService } from "@/lib/services/email/email.service";
import { CountryLocaleRepository } from "@/lib/repositories/country-locale.repository";
import { NotificationTemplateRepository } from "@/lib/repositories/notification-template.repository";
import { NotificationLogRepository } from "@/lib/repositories/notification-log.repository";
import { NotFoundError, ValidationError } from "@/lib/core/errors";
import type { PaginatedResult, PaginationOptions } from "@/lib/core/types";
import { SYSTEM_USER_ID } from "@/lib/constants/system";
import type { AuditEntityType } from "@/lib/audit";

/**
 * Selected template result from selectTemplate()
 */
export interface SelectedTemplate {
  templateId: string;
  templateCode: string;
  channel: notification_channel;
  locale: string;
  subject: string;
  body: string;
  variables: Record<string, unknown> | null;
}

/**
 * Rendered template result from renderTemplate()
 */
export interface RenderedTemplate {
  subject: string;
  body: string;
}

/**
 * Notification send result
 */
export interface NotificationResult {
  success: boolean;
  messageId?: string;
  locale: string;
  error?: string;
}

/**
 * Parameters for selectTemplate() - 6-level cascade
 */
export interface SelectTemplateParams {
  templateCode: string;
  channel: notification_channel;
  userId?: string;
  tenantId?: string;
  leadId?: string;
  countryCode?: string;
  fallbackLocale: string;
}

/**
 * Parameters for sendEmail()
 */
export interface SendEmailParams {
  recipientEmail: string;
  recipientPhone?: string;
  templateCode: string;
  variables: Record<string, unknown>;
  userId?: string;
  tenantId?: string;
  leadId?: string;
  countryCode?: string;
  fallbackLocale?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
  };
}

/**
 * Parameters for getHistory()
 */
export interface GetHistoryParams extends PaginationOptions {
  tenantId?: string;
  recipientId?: string;
  recipientEmail?: string;
  status?: notification_status;
  templateCode?: string;
  channel?: notification_channel;
  startDate?: Date;
  endDate?: Date;
}

/**
 * NotificationService
 *
 * Manages notifications with ZÉRO HARDCODING locale selection:
 * - 6-level cascade algorithm for locale determination
 * - Template selection from dir_notification_templates
 * - JSONB translation extraction
 * - Variable replacement ({{variable_name}})
 * - Email sending via EmailService (reuses existing service from Step 0.3)
 * - Notification logging for analytics
 * - Resend webhook handling
 *
 * Key Features:
 * - ZERO HARDCODING: All locale mappings from database
 * - Cascade algorithm: user → tenant → country → fallback
 * - Multi-channel support: email, sms, slack, webhook, push
 * - Audit trail: All notifications logged
 *
 * @example
 * ```typescript
 * const service = new NotificationService();
 * const result = await service.sendEmail({
 *   recipientEmail: 'user@example.com',
 *   templateCode: 'lead_confirmation',
 *   variables: { user_name: 'John Doe', tenant_name: 'FleetCore' },
 *   tenantId: 'tenant-123',
 *   fallbackLocale: 'en'
 * });
 * // result.locale => 'fr' (determined by cascade)
 * // result.success => true
 * ```
 */
export class NotificationService extends BaseService {
  private countryRepo: CountryLocaleRepository;
  private templateRepo: NotificationTemplateRepository;
  private logRepo: NotificationLogRepository;
  private emailService: EmailService;

  /**
   * Constructor with optional Prisma Client injection
   * CORRECTION 1: Extends BaseService (FleetCore pattern)
   * CORRECTION 2: Reuses EmailService (no Resend duplication)
   *
   * @param prismaClient - Optional PrismaClient instance for dependency injection
   *                       (useful for testing with mock or SQLite clients)
   *                       Defaults to singleton instance if not provided
   *
   * @example
   * ```typescript
   * // Production: Use singleton (default)
   * const service = new NotificationService()
   * ```
   *
   * @example
   * ```typescript
   * // Testing: Inject test client
   * const testPrisma = new PrismaClient({ datasources: { db: { url: 'file:test.db' } } })
   * const service = new NotificationService(testPrisma)
   * ```
   */
  constructor(prismaClient?: PrismaClient) {
    super(prismaClient); // CORRECTION 1: extends BaseService

    // Initialize repositories with same Prisma instance
    this.countryRepo = new CountryLocaleRepository(this.prisma);
    this.templateRepo = new NotificationTemplateRepository(this.prisma);
    this.logRepo = new NotificationLogRepository(this.prisma);

    // CORRECTION 2: Reuse EmailService (no Resend duplication)
    this.emailService = new EmailService();
  }

  /**
   * Required by BaseService for audit logging
   * NotificationService doesn't create audit logs directly (logs to adm_notification_logs instead)
   */
  protected getEntityType(): AuditEntityType {
    return "notification" as AuditEntityType;
  }

  /**
   * Select template with ZÉRO HARDCODING locale cascade (6 levels)
   *
   * ALGORITHME CASCADE :
   * 1. adm_members.preferred_language (user preference)
   * 2. adm_tenant_settings.default_locale (future - tenant default)
   * 3. adm_tenants.country_code → dir_country_locales.primary_locale
   * 4. crm_leads.country_code → dir_country_locales.primary_locale
   * 5. Direct countryCode parameter → dir_country_locales.primary_locale
   * 6. fallbackLocale parameter
   *
   * @param params - Selection parameters
   * @returns Selected template with locale-specific content
   * @throws {NotFoundError} If template not found
   *
   * @example
   * ```typescript
   * const selected = await service.selectTemplate({
   *   templateCode: 'lead_confirmation',
   *   channel: 'email',
   *   tenantId: 'tenant-123', // Tenant in France
   *   fallbackLocale: 'en'
   * });
   * // selected.locale => 'fr' (from tenant country FR → primary_locale)
   * // selected.subject => "Merci pour votre intérêt" (from subject_translations['fr'])
   * ```
   */
  async selectTemplate(
    params: SelectTemplateParams
  ): Promise<SelectedTemplate> {
    let selectedLocale: string | null = null;

    // CASCADE 1 : adm_members.preferred_language
    if (params.userId) {
      const member = await this.prisma.adm_members.findUnique({
        where: { id: params.userId },
        select: { preferred_language: true },
      });

      if (member?.preferred_language) {
        selectedLocale = member.preferred_language;
      }
    }

    // CASCADE 2 : adm_tenant_settings.default_locale (future)
    // TODO: Phase 0.5 - Implement when tenant settings table created

    // CASCADE 3 : adm_tenants.country_code → dir_country_locales.primary_locale
    if (!selectedLocale && params.tenantId) {
      const tenant = await this.prisma.adm_tenants.findUnique({
        where: { id: params.tenantId },
        select: { country_code: true },
      });

      if (tenant?.country_code) {
        const country = await this.countryRepo.findByCountryCode(
          tenant.country_code
        );
        if (country?.primary_locale) {
          selectedLocale = country.primary_locale;
        }
      }
    }

    // CASCADE 4 : crm_leads.country_code → dir_country_locales.primary_locale
    if (!selectedLocale && params.leadId) {
      const lead = await this.prisma.crm_leads.findUnique({
        where: { id: params.leadId },
        select: { country_code: true },
      });

      if (lead?.country_code) {
        const country = await this.countryRepo.findByCountryCode(
          lead.country_code
        );
        if (country?.primary_locale) {
          selectedLocale = country.primary_locale;
        }
      }
    }

    // CASCADE 5 : Direct countryCode parameter
    if (!selectedLocale && params.countryCode) {
      const country = await this.countryRepo.findByCountryCode(
        params.countryCode
      );
      if (country?.primary_locale) {
        selectedLocale = country.primary_locale;
      }
    }

    // CASCADE 6 : Fallback locale
    if (!selectedLocale) {
      selectedLocale = params.fallbackLocale;
    }

    // Récupérer template
    const template = await this.templateRepo.findByTemplateCode(
      params.templateCode,
      params.channel
    );

    if (!template) {
      throw new NotFoundError(
        `Template "${params.templateCode}" for channel "${params.channel}"`
      );
    }

    // Extraire traductions JSONB
    const subjectTranslations = template.subject_translations as Record<
      string,
      string
    >;
    const bodyTranslations = template.body_translations as Record<
      string,
      string
    >;

    // Try selected locale, then fallback
    const subject =
      subjectTranslations[selectedLocale] ||
      subjectTranslations[params.fallbackLocale] ||
      "";
    const body =
      bodyTranslations[selectedLocale] ||
      bodyTranslations[params.fallbackLocale] ||
      "";

    if (!subject || !body) {
      throw new ValidationError(
        `Template "${params.templateCode}" missing translations for locale "${selectedLocale}" and fallback "${params.fallbackLocale}"`
      );
    }

    return {
      templateId: template.id,
      templateCode: template.template_code,
      channel: template.channel,
      locale: selectedLocale,
      subject,
      body,
      variables: template.variables as Record<string, unknown> | null,
    };
  }

  /**
   * Render template with variable replacement
   * Supports simple {{variable_name}} syntax
   *
   * @param template - Selected template from selectTemplate()
   * @param variables - Variable values to replace
   * @returns Rendered subject and body
   *
   * @example
   * ```typescript
   * const rendered = await service.renderTemplate(
   *   { subject: "Hello {{user_name}}", body: "Welcome to {{tenant_name}}", ... },
   *   { user_name: 'John', tenant_name: 'FleetCore' }
   * );
   * // rendered.subject => "Hello John"
   * // rendered.body => "Welcome to FleetCore"
   * ```
   */
  async renderTemplate(
    template: SelectedTemplate,
    variables: Record<string, unknown>
  ): Promise<RenderedTemplate> {
    // Simple variable replacement: {{variable_name}}
    let renderedSubject = template.subject;
    let renderedBody = template.body;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      const stringValue = String(value ?? "");

      renderedSubject = renderedSubject.replace(
        new RegExp(placeholder, "g"),
        stringValue
      );
      renderedBody = renderedBody.replace(
        new RegExp(placeholder, "g"),
        stringValue
      );
    }

    return {
      subject: renderedSubject,
      body: renderedBody,
    };
  }

  /**
   * Send email notification with full orchestration
   *
   * Flow:
   * 1. selectTemplate() - Cascade algorithm (ZÉRO HARDCODING)
   * 2. renderTemplate() - Variable replacement
   * 3. emailService.send() - Resend integration
   * 4. logRepo.create() - Audit trail
   *
   * @param params - Send parameters
   * @returns Notification result with locale used
   *
   * @example
   * ```typescript
   * const result = await service.sendEmail({
   *   recipientEmail: 'user@example.com',
   *   templateCode: 'lead_confirmation',
   *   variables: { user_name: 'John Doe', link_url: 'https://fleetcore.app/demo' },
   *   tenantId: 'tenant-123',
   *   fallbackLocale: 'en'
   * });
   * // result => { success: true, messageId: 're_abc123', locale: 'fr' }
   * ```
   */
  async sendEmail(params: SendEmailParams): Promise<NotificationResult> {
    try {
      // 1. Select template (cascade algorithm)
      const selected = await this.selectTemplate({
        templateCode: params.templateCode,
        channel: "email",
        userId: params.userId,
        tenantId: params.tenantId,
        leadId: params.leadId,
        countryCode: params.countryCode,
        fallbackLocale: params.fallbackLocale || "en",
      });

      // 2. Render template (variable replacement)
      const rendered = await this.renderTemplate(selected, params.variables);

      // 3. Send via EmailService (CORRECTION 2: reuses existing service)
      const emailResult = await this.emailService.send({
        to: params.recipientEmail,
        subject: rendered.subject,
        html: rendered.body,
        text: rendered.body.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      });

      // 4. Log notification
      await this.logRepo.create(
        {
          tenant_id: params.tenantId || null,
          recipient_id: params.userId || null,
          recipient_email: params.recipientEmail,
          recipient_phone: params.recipientPhone || null,
          template_code: params.templateCode,
          channel: "email",
          locale_used: selected.locale,
          subject: rendered.subject,
          body: rendered.body,
          variables_data: params.variables,
          status: emailResult.success ? "sent" : "failed",
          sent_at: emailResult.success ? new Date() : null,
          failed_at: emailResult.success ? null : new Date(),
          error_message: emailResult.error || null,
          external_id: emailResult.messageId || null,
          ip_address: params.metadata?.ipAddress || null,
          user_agent: params.metadata?.userAgent || null,
          session_id: params.metadata?.sessionId || null,
          request_id: params.metadata?.requestId || null,
        },
        SYSTEM_USER_ID // System user for automated notification audit trail
      );

      return {
        success: emailResult.success,
        messageId: emailResult.messageId,
        locale: selected.locale,
        error: emailResult.error,
      };
    } catch (error) {
      // Log failed notification
      await this.logRepo.create(
        {
          tenant_id: params.tenantId || null,
          recipient_id: params.userId || null,
          recipient_email: params.recipientEmail,
          recipient_phone: params.recipientPhone || null,
          template_code: params.templateCode,
          channel: "email",
          locale_used: params.fallbackLocale || "en",
          subject: null,
          body: null,
          variables_data: params.variables,
          status: "failed",
          sent_at: null,
          failed_at: new Date(),
          error_message: error instanceof Error ? error.message : String(error),
          external_id: null,
          ip_address: params.metadata?.ipAddress || null,
          user_agent: params.metadata?.userAgent || null,
          session_id: params.metadata?.sessionId || null,
          request_id: params.metadata?.requestId || null,
        },
        SYSTEM_USER_ID // System user for automated notification audit trail
      );

      return {
        success: false,
        locale: params.fallbackLocale || "en",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Get notification history with filters
   *
   * @param params - Query parameters
   * @returns Paginated notification logs
   *
   * @example
   * ```typescript
   * const history = await service.getHistory({
   *   tenantId: 'tenant-123',
   *   status: 'delivered',
   *   page: 1,
   *   limit: 20
   * });
   * // history.data => Array of notification logs
   * // history.total => Total count
   * ```
   */
  async getHistory(
    params: GetHistoryParams
  ): Promise<PaginatedResult<adm_notification_logs>> {
    const where: Record<string, unknown> = {};

    if (params.tenantId) where.tenant_id = params.tenantId;
    if (params.recipientId) where.recipient_id = params.recipientId;
    if (params.recipientEmail) where.recipient_email = params.recipientEmail;
    if (params.status) where.status = params.status;
    if (params.templateCode) where.template_code = params.templateCode;
    if (params.channel) where.channel = params.channel;

    if (params.startDate || params.endDate) {
      where.created_at = {};
      if (params.startDate)
        (where.created_at as Record<string, unknown>).gte = params.startDate;
      if (params.endDate)
        (where.created_at as Record<string, unknown>).lte = params.endDate;
    }

    return await this.logRepo.findMany(where, {
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    });
  }

  /**
   * Get notification statistics
   *
   * @param tenantId - Optional tenant ID
   * @param startDate - Optional start date
   * @param endDate - Optional end date
   * @returns Statistics object
   */
  async getStats(tenantId?: string, startDate?: Date, endDate?: Date) {
    return await this.logRepo.getStats(tenantId, startDate, endDate);
  }

  /**
   * Handle Resend webhook event
   * Updates notification log status from webhook
   *
   * @param webhookData - Resend webhook payload
   */
  async handleResendWebhook(webhookData: {
    type: string;
    data: {
      email_id: string;
      created_at: string;
    };
  }): Promise<void> {
    const log = await this.logRepo.findByExternalId(webhookData.data.email_id);

    if (!log) {
      // Webhook for unknown email (maybe from another service)
      return;
    }

    const timestamp = new Date(webhookData.data.created_at);

    switch (webhookData.type) {
      case "email.sent":
        await this.logRepo.updateStatus(log.id, "sent", {
          sent_at: timestamp,
        });
        break;

      case "email.delivered":
        await this.logRepo.updateStatus(log.id, "delivered", {
          delivered_at: timestamp,
        });
        break;

      case "email.bounced":
        await this.logRepo.updateStatus(log.id, "bounced", {
          failed_at: timestamp,
        });
        break;

      case "email.opened":
        await this.logRepo.updateStatus(log.id, "opened", {
          opened_at: timestamp,
        });
        break;

      case "email.clicked":
        await this.logRepo.updateStatus(log.id, "clicked", {
          clicked_at: timestamp,
        });
        break;
    }
  }
}
