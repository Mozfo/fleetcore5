/**
 * QuoteForm - Reusable form for creating and editing quotes
 *
 * Sections:
 * 1. Opportunity selection (dropdown)
 * 2. Dates: valid_from, valid_until, contract_start_date
 * 3. Billing: cycle, currency, contract_duration_months
 * 4. Line Items (QuoteItemsEditor)
 * 5. Discount: type + value
 * 6. Tax rate
 * 7. Notes & Terms
 *
 * Uses native Select pattern (consistent with Leads/Opportunities forms)
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteItemsEditor, type QuoteLineItem } from "./QuoteItemsEditor";
import { QuoteCalculations } from "./QuoteCalculations";
import {
  createQuoteAction,
  updateQuoteAction,
} from "@/lib/actions/crm/quote.actions";
import type { QuoteWithItems } from "@/lib/repositories/crm/quote.repository";
import type { CreateQuoteInput } from "@/lib/validators/crm/quote.validators";

// Simplified Opportunity type for dropdown selection
interface OpportunityOption {
  id: string;
  title: string;
  stage: string;
  expected_value: number | null;
  currency: string;
  lead: {
    company_name: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
}

// Billing cycles - matches billing_interval enum in Prisma
// NOTE: Only "month" and "year" exist in Prisma billing_interval enum
const BILLING_CYCLES = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Annually" },
] as const;

// Currencies - matches CURRENCIES in shared.validators
const CURRENCIES = [
  { value: "EUR", label: "EUR - Euro" },
  { value: "USD", label: "USD - US Dollar" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AED", label: "AED - UAE Dirham" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
  { value: "QAR", label: "QAR - Qatari Riyal" },
] as const;

// Discount types - matches discount_type enum
const DISCOUNT_TYPES = [
  { value: "none", label: "No Discount" },
  { value: "percentage", label: "Percentage" },
  { value: "fixed_amount", label: "Fixed Amount" },
] as const;

// Form schema - using string types for numeric fields to avoid z.coerce type issues
// Number conversion happens in onSubmit handler
const createQuoteFormSchema = (t: (key: string) => string) =>
  z.object({
    opportunityId: z
      .string()
      .uuid(t("quotes.form.validation.opportunity_required")),
    validFrom: z
      .string()
      .min(1, t("quotes.form.validation.valid_from_required")),
    validUntil: z
      .string()
      .min(1, t("quotes.form.validation.valid_until_required")),
    contractStartDate: z.string().optional(),
    contractDurationMonths: z.string().optional(),
    billingCycle: z.enum(["month", "year"]),
    currency: z.enum(["EUR", "USD", "GBP", "CHF", "CAD", "AED", "SAR", "QAR"]),
    discountType: z.string().optional(),
    discountValue: z.string().optional(),
    taxRate: z.string().optional(),
    notes: z.string().max(5000).optional(),
    termsAndConditions: z.string().max(50000).optional(),
  });

type QuoteFormValues = z.infer<ReturnType<typeof createQuoteFormSchema>>;

interface QuoteFormProps {
  mode: "create" | "edit";
  quote?: QuoteWithItems;
  opportunities: OpportunityOption[];
  preselectedOpportunityId?: string;
  locale?: "en" | "fr";
  onSuccess?: (quote: QuoteWithItems) => void;
  onCancel?: () => void;
}

export function QuoteForm({
  mode,
  quote,
  opportunities,
  preselectedOpportunityId,
  onSuccess,
  onCancel,
}: QuoteFormProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");

  // Line items state
  const [items, setItems] = useState<QuoteLineItem[]>(
    quote?.crm_quote_items?.map((item) => ({
      id: item.id,
      description: item.name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      item_type: item.item_type as QuoteLineItem["item_type"],
      recurrence: item.recurrence as QuoteLineItem["recurrence"],
      line_discount_percent: item.line_discount_value
        ? Number(item.line_discount_value)
        : undefined,
      total_price: Number(item.line_total),
    })) || []
  );

  // Create schema with translations
  const schema = useMemo(() => createQuoteFormSchema(t), [t]);

  // Form setup
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      opportunityId: quote?.opportunity_id || preselectedOpportunityId || "",
      validFrom: quote?.valid_from
        ? new Date(quote.valid_from).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      validUntil: quote?.valid_until
        ? new Date(quote.valid_until).toISOString().split("T")[0]
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
      contractStartDate: quote?.contract_start_date
        ? new Date(quote.contract_start_date).toISOString().split("T")[0]
        : "",
      contractDurationMonths:
        quote?.contract_duration_months?.toString() ?? "12",
      billingCycle:
        (quote?.billing_cycle as QuoteFormValues["billingCycle"]) || "month",
      currency: (quote?.currency as QuoteFormValues["currency"]) || "EUR",
      discountType: quote?.discount_type || "none",
      discountValue: quote?.discount_value
        ? Number(quote.discount_value).toString()
        : "",
      taxRate: quote?.tax_rate ? Number(quote.tax_rate).toString() : "0",
      notes: quote?.notes || "",
      termsAndConditions: quote?.terms_and_conditions || "",
    },
  });

  const { watch, setValue, formState, register } = form;
  const { isSubmitting, errors } = formState;

  // Watch values for calculations
  const discountType = watch("discountType");
  const discountValue = watch("discountValue");
  const taxRate = watch("taxRate");
  const currency = watch("currency");
  const billingCycle = watch("billingCycle");
  const opportunityId = watch("opportunityId");

  // Selected opportunity
  const selectedOpportunity = useMemo(
    () => opportunities.find((o) => o.id === opportunityId),
    [opportunities, opportunityId]
  );

  // Handle form submission
  const onSubmit = useCallback(
    async (data: QuoteFormValues) => {
      if (items.length === 0) {
        toast.error(
          t(
            "quotes.form.validation.items_required",
            "At least one line item is required"
          )
        );
        return;
      }

      try {
        // Parse numeric fields from string values
        const contractDuration = data.contractDurationMonths
          ? parseInt(data.contractDurationMonths, 10)
          : 12;
        const discountVal = data.discountValue
          ? parseFloat(data.discountValue)
          : undefined;
        const tax = data.taxRate ? parseFloat(data.taxRate) : 0;

        // Map form data to API input (CreateQuoteInput)
        const apiInput: CreateQuoteInput = {
          opportunityId: data.opportunityId,
          validUntil: new Date(data.validUntil),
          validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
          contractStartDate: data.contractStartDate
            ? new Date(data.contractStartDate)
            : undefined,
          contractDurationMonths: contractDuration,
          billingCycle: data.billingCycle,
          currency: data.currency,
          discountType:
            data.discountType && data.discountType !== "none"
              ? (data.discountType as "percentage" | "fixed_amount")
              : undefined,
          discountValue: discountVal,
          taxRate: tax,
          notes: data.notes || undefined,
          termsAndConditions: data.termsAndConditions || undefined,
          items: items.map((item, index) => ({
            itemType: item.item_type,
            recurrence: item.recurrence,
            name: item.description || "Item",
            description: item.description || undefined,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            lineDiscountType: item.line_discount_percent
              ? ("percentage" as const)
              : undefined,
            lineDiscountValue: item.line_discount_percent || undefined,
            sortOrder: index,
          })),
        };

        let result;
        if (mode === "create") {
          result = await createQuoteAction(apiInput);
        } else if (quote) {
          // For update, we need to use updateQuoteAction with different input type
          result = await updateQuoteAction(quote.id, {
            validUntil: apiInput.validUntil,
            contractStartDate: apiInput.contractStartDate,
            contractDurationMonths: contractDuration,
            billingCycle: apiInput.billingCycle,
            discountType: apiInput.discountType,
            discountValue: discountVal,
            taxRate: tax,
            notes: apiInput.notes,
            termsAndConditions: apiInput.termsAndConditions,
          });
        } else {
          toast.error(t("quotes.form.error", "Quote not found for update"));
          return;
        }

        if (result.success && "quote" in result) {
          toast.success(
            mode === "create"
              ? t("quotes.form.success_created", "Quote created successfully")
              : t("quotes.form.success_updated", "Quote updated successfully")
          );
          onSuccess?.(result.quote as QuoteWithItems);
          router.push(`/crm/quotes/${result.quote.id}`);
        } else {
          toast.error(
            result.error || t("quotes.form.error", "Failed to save quote")
          );
        }
      } catch {
        toast.error(t("quotes.form.error", "Failed to save quote"));
      }
    },
    [items, mode, quote, t, onSuccess, router]
  );

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  }, [onCancel, router]);

  // Map billing cycle for display in calculations
  // NOTE: Only "month" and "year" exist in Prisma billing_interval enum
  const calcBillingCycle = useMemo(() => {
    switch (billingCycle) {
      case "month":
        return "monthly";
      case "year":
        return "annually";
      default:
        return "monthly";
    }
  }, [billingCycle]);

  // Map discount type for calculations
  const calcDiscountType = useMemo(() => {
    if (!discountType || discountType === "none") return null;
    return discountType === "percentage" ? "percentage" : "fixed";
  }, [discountType]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {mode === "create"
            ? t("quotes.form.title_create", "Create Quote")
            : t("quotes.form.title_edit", "Edit Quote")}
        </h1>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left column - Main form */}
          <div className="space-y-6 lg:col-span-2">
            {/* Opportunity Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_opportunity", "Opportunity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="opportunityId">
                    {t("quotes.form.opportunity", "Opportunity")} *
                  </Label>
                  <Select
                    id="opportunityId"
                    value={opportunityId}
                    onChange={(e) => setValue("opportunityId", e.target.value)}
                    disabled={mode === "edit"}
                    className="mt-1"
                  >
                    <option value="">
                      {t(
                        "quotes.form.select_opportunity",
                        "Select an opportunity"
                      )}
                    </option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>
                        {opp.lead?.company_name || "Unknown"} -{" "}
                        {opp.lead?.first_name} {opp.lead?.last_name}
                      </option>
                    ))}
                  </Select>
                  {errors.opportunityId && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.opportunityId.message}
                    </p>
                  )}
                </div>

                {selectedOpportunity && (
                  <div className="rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
                    <p className="font-medium">
                      {selectedOpportunity.lead?.company_name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">
                      {selectedOpportunity.lead?.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_dates", "Dates")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="validFrom">
                      {t("quotes.form.valid_from", "Valid From")} *
                    </Label>
                    <Input
                      id="validFrom"
                      type="date"
                      {...register("validFrom")}
                      className="mt-1"
                    />
                    {errors.validFrom && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.validFrom.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="validUntil">
                      {t("quotes.form.valid_until", "Valid Until")} *
                    </Label>
                    <Input
                      id="validUntil"
                      type="date"
                      {...register("validUntil")}
                      className="mt-1"
                    />
                    {errors.validUntil && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.validUntil.message}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="contractStartDate">
                      {t(
                        "quotes.form.contract_start_date",
                        "Contract Start Date"
                      )}
                    </Label>
                    <Input
                      id="contractStartDate"
                      type="date"
                      {...register("contractStartDate")}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contractDurationMonths">
                      {t(
                        "quotes.form.contract_duration",
                        "Contract Duration (months)"
                      )}
                    </Label>
                    <Input
                      id="contractDurationMonths"
                      type="number"
                      min={1}
                      max={120}
                      {...register("contractDurationMonths")}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_billing", "Billing")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="billingCycle">
                      {t("quotes.form.billing_cycle", "Billing Cycle")} *
                    </Label>
                    <Select
                      id="billingCycle"
                      value={billingCycle}
                      onChange={(e) =>
                        setValue(
                          "billingCycle",
                          e.target.value as QuoteFormValues["billingCycle"]
                        )
                      }
                      className="mt-1"
                    >
                      {BILLING_CYCLES.map((cycle) => (
                        <option key={cycle.value} value={cycle.value}>
                          {t(`quotes.billing.${cycle.value}`, cycle.label)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">
                      {t("quotes.form.currency", "Currency")} *
                    </Label>
                    <Select
                      id="currency"
                      value={currency}
                      onChange={(e) =>
                        setValue(
                          "currency",
                          e.target.value as QuoteFormValues["currency"]
                        )
                      }
                      className="mt-1"
                    >
                      {CURRENCIES.map((cur) => (
                        <option key={cur.value} value={cur.value}>
                          {cur.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_items", "Line Items")} *
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteItemsEditor
                  items={items}
                  currency={currency}
                  onChange={setItems}
                />
              </CardContent>
            </Card>

            {/* Discount & Tax */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_discount", "Discount & Tax")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="discountType">
                      {t("quotes.form.discount_type", "Discount Type")}
                    </Label>
                    <Select
                      id="discountType"
                      value={discountType || "none"}
                      onChange={(e) => setValue("discountType", e.target.value)}
                      className="mt-1"
                    >
                      {DISCOUNT_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {t(`quotes.form.discount_${type.value}`, type.label)}
                        </option>
                      ))}
                    </Select>
                  </div>
                  {discountType && discountType !== "none" && (
                    <div>
                      <Label htmlFor="discountValue">
                        {t("quotes.form.discount_value", "Discount Value")}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        min={0}
                        step={discountType === "percentage" ? "0.01" : "1"}
                        value={discountValue ?? ""}
                        onChange={(e) =>
                          setValue("discountValue", e.target.value)
                        }
                        className="mt-1"
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor="taxRate">
                      {t("quotes.form.tax_rate", "Tax Rate (%)")}
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      {...register("taxRate")}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes & Terms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {t("quotes.form.section_notes", "Notes & Terms")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">
                    {t("quotes.form.notes", "Notes")}
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder={t(
                      "quotes.form.notes_placeholder",
                      "Internal notes..."
                    )}
                    {...register("notes")}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="termsAndConditions">
                    {t("quotes.form.terms_conditions", "Terms & Conditions")}
                  </Label>
                  <Textarea
                    id="termsAndConditions"
                    rows={4}
                    placeholder={t(
                      "quotes.form.terms_placeholder",
                      "Terms and conditions..."
                    )}
                    {...register("termsAndConditions")}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Summary */}
          <div className="space-y-6">
            <div className="sticky top-6">
              <QuoteCalculations
                items={items}
                discountType={calcDiscountType}
                discountValue={discountValue ? parseFloat(discountValue) : null}
                taxRate={taxRate ? parseFloat(taxRate) : 0}
                currency={currency}
                billingCycle={calcBillingCycle}
              />

              <Separator className="my-6" />

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {mode === "create"
                    ? t("quotes.form.create_button", "Create Quote")
                    : t("quotes.form.save_button", "Save Changes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  {t("common.cancel", "Cancel")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
