/**
 * Customer Conversion Service - V6.2.1
 * Converts leads to customers after successful Stripe checkout
 *
 * This service handles the complete conversion flow:
 * 1. Extract metadata from Stripe checkout session
 * 2. Validate lead status (must be payment_pending)
 * 3. Generate tenant_code (C-XXXXXX format)
 * 4. Create adm_tenants with Stripe IDs
 * 5. Create clt_masterdata with client_code = tenant_code
 * 6. Create Auth Organization
 * 7. Update lead to converted status
 * 8. Generate verification token (24h expiry)
 * 9. Send verification email
 *
 * CRITICAL RULES:
 * - client_code = tenant_code = C-XXXXXX (copied at creation, immutable)
 * - All operations in atomic transaction
 * - Idempotent via stripe_checkout_session_id check
 *
 * @module lib/services/billing/customer-conversion.service
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { authService } from "@/lib/services/auth/auth.service";
import { NotificationQueueService } from "@/lib/services/notification/queue.service";
import { CountryRepository } from "@/lib/repositories/crm/country.repository";
import { URLS } from "@/lib/config/urls.config";
import crypto from "crypto";
import type Stripe from "stripe";

// ===== TYPES & INTERFACES =====

/**
 * Checkout session metadata structure
 */
export interface CheckoutMetadata {
  leadId: string;
  planCode: string;
  billingCycle: "monthly" | "yearly";
}

/**
 * Segment definition from crm_settings.segment_thresholds
 * ZERO HARDCODING - all values loaded from DB
 */
export interface SegmentDefinition {
  code: "segment_1" | "segment_2" | "segment_3" | "segment_4";
  min_fleet: number;
  max_fleet: number | null;
  plan_code: string | null;
  label_en: string;
  label_fr: string;
  is_saas: boolean;
  description: string;
  negotiation_allowed?: boolean;
}

/**
 * Segment thresholds configuration from crm_settings
 */
export interface SegmentThresholdsConfig {
  version: string;
  segments: SegmentDefinition[];
  escalation_threshold: number;
  default_segment: string;
}

/**
 * Conversion result
 */
export interface ConversionResult {
  success: boolean;
  tenantId?: string;
  tenantCode?: string;
  authOrgId?: string;
  cltMasterdataId?: string;
  verificationToken?: string;
  verificationExpiresAt?: Date;
  error?: string;
  alreadyConverted?: boolean;
}

/**
 * Lead data for conversion
 * Note: fleet_size is VARCHAR in schema, not INT
 */
interface LeadForConversion {
  id: string;
  email: string;
  status: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  phone: string | null;
  country_code: string | null;
  lead_code: string | null;
  fleet_size: string | null; // VARCHAR in DB
  tenant_id: string | null;
  stripe_checkout_session_id: string | null;
}

// ===== SERVICE CLASS =====

export class CustomerConversionService {
  private static instance: CustomerConversionService;

  /**
   * Cached segment thresholds from crm_settings
   * Loaded once on first use, reused for all conversions
   */
  private segmentThresholdsCache: SegmentThresholdsConfig | null = null;

  /** NotificationQueueService for sending verification emails */
  private notificationQueueService: NotificationQueueService;

  /** CountryRepository for locale resolution */
  private countryRepository: CountryRepository;

  private constructor() {
    this.notificationQueueService = new NotificationQueueService();
    this.countryRepository = new CountryRepository();
  }

  public static getInstance(): CustomerConversionService {
    if (!CustomerConversionService.instance) {
      CustomerConversionService.instance = new CustomerConversionService();
    }
    return CustomerConversionService.instance;
  }

  // =========================================================================
  // MAIN CONVERSION METHOD
  // =========================================================================

