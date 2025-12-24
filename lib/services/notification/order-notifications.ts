/**
 * Order Notifications - Quote-to-Cash
 *
 * Notification functions for CRM Order events:
 * - sendOrderCreatedNotification: Sent when an order is created from a won opportunity
 *
 * Pattern: Uses NotificationService for email delivery
 * Domain: CRM (Quote-to-Cash)
 *
 * @module lib/services/notification/order-notifications
 */

import { prisma } from "@/lib/prisma";
import { NotificationService } from "./notification.service";
import { logger } from "@/lib/logger";

// Singleton instance
const notificationService = new NotificationService();

/**
 * Billing cycle labels for email display
 * Only "month" and "year" are valid values (Prisma billing_interval enum)
 */
const BILLING_CYCLE_LABELS: Record<
  string,
  { en: string; fr: string; ar: string }
> = {
  month: { en: "Monthly", fr: "Mensuel", ar: "شهري" },
  year: { en: "Annual", fr: "Annuel", ar: "سنوي" },
};

/**
 * Format a date for display in emails
 * Uses locale-aware formatting
 *
 * @param date - Date to format
 * @param locale - Locale code (en, fr, ar)
 * @returns Formatted date string
 */
function formatDate(
  date: Date | null | undefined,
  locale: string = "en"
): string {
  if (!date) return "N/A";

  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };

  try {
    return new Intl.DateTimeFormat(localeMap[locale] || "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  } catch {
    return date.toString().split("T")[0];
  }
}

/**
 * Format currency value for display
 *
 * @param value - Numeric value (may be Decimal from Prisma)
 * @param currency - Currency code (EUR, USD, etc.)
 * @param locale - Locale for formatting
 * @returns Formatted currency string
 */
function formatCurrency(
  value: number | { toString(): string } | null | undefined,
  currency: string = "EUR",
  locale: string = "en"
): string {
  if (value === null || value === undefined) return "N/A";

  const numValue =
    typeof value === "number" ? value : parseFloat(value.toString());
  if (isNaN(numValue)) return "N/A";

  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
  };

  try {
    return new Intl.NumberFormat(localeMap[locale] || "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numValue);
  } catch {
    return `${numValue.toFixed(2)} ${currency}`;
  }
}

/**
 * Calculate contract duration in months from dates
 *
 * @param effectiveDate - Contract start date
 * @param expiryDate - Contract end date
 * @returns Duration in months
 */
function calculateDurationMonths(
  effectiveDate: Date | null | undefined,
  expiryDate: Date | null | undefined
): number {
  if (!effectiveDate || !expiryDate) return 0;

  const start = new Date(effectiveDate);
  const end = new Date(expiryDate);

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());

  return Math.max(1, months);
}

/**
 * Send order created notification
 *
 * Fetches order with relations and sends notification via NotificationService.
 * This function is designed to be called asynchronously (fire-and-forget)
 * after order creation to not block the main flow.
 *
 * Recipients: Currently sends to contact_email on the order.
 * Future: Can be extended to include sales reps, managers, etc.
 *
 * @param orderId - UUID of the created order
 * @returns Promise that resolves when notification is sent/queued
 *
 * @example
 * ```typescript
 * // In markOpportunityWonAction:
 * sendOrderCreatedNotification(result.order.id).catch((err) => {
 *   logger.error({ err, orderId: result.order.id }, "Failed to send order notification");
 * });
 * ```
 */
