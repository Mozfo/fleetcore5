"use client";

/**
 * GeneratePaymentLinkModal - Modal to generate Stripe payment links
 *
 * V6.2-11: Allows generating Stripe Checkout links for leads.
 * Uses POST /api/v1/bil/payment-links
 *
 * @see lib/services/billing/payment-link.service.ts
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ============================================================
// TYPES & VALIDATION
// ============================================================

const paymentLinkSchema = z.object({
  plan_code: z.enum(["starter", "pro", "premium"], {
    message: "Please select a plan",
  }),
  billing_cycle: z.enum(["monthly", "yearly"], {
    message: "Please select a billing cycle",
  }),
});

type PaymentLinkFormData = z.infer<typeof paymentLinkSchema>;

interface PaymentLinkResult {
  payment_link_url: string;
  checkout_session_id: string;
  expires_at: string;
  lead_id: string;
  status_updated: boolean;
}

interface GeneratePaymentLinkModalProps {
  leadId: string;
  leadEmail: string;
  companyName: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: PaymentLinkResult) => void;
}

// ============================================================
// PLAN CONFIGURATION
// ============================================================

const PLANS = [
  {
    code: "starter",
    name: "Starter",
    monthlyPrice: "49",
    yearlyPrice: "490",
    description: "For small fleets (1-10 vehicles)",
  },
  {
    code: "pro",
    name: "Pro",
    monthlyPrice: "99",
    yearlyPrice: "990",
    description: "For growing fleets (11-50 vehicles)",
  },
  {
    code: "premium",
    name: "Premium",
    monthlyPrice: "199",
    yearlyPrice: "1990",
    description: "For large fleets (50+ vehicles)",
  },
];

// ============================================================
// COMPONENT
// ============================================================

export function GeneratePaymentLinkModal({
  leadId,
  leadEmail,
  companyName,
  isOpen,
  onClose,
  onSuccess,
}: GeneratePaymentLinkModalProps) {
  const { t } = useTranslation(["crm", "common"]);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PaymentLinkFormData>({
    resolver: zodResolver(paymentLinkSchema),
    defaultValues: {
      plan_code: "starter",
      billing_cycle: "monthly",
    },
  });

  const watchedValues = watch();
  const selectedPlan = PLANS.find((p) => p.code === watchedValues.plan_code);
  const price =
    watchedValues.billing_cycle === "yearly"
      ? selectedPlan?.yearlyPrice
      : selectedPlan?.monthlyPrice;

  // Handle form submission
  const onSubmit = async (data: PaymentLinkFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/bil/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          plan_code: data.plan_code,
          billing_cycle: data.billing_cycle,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage =
          result.error?.message ||
          t("crm:leads.paymentLink.error", "Failed to create payment link");
        toast.error(errorMessage);
        return;
      }

      // Success
      toast.success(
        t(
          "crm:leads.paymentLink.success",
          "Payment link generated successfully"
        )
      );
      onSuccess(result.data as PaymentLinkResult);
      handleClose();
    } catch {
      toast.error(t("common:error", "An error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            {t("crm:leads.paymentLink.generate", "Generate Payment Link")}
          </DialogTitle>
          <DialogDescription>
            {t("crm:leads.paymentLink.description", {
              company: companyName || leadEmail,
              defaultValue: `Create a Stripe checkout link for ${companyName || leadEmail}`,
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Lead Info */}
          <div className="bg-muted flex items-center gap-3 rounded-lg p-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{companyName || leadEmail}</p>
              <p className="text-muted-foreground text-xs">{leadEmail}</p>
            </div>
          </div>

          {/* Plan Selection */}
          <div>
            <Label className="text-sm">
              {t("crm:leads.paymentLink.selectPlan", "Select Plan")}
            </Label>
            <Select {...register("plan_code")} className="mt-1.5">
              {PLANS.map((plan) => (
                <option key={plan.code} value={plan.code}>
                  {plan.name} - {plan.description}
                </option>
              ))}
            </Select>
            {errors.plan_code && (
              <p className="mt-1 text-xs text-red-500">
                {errors.plan_code.message}
              </p>
            )}
          </div>

          {/* Billing Cycle Selection */}
          <div>
            <Label className="text-sm">
              {t("crm:leads.paymentLink.selectCycle", "Billing Cycle")}
            </Label>
            <Select {...register("billing_cycle")} className="mt-1.5">
              <option value="monthly">
                {t("crm:leads.paymentLink.monthly", "Monthly")}
              </option>
              <option value="yearly">
                {t("crm:leads.paymentLink.yearly", "Yearly")} (
                {t("crm:leads.paymentLink.save2Months", "Save 2 months")})
              </option>
            </Select>
            {errors.billing_cycle && (
              <p className="mt-1 text-xs text-red-500">
                {errors.billing_cycle.message}
              </p>
            )}
          </div>

          {/* Price Preview */}
          {selectedPlan && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {selectedPlan.name}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {selectedPlan.description}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {price} EUR
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    /
                    {watchedValues.billing_cycle === "yearly"
                      ? t("crm:leads.paymentLink.year", "year")
                      : t("crm:leads.paymentLink.month", "month")}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-1">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-xs text-green-700"
                >
                  {t(
                    "crm:leads.paymentLink.firstMonthFree",
                    "First month free"
                  )}
                </Badge>
              </div>
            </div>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              {t("common:cancel", "Cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("crm:leads.paymentLink.generating", "Generating...")}
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {t("crm:leads.paymentLink.confirm", "Generate Link")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