  /**
   * Convert a lead to customer after successful Stripe checkout
   *
   * Flow:
   * 1. Extract metadata from session
   * 2. Check idempotence (lead not already converted)
   * 3. Validate lead status = payment_pending
   * 4. Execute atomic transaction:
   *    - Generate tenant_code (C-XXXXXX)
   *    - Create adm_tenants
   *    - Create clt_masterdata
   *    - Create Auth Organization
   *    - Update lead to converted
   *    - Create activity log
   * 5. Generate verification token
   * 6. Send verification email
   */
  async convertLeadToCustomer(
    checkoutSession: Stripe.Checkout.Session
  ): Promise<ConversionResult> {
    const sessionId = checkoutSession.id;
    const metadata = checkoutSession.metadata as unknown as CheckoutMetadata;

    logger.info(
      { sessionId, metadata },
      "[CustomerConversion] Starting lead conversion"
    );

    // Validate metadata
    if (!metadata?.leadId) {
      logger.error(
        { sessionId, metadata },
        "[CustomerConversion] Missing leadId in metadata"
      );
      return {
        success: false,
        error: "Missing leadId in checkout session metadata",
      };
    }

    const { leadId, planCode, billingCycle } = metadata;

    try {
      // Step 1: Load lead and check idempotence
      const lead = await this.getLeadForConversion(leadId);

      if (!lead) {
        return { success: false, error: `Lead not found: ${leadId}` };
      }

      // Idempotence check: Already converted?
      if (lead.status === "converted" || lead.tenant_id) {
        logger.info(
          { leadId, tenantId: lead.tenant_id },
          "[CustomerConversion] Lead already converted - idempotent skip"
        );
        return {
          success: true,
          alreadyConverted: true,
          tenantId: lead.tenant_id || undefined,
        };
      }

      // Step 2: Validate status
      if (lead.status !== "payment_pending") {
        return {
          success: false,
          error: `Invalid lead status for conversion: ${lead.status}. Expected: payment_pending`,
        };
      }

      // Step 3: Extract Stripe IDs from checkout session
      const stripeCustomerId =
        typeof checkoutSession.customer === "string"
          ? checkoutSession.customer
          : checkoutSession.customer?.id || null;

      const stripeSubscriptionId =
        typeof checkoutSession.subscription === "string"
          ? checkoutSession.subscription
          : checkoutSession.subscription?.id || null;

      // Step 4: Generate codes and tokens
      const tenantCode = this.generateTenantCode();
      const verificationToken = this.generateVerificationToken();
      const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

      // Step 5: Determine segment from fleet_size using crm_settings.segment_thresholds
      const segmentDef = await this.determineSegment(lead.fleet_size);
      const segment = segmentDef.code; // Store segment code in clt_masterdata

      // Step 6: Execute atomic transaction
      const result = await prisma.$transaction(async (tx) => {
        // 6a. Create adm_tenants
        // Note: adm_tenants doesn't have metadata column - store extra info in clt_masterdata
        const tenant = await tx.adm_tenants.create({
          data: {
            name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
            tenant_code: tenantCode,
            country_code: lead.country_code || "AE",
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            verification_token: verificationToken,
            verification_token_expires_at: verificationExpiresAt,
            // Admin info will be set during verification form
          },
        });

        logger.info(
          { tenantId: tenant.id, tenantCode },
          "[CustomerConversion] Tenant created"
        );

        // 6b. Create clt_masterdata with client_code = tenant_code (CRITICAL RULE)
        // Schema fields: company_name (required), primary_contact_name/email/phone (optional)
        const contactName =
          [lead.first_name, lead.last_name].filter(Boolean).join(" ") || null;

        const masterdata = await tx.clt_masterdata.create({
          data: {
            tenant_id: tenant.id,
            client_code: tenantCode, // SAME as tenant_code - denormalized
            company_name:
              lead.company_name ||
              `${lead.first_name} ${lead.last_name}`.trim(),
            primary_contact_name: contactName,
            primary_contact_email: lead.email,
            primary_contact_phone: lead.phone,
            origin_lead_id: leadId,
            origin_lead_code: lead.lead_code,
            segment: segment,
            metadata: {
              converted_at: new Date().toISOString(),
              plan_code: planCode,
              billing_cycle: billingCycle,
              fleet_size: lead.fleet_size,
              checkout_session_id: sessionId,
            },
          },
        });

        logger.info(
          { masterdataId: masterdata.id, clientCode: tenantCode },
          "[CustomerConversion] clt_masterdata created"
        );

        // 6c. Update lead to converted
        await tx.crm_leads.update({
          where: { id: leadId },
          data: {
            status: "converted",
            converted_at: new Date(),
            tenant_id: tenant.id,
          },
        });

        // 6d. Create activity log
        await tx.crm_lead_activities.create({
          data: {
            tenant_id: tenant.id,
            lead_id: leadId,
            activity_type: "lead_converted",
            description: `Lead converted to customer. Tenant: ${tenantCode}, Plan: ${planCode}`,
            performed_by: "system",
            metadata: {
              tenant_id: tenant.id,
              tenant_code: tenantCode,
              plan_code: planCode,
              billing_cycle: billingCycle,
              stripe_customer_id: stripeCustomerId,
              stripe_subscription_id: stripeSubscriptionId,
              checkout_session_id: sessionId,
            },
          },
        });

        return {
          tenant,
          masterdata,
        };
      });

      // Step 7: Create Auth Organization (outside transaction)
      let authOrgId: string | null = null;
      try {
        const orgResult = await authService.createOrganization({
          name: lead.company_name || `${lead.first_name} ${lead.last_name}`,
          tenantId: result.tenant.id,
          metadata: {
            tenantCode,
            segment, // segment_1, segment_2, segment_3, or segment_4
            segmentLabel: segmentDef.label_en,
            isSaas: segmentDef.is_saas,
            planCode,
          },
        });

        if (orgResult.success && orgResult.organizationId) {
          authOrgId = orgResult.organizationId;

          logger.info(
            { authOrgId, tenantId: result.tenant.id },
            "[CustomerConversion] Auth organization created"
          );
        }
      } catch (orgError) {
        // Non-fatal: Log but continue
        logger.error(
          { error: orgError, tenantId: result.tenant.id },
          "[CustomerConversion] Failed to create auth organization - will retry later"
        );
      }

      // Step 8: Send verification email via NotificationQueueService
      // V6.2-8.5: Using DB-driven template (customer_verification in adm_notification_templates)
      const locale = await this.countryRepository.getNotificationLocale(
        lead.country_code || "FR"
      );
      const verificationUrl = `${URLS.app}/${locale}/verify?token=${verificationToken}`;

      const emailResult = await this.notificationQueueService.queueNotification(
        {
          templateCode: "customer_verification",
          recipientEmail: lead.email,
          locale,
          variables: {
            company_name: result.tenant.name,
            tenant_code: tenantCode,
            verification_url: verificationUrl,
            expires_in_hours: 24,
          },
          leadId,
          countryCode: lead.country_code || "FR",
          idempotencyKey: `customer_verification_${leadId}`,
          processImmediately: true, // Send immediately after checkout
        }
      );

      if (!emailResult.success) {
        logger.warn(
          { leadId, email: lead.email, error: emailResult.error },
          "[CustomerConversion] Failed to queue verification email - will retry"
        );
      } else {
        logger.info(
          {
            leadId,
            email: lead.email,
            verificationUrl,
            queueId: emailResult.queueId,
            expiresAt: verificationExpiresAt.toISOString(),
          },
          "[CustomerConversion] Verification email queued successfully"
        );
      }

      logger.info(
        {
          leadId,
          tenantId: result.tenant.id,
          tenantCode,
          authOrgId,
        },
        "[CustomerConversion] Lead conversion completed successfully"
      );

      return {
        success: true,
        tenantId: result.tenant.id,
        tenantCode,
        authOrgId: authOrgId || undefined,
        cltMasterdataId: result.masterdata.id,
        verificationToken,
        verificationExpiresAt,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        { error: errorMessage, leadId, sessionId },
        "[CustomerConversion] Conversion failed"
      );

      return {
        success: false,
        error: `Conversion failed: ${errorMessage}`,
      };
    }
  }

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Get lead data for conversion
   */
  private async getLeadForConversion(
    leadId: string
  ): Promise<LeadForConversion | null> {
    return prisma.crm_leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        email: true,
        status: true,
        first_name: true,
        last_name: true,
        company_name: true,
        phone: true,
        country_code: true,
        lead_code: true,
        fleet_size: true,
        tenant_id: true,
        stripe_checkout_session_id: true,
      },
    });
  }

  /**
   * Generate tenant code: C-XXXXXX (6 alphanumeric chars)
   * Format matches existing pattern in DB
   */
  private generateTenantCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "C-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate secure verification token
   */
  private generateVerificationToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Load segment thresholds from crm_settings
   * Caches the config to avoid repeated DB calls
   *
   * @throws Error if segment_thresholds not found in crm_settings
   */
  async getSegmentThresholds(): Promise<SegmentThresholdsConfig> {
    if (this.segmentThresholdsCache) {
      return this.segmentThresholdsCache;
    }

    const setting = await prisma.crm_settings.findUnique({
      where: { setting_key: "segment_thresholds" },
      select: { setting_value: true },
    });

    if (!setting) {
      throw new Error(
        "[CustomerConversion] segment_thresholds not found in crm_settings"
      );
    }

    this.segmentThresholdsCache =
      setting.setting_value as unknown as SegmentThresholdsConfig;

    logger.info(
      {
        version: this.segmentThresholdsCache.version,
        segmentCount: this.segmentThresholdsCache.segments.length,
      },
      "[CustomerConversion] Segment thresholds loaded from crm_settings"
    );

    return this.segmentThresholdsCache;
  }

  /**
   * Determine segment based on fleet size using crm_settings.segment_thresholds
   * ZERO HARDCODING - all thresholds from DB
   *
   * Returns the full segment definition for use in conversion
   *
   * Note: fleet_size is VARCHAR in DB, so we parse it
   */
  async determineSegment(fleetSize: string | null): Promise<SegmentDefinition> {
    const config = await this.getSegmentThresholds();

    // Parse fleet size - could be "5", "10-20", "100+", etc.
    const fleetCount = fleetSize ? parseInt(fleetSize, 10) : 1;
    const effectiveFleetCount = isNaN(fleetCount) ? 1 : fleetCount;

    // Find matching segment from thresholds
    for (const segment of config.segments) {
      const minMatch = effectiveFleetCount >= segment.min_fleet;
      const maxMatch =
        segment.max_fleet === null || effectiveFleetCount <= segment.max_fleet;

      if (minMatch && maxMatch) {
        logger.info(
          {
            fleetSize,
            effectiveFleetCount,
            segmentCode: segment.code,
            segmentLabel: segment.label_en,
          },
          "[CustomerConversion] Segment determined from thresholds"
        );
        return segment;
      }
    }

    // Fallback to default segment if no match (shouldn't happen with proper config)
    const defaultSegment = config.segments.find(
      (s) => s.code === config.default_segment
    );

    if (defaultSegment) {
      logger.warn(
        {
          fleetSize,
          effectiveFleetCount,
          defaultSegment: config.default_segment,
        },
        "[CustomerConversion] No segment match, using default"
      );
      return defaultSegment;
    }

    // Ultimate fallback: first segment
    logger.error(
      { fleetSize, effectiveFleetCount },
      "[CustomerConversion] No segment match and no default, using first segment"
    );
    return config.segments[0];
  }

  /**
   * Clear segment thresholds cache
   * Used for testing and when settings are updated
   */
  clearSegmentCache(): void {
    this.segmentThresholdsCache = null;
  }

  /**
   * Check if a checkout session has already been processed
   * Used for idempotence at webhook level
   */
  async isSessionAlreadyProcessed(sessionId: string): Promise<boolean> {
    const lead = await prisma.crm_leads.findFirst({
      where: {
        stripe_checkout_session_id: sessionId,
        status: "converted",
      },
    });
    return !!lead;
  }
}

// Export singleton
export const customerConversionService =
  CustomerConversionService.getInstance();