export async function sendOrderCreatedNotification(
  orderId: string
): Promise<void> {
  const logContext = { orderId, function: "sendOrderCreatedNotification" };

  try {
    // 1. Fetch order (no relations defined in schema - must fetch separately)
    const order = await prisma.crm_orders.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      logger.warn(logContext, "Order not found, skipping notification");
      return;
    }

    // 2. Fetch lead separately via FK
    const lead = order.lead_id
      ? await prisma.crm_leads.findUnique({
          where: { id: order.lead_id },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            company_name: true,
            country_code: true,
          },
        })
      : null;

    // 3. Fetch opportunity separately via FK (if exists)
    const opportunity = order.opportunity_id
      ? await prisma.crm_opportunities.findUnique({
          where: { id: order.opportunity_id },
          select: {
            id: true,
            stage: true,
            expected_value: true,
          },
        })
      : null;

    // 4. Determine recipient
    const recipientEmail = order.contact_email || lead?.email;
    if (!recipientEmail) {
      logger.warn(
        { ...logContext, leadId: order.lead_id },
        "No recipient email found, skipping notification"
      );
      return;
    }

    // 5. Determine locale from country code (default to 'en')
    // Future: Could lookup from dir_country_locales based on country_code
    const countryCode = lead?.country_code || undefined;
    const locale = "en"; // Default for now, will use cascade in notificationService

    // 6. Calculate duration
    const durationMonths = calculateDurationMonths(
      order.effective_date,
      order.expiry_date
    );

    // 7. Get billing cycle label
    const billingCycleRaw = order.billing_cycle || "month";
    const billingCycleLabel =
      BILLING_CYCLE_LABELS[billingCycleRaw]?.[locale as "en" | "fr" | "ar"] ||
      BILLING_CYCLE_LABELS[billingCycleRaw]?.en ||
      billingCycleRaw;

    // 8. Auto-renew label
    const autoRenewLabels: Record<string, { yes: string; no: string }> = {
      en: { yes: "Yes", no: "No" },
      fr: { yes: "Oui", no: "Non" },
      ar: { yes: "نعم", no: "لا" },
    };
    const autoRenewLabel = order.auto_renew
      ? autoRenewLabels[locale]?.yes || "Yes"
      : autoRenewLabels[locale]?.no || "No";

    // 9. Build order URL
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.fleetcore.com";
    const orderUrl = `${baseUrl}/crm/orders/${order.id}`;

    // 10. Generate opportunity title from lead company or use stage
    // (opportunity already fetched in step 3)
    const opportunityTitle = lead?.company_name
      ? `${lead.company_name} - ${opportunity?.stage || "Opportunity"}`
      : opportunity?.stage || "N/A";

    // 11. Prepare variables
    const variables: Record<string, string> = {
      order_reference: order.order_reference || "N/A",
      order_code: order.order_code || "N/A",
      opportunity_title: opportunityTitle,
      total_value: formatCurrency(order.total_value, order.currency, locale),
      currency: order.currency || "EUR",
      monthly_value: formatCurrency(
        order.monthly_value,
        order.currency,
        locale
      ),
      annual_value: formatCurrency(order.annual_value, order.currency, locale),
      billing_cycle: billingCycleLabel,
      effective_date: formatDate(order.effective_date, locale),
      expiry_date: formatDate(order.expiry_date, locale),
      duration_months: durationMonths.toString(),
      auto_renew: autoRenewLabel,
      company_name: order.company_name || lead?.company_name || "N/A",
      contact_name:
        order.contact_name ||
        `${lead?.first_name || ""} ${lead?.last_name || ""}`.trim() ||
        "N/A",
      contact_email: recipientEmail,
      order_url: orderUrl,
    };

    // 12. Send notification
    const result = await notificationService.sendEmail({
      recipientEmail,
      templateCode: "order_created",
      variables,
      leadId: order.lead_id,
      countryCode,
      locale, // Force locale from lead preference
      fallbackLocale: "en",
    });

    if (result.success) {
      logger.info(
        {
          ...logContext,
          messageId: result.messageId,
          locale: result.locale,
          recipientEmail,
        },
        "Order created notification sent successfully"
      );
    } else {
      logger.error(
        {
          ...logContext,
          error: result.error,
          recipientEmail,
        },
        "Failed to send order created notification"
      );
    }
  } catch (error) {
    logger.error(
      {
        ...logContext,
        error: error instanceof Error ? error.message : String(error),
      },
      "Error in sendOrderCreatedNotification"
    );
    // Re-throw to allow caller to handle if needed
    throw error;
  }
}
