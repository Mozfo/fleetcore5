"use client";

/**
 * MarkAsWonModal - Modal to mark an opportunity as won (Quote-to-Cash)
 *
 * Features:
 * - Pre-populated with expected_value from opportunity
 * - Contract parameters: billing cycle, duration, effective date
 * - Auto-renew and notice period options
 * - Creates Order via markOpportunityWonAction
 * - Returns both opportunity and order data on success
 *
 * @module components/crm/opportunities/MarkAsWonModal
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trophy, Loader2, Calendar, Clock, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { Switch } from "@/components/ui/switch";
import { markOpportunityWonAction } from "@/lib/actions/crm/opportunity.actions";
import type { Opportunity } from "@/types/crm";

// Billing cycle options (matches Prisma enum billing_interval)
const BILLING_CYCLE_OPTIONS = [
  { value: "month", labelKey: "opportunity.won_modal.billing_monthly" },
  { value: "year", labelKey: "opportunity.won_modal.billing_annual" },
] as const;

// Common contract durations
const DURATION_OPTIONS = [
  { value: 6, labelKey: "opportunity.won_modal.duration_6m" },
  { value: 12, labelKey: "opportunity.won_modal.duration_12m" },
  { value: 24, labelKey: "opportunity.won_modal.duration_24m" },
  { value: 36, labelKey: "opportunity.won_modal.duration_36m" },
] as const;

// Notice period options
const NOTICE_PERIOD_OPTIONS = [
  { value: 0, labelKey: "opportunity.won_modal.notice_none" },
  { value: 30, labelKey: "opportunity.won_modal.notice_30" },
  { value: 60, labelKey: "opportunity.won_modal.notice_60" },
  { value: 90, labelKey: "opportunity.won_modal.notice_90" },
] as const;

/**
 * Props for the MarkAsWonModal component
 */
interface MarkAsWonModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: {
    opportunity: {
      id: string;
      status: string;
      won_date: string;
      won_value: number;
    };
    order: {
      id: string;
      order_reference: string;
      order_code: string;
      total_value: number;
      monthly_value: number;
      annual_value: number;
      effective_date: string;
      expiry_date: string;
    };
  }) => void;
}

export function MarkAsWonModal({
  opportunity,
  isOpen,
  onClose,
  onSuccess,
}: MarkAsWonModalProps) {
  const { t } = useTranslation("crm");

  // Form state - Contract parameters
  const [totalValue, setTotalValue] = useState<string>("");
  const [billingCycle, setBillingCycle] = useState<string>("monthly");
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [autoRenew, setAutoRenew] = useState<boolean>(false);
  const [noticePeriodDays, setNoticePeriodDays] = useState<number>(30);
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default to expected_value
      setTotalValue(opportunity.expected_value?.toString() ?? "");
      // Default billing cycle
      setBillingCycle("month");
      // Default to tomorrow (contract starts tomorrow)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEffectiveDate(tomorrow.toISOString().split("T")[0]);
      // Default duration
      setDurationMonths(12);
      // Auto-renew off by default
      setAutoRenew(false);
      // Standard notice period
      setNoticePeriodDays(30);
      // Clear notes
      setNotes("");
    }
  }, [isOpen, opportunity.expected_value]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      if (!totalValue || parseFloat(totalValue) < 100) {
        toast.error(t("opportunity.won_modal.error_min_value"));
        return;
      }

      if (!effectiveDate) {
        toast.error(t("opportunity.won_modal.error_date_required"));
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await markOpportunityWonAction({
          opportunityId: opportunity.id,
          totalValue: parseFloat(totalValue),
          currency: opportunity.currency || "EUR",
          billingCycle: billingCycle as "month" | "year",
          effectiveDate: new Date(effectiveDate),
          durationMonths,
          autoRenew,
          noticePeriodDays,
          notes: notes || undefined,
        });

        if (!result.success) {
          toast.error(result.error || t("opportunity.won_modal.error"));
          return;
        }

        // Show success with order reference
        toast.success(
          t("opportunity.won_modal.success_with_order", {
            orderRef: result.data.order.order_reference,
          })
        );

        // Call onSuccess with full data
        onSuccess?.(result.data);
        onClose();
      } catch {
        toast.error(t("opportunity.won_modal.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      opportunity.id,
      opportunity.currency,
      totalValue,
      billingCycle,
      effectiveDate,
      durationMonths,
      autoRenew,
      noticePeriodDays,
      notes,
      t,
      onSuccess,
      onClose,
    ]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Calculate monthly value preview
  const monthlyValuePreview =
    totalValue && durationMonths
      ? (parseFloat(totalValue) / durationMonths).toFixed(2)
      : "0.00";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-green-600" />
            {t("opportunity.won_modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("opportunity.won_modal.description_quote_to_cash")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contract Value */}
          <div className="space-y-2">
            <Label htmlFor="total-value">
              {t("opportunity.won_modal.total_value")} *
            </Label>
            <div className="relative">
              <Input
                id="total-value"
                type="number"
                min="100"
                step="0.01"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                placeholder={t("opportunity.won_modal.total_value_placeholder")}
                className="pr-12"
                required
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                {opportunity.currency || "EUR"}
              </span>
            </div>
            {totalValue && (
              <p className="text-muted-foreground text-xs">
                {t("opportunity.won_modal.monthly_value_preview", {
                  value: monthlyValuePreview,
                  currency: opportunity.currency || "EUR",
                })}
              </p>
            )}
          </div>

          {/* Billing Cycle & Duration Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Billing Cycle */}
            <div className="space-y-2">
              <Label htmlFor="billing-cycle">
                <Clock className="mr-1 inline h-4 w-4" />
                {t("opportunity.won_modal.billing_cycle")} *
              </Label>
              <Select
                id="billing-cycle"
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                required
              >
                {BILLING_CYCLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">
                {t("opportunity.won_modal.duration")} *
              </Label>
              <Select
                id="duration"
                value={durationMonths.toString()}
                onChange={(e) => setDurationMonths(parseInt(e.target.value))}
                required
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value.toString()}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Effective Date */}
          <div className="space-y-2">
            <Label htmlFor="effective-date">
              <Calendar className="mr-1 inline h-4 w-4" />
              {t("opportunity.won_modal.effective_date")} *
            </Label>
            <Input
              id="effective-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Auto-Renew & Notice Period Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Auto-Renew Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="auto-renew" className="text-sm font-medium">
                  <RefreshCw className="mr-1 inline h-4 w-4" />
                  {t("opportunity.won_modal.auto_renew")}
                </Label>
              </div>
              <Switch
                id="auto-renew"
                checked={autoRenew}
                onCheckedChange={setAutoRenew}
              />
            </div>

            {/* Notice Period */}
            <div className="space-y-2">
              <Label htmlFor="notice-period">
                {t("opportunity.won_modal.notice_period")}
              </Label>
              <Select
                id="notice-period"
                value={noticePeriodDays.toString()}
                onChange={(e) => setNoticePeriodDays(parseInt(e.target.value))}
              >
                {NOTICE_PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value.toString()}>
                    {t(option.labelKey)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="won-notes">
              {t("opportunity.won_modal.notes")}
            </Label>
            <Textarea
              id="won-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("opportunity.won_modal.notes_placeholder")}
              rows={2}
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("opportunity.drawer.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !totalValue || !effectiveDate}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("opportunity.won_modal.confirming")}
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  {t("opportunity.won_modal.confirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
