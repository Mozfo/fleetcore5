/**
 * QuoteCalculations - Real-time calculation display for quotes
 *
 * Shows in real-time:
 * - Subtotal (sum of line items)
 * - Discount amount
 * - Tax amount
 * - Total
 * - Monthly recurring value
 * - Annual recurring value
 */

"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Calculator, TrendingUp, Calendar, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { QuoteLineItem } from "./QuoteItemsEditor";

interface QuoteCalculationsProps {
  items: QuoteLineItem[];
  discountType: "percentage" | "fixed" | null | undefined;
  discountValue: number | null | undefined;
  taxRate: number;
  currency: string;
  billingCycle?: "monthly" | "quarterly" | "annually" | "one_time";
}

export function QuoteCalculations({
  items,
  discountType,
  discountValue,
  taxRate,
  currency,
  billingCycle = "monthly",
}: QuoteCalculationsProps) {
  const { t } = useTranslation("crm");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Calculate all values
  const calculations = useMemo(() => {
    // Subtotal from items
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);

    // Separate recurring and one-time items
    const recurringItems = items.filter(
      (item) => item.recurrence === "recurring"
    );
    const oneTimeItems = items.filter((item) => item.recurrence === "one_time");

    const recurringSubtotal = recurringItems.reduce(
      (sum, item) => sum + item.total_price,
      0
    );
    const oneTimeSubtotal = oneTimeItems.reduce(
      (sum, item) => sum + item.total_price,
      0
    );

    // Discount calculation
    let discountAmount = 0;
    if (discountType && discountValue && discountValue > 0) {
      if (discountType === "percentage") {
        discountAmount = subtotal * (discountValue / 100);
      } else {
        discountAmount = discountValue;
      }
    }

    // After discount
    const afterDiscount = Math.max(0, subtotal - discountAmount);

    // Tax calculation
    const taxAmount = afterDiscount * (taxRate / 100);

    // Total
    const total = afterDiscount + taxAmount;

    // Calculate monthly and annual values based on billing cycle
    let monthlyRecurring = 0;
    let annualRecurring = 0;

    // Apply discount proportionally to recurring subtotal
    const discountRatio =
      subtotal > 0 ? (subtotal - discountAmount) / subtotal : 1;
    const adjustedRecurring = recurringSubtotal * discountRatio;
    const adjustedRecurringWithTax = adjustedRecurring * (1 + taxRate / 100);

    switch (billingCycle) {
      case "monthly":
        monthlyRecurring = adjustedRecurringWithTax;
        annualRecurring = adjustedRecurringWithTax * 12;
        break;
      case "quarterly":
        monthlyRecurring = adjustedRecurringWithTax / 3;
        annualRecurring = adjustedRecurringWithTax * 4;
        break;
      case "annually":
        monthlyRecurring = adjustedRecurringWithTax / 12;
        annualRecurring = adjustedRecurringWithTax;
        break;
      case "one_time":
        monthlyRecurring = 0;
        annualRecurring = 0;
        break;
    }

    return {
      subtotal,
      recurringSubtotal,
      oneTimeSubtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total,
      monthlyRecurring,
      annualRecurring,
      itemCount: items.length,
      recurringCount: recurringItems.length,
      oneTimeCount: oneTimeItems.length,
    };
  }, [items, discountType, discountValue, taxRate, billingCycle]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Calculator className="h-5 w-5 text-blue-600" />
          {t("quotes.calculations.title", "Quote Summary")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Item counts */}
        <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{t("quotes.calculations.items", "Items")}</span>
          <span>{calculations.itemCount}</span>
        </div>

        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            {t("quotes.calculations.subtotal", "Subtotal")}
          </span>
          <span className="font-medium">
            {formatCurrency(calculations.subtotal)}
          </span>
        </div>

        {/* Discount */}
        {calculations.discountAmount > 0 && (
          <div className="flex justify-between text-red-600 dark:text-red-400">
            <span className="text-sm">
              {t("quotes.calculations.discount", "Discount")}
              {discountType === "percentage" && ` (${discountValue}%)`}
            </span>
            <span className="font-medium">
              -{formatCurrency(calculations.discountAmount)}
            </span>
          </div>
        )}

        {/* Tax */}
        {taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              {t("quotes.calculations.tax", "Tax")} ({taxRate}%)
            </span>
            <span className="font-medium">
              {formatCurrency(calculations.taxAmount)}
            </span>
          </div>
        )}

        <Separator />

        {/* Total */}
        <div className="flex justify-between">
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {t("quotes.calculations.total", "Total")}
          </span>
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(calculations.total)}
          </span>
        </div>

        {/* Recurring values */}
        {calculations.recurringCount > 0 && billingCycle !== "one_time" && (
          <>
            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                {t("quotes.calculations.recurring", "Recurring Revenue")}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Monthly */}
                <div className="rounded-lg bg-purple-50 p-3 dark:bg-purple-900/20">
                  <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
                    <Calendar className="h-3 w-3" />
                    {t("quotes.calculations.monthly", "Monthly")}
                  </div>
                  <p className="mt-1 text-lg font-bold text-purple-700 dark:text-purple-300">
                    {formatCurrency(calculations.monthlyRecurring)}
                  </p>
                </div>

                {/* Annual */}
                <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <Calendar className="h-3 w-3" />
                    {t("quotes.calculations.annual", "Annual")}
                  </div>
                  <p className="mt-1 text-lg font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(calculations.annualRecurring)}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* One-time items note */}
        {calculations.oneTimeCount > 0 && (
          <div className="rounded-lg bg-gray-50 p-3 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {t(
                "quotes.calculations.one_time_items",
                "{{count}} one-time item(s)",
                {
                  count: calculations.oneTimeCount,
                }
              )}
              : {formatCurrency(calculations.oneTimeSubtotal)}
            </div>
          </div>
        )}

        {/* Empty state */}
        {calculations.itemCount === 0 && (
          <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {t(
              "quotes.calculations.add_items",
              "Add line items to see calculations"
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
