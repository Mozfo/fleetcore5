"use client";

/**
 * PaymentLinkSection - Display payment link info in lead detail
 *
 * V6.2-11: Shows existing payment link or button to generate new one.
 * Visible when:
 * - Lead status allows payment link generation (qualified, demo_completed, proposal_sent)
 * - OR lead has payment_pending status
 *
 * @see lib/services/billing/payment-link.service.ts
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CreditCard,
  Copy,
  Mail,
  ExternalLink,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratePaymentLinkModal } from "./GeneratePaymentLinkModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

// ============================================================
// TYPES
// ============================================================

interface PaymentLinkSectionProps {
  lead: Lead;
  onLinkGenerated?: () => void;
}

// Statuses that allow payment link generation (V6.3: demo + proposal_sent)
const ALLOWED_STATUSES_FOR_GENERATION = ["demo", "proposal_sent"];

// ============================================================
// COMPONENT
// ============================================================

export function PaymentLinkSection({
  lead,
  onLinkGenerated,
}: PaymentLinkSectionProps) {
  const { t } = useTranslation(["crm", "common"]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Check visibility conditions
  const canGeneratePaymentLink =
    ALLOWED_STATUSES_FOR_GENERATION.includes(lead.status) &&
    !lead.stripe_checkout_session_id;

  const hasExistingPaymentLink = !!lead.stripe_payment_link_url;
  const isPaymentPending = lead.status === "payment_pending";

  // Only show section if:
  // 1. Can generate a new link
  // 2. OR has existing link (payment_pending)
  const showSection =
    canGeneratePaymentLink || isPaymentPending || hasExistingPaymentLink;

  if (!showSection) return null;

  // Check if link is expired
  const isExpired = lead.payment_link_expires_at
    ? new Date(lead.payment_link_expires_at) < new Date()
    : false;

  // Format expiration date
  const formatExpiration = (
    dateString: string | null | Date | undefined
  ): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    if (!lead.stripe_payment_link_url) return;
    try {
      await navigator.clipboard.writeText(lead.stripe_payment_link_url);
      toast.success(
        t("crm:leads.paymentLink.copied", "Link copied to clipboard")
      );
    } catch {
      toast.error(t("common:error", "Failed to copy"));
    }
  };

  // Open email client with link
  const handleSendEmail = () => {
    if (!lead.stripe_payment_link_url) return;
    const subject = encodeURIComponent(
      t(
        "crm:leads.paymentLink.emailSubject",
        "Complete your FleetCore subscription"
      )
    );
    const body = encodeURIComponent(
      t("crm:leads.paymentLink.emailBody", {
        link: lead.stripe_payment_link_url,
        defaultValue: `Please complete your subscription using the following link:\n\n${lead.stripe_payment_link_url}\n\nThis link will expire soon. If you have any questions, please contact us.`,
      })
    );
    window.open(`mailto:${lead.email}?subject=${subject}&body=${body}`);
  };

  // Handle successful link generation
  const handleLinkGenerated = () => {
    setIsModalOpen(false);
    onLinkGenerated?.();
  };

  return (
    <>
      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        {/* Section Header */}
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
            <CreditCard className="h-4 w-4 text-blue-600" />
            {t("crm:leads.paymentLink.section", "Payment")}
          </h3>
          {isPaymentPending && (
            <Badge
              variant="secondary"
              className="bg-amber-100 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            >
              <Clock className="mr-1 h-3 w-3" />
              {t("crm:leads.paymentLink.pending", "Pending")}
            </Badge>
          )}
          {isExpired && (
            <Badge
              variant="secondary"
              className="bg-red-100 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300"
            >
              <AlertCircle className="mr-1 h-3 w-3" />
              {t("crm:leads.paymentLink.expired", "Expired")}
            </Badge>
          )}
        </div>

        {/* Content */}
        {hasExistingPaymentLink ? (
          <div className="space-y-3">
            {/* Link Display */}
            <div className="rounded-md bg-gray-50 p-3 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-muted-foreground text-xs">
                    {t("crm:leads.paymentLink.checkoutLink", "Checkout Link")}
                  </p>
                  <a
                    href={lead.stripe_payment_link_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "mt-1 block truncate text-sm font-medium hover:underline",
                      isExpired
                        ? "text-gray-400"
                        : "text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {lead.stripe_payment_link_url}
                  </a>
                </div>
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-gray-400" />
              </div>
            </div>

            {/* Expiration Info */}
            {lead.payment_link_expires_at && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="h-3 w-3" />
                <span>
                  {t("crm:leads.paymentLink.expires", "Expires")}:{" "}
                  {formatExpiration(lead.payment_link_expires_at)}
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                disabled={isExpired}
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                {t("crm:leads.paymentLink.copy", "Copy")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSendEmail}
                disabled={isExpired}
              >
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                {t("crm:leads.paymentLink.sendEmail", "Send via Email")}
              </Button>
              {(isExpired || canGeneratePaymentLink) && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setIsModalOpen(true)}
                >
                  <CreditCard className="mr-1.5 h-3.5 w-3.5" />
                  {t("crm:leads.paymentLink.generateNew", "Generate New Link")}
                </Button>
              )}
            </div>
          </div>
        ) : (
          // No existing link - show generate button
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="mb-3 rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
              <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t("crm:leads.paymentLink.noLink", "No payment link yet")}
            </p>
            <p className="text-muted-foreground mb-4 text-xs">
              {t(
                "crm:leads.paymentLink.noLinkDesc",
                "Generate a Stripe checkout link to send to this lead"
              )}
            </p>
            <Button onClick={() => setIsModalOpen(true)}>
              <CreditCard className="mr-2 h-4 w-4" />
              {t("crm:leads.paymentLink.generate", "Generate Payment Link")}
            </Button>
          </div>
        )}

        {/* Status indicator for converted leads */}
        {lead.status === "converted" && (
          <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
            <CheckCircle className="h-4 w-4" />
            {t(
              "crm:leads.paymentLink.converted",
              "Payment completed - Lead converted to customer"
            )}
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <GeneratePaymentLinkModal
        leadId={lead.id}
        leadEmail={lead.email}
        companyName={lead.company_name}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleLinkGenerated}
      />
    </>
  );
}
