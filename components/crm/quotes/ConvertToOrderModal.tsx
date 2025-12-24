/**
 * ConvertToOrderModal - Confirmation modal for converting a quote to an order
 *
 * convertQuoteToOrderAction takes { quoteId, effectiveDate?, autoRenew?, notes? }
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Loader2, CheckCircle, Calendar } from "lucide-react";
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
import { toast } from "sonner";
import { convertQuoteToOrderAction } from "@/lib/actions/crm/quote.actions";
import type { Quote } from "@/lib/repositories/crm/quote.repository";

interface ConvertToOrderModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: { quote: Quote; orderId: string }) => void;
}

export function ConvertToOrderModal({
  quote,
  isOpen,
  onClose,
  onSuccess,
}: ConvertToOrderModalProps) {
  const { t } = useTranslation("crm");
  const [isLoading, setIsLoading] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<string>("");

  // Reset form when modal opens
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      } else {
        // Default to today's date
        setEffectiveDate(new Date().toISOString().split("T")[0]);
      }
    },
    [onClose]
  );

  // Handle convert
  const handleConvert = useCallback(async () => {
    if (!quote) return;

    setIsLoading(true);
    try {
      // convertQuoteToOrderAction takes an object with quoteId
      const result = await convertQuoteToOrderAction({
        quoteId: quote.id,
        autoRenew: false, // Default to false
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
      });

      if (result.success) {
        toast.success(
          t(
            "quotes.convert_modal.success",
            "Quote converted to order successfully"
          )
        );
        onSuccess?.({
          quote: result.data.quote,
          orderId: result.data.order.id,
        });
        onClose();
      } else {
        toast.error(
          result.error ||
            t("quotes.convert_modal.error", "Failed to convert quote")
        );
      }
    } catch {
      toast.error(t("quotes.convert_modal.error", "Failed to convert quote"));
    } finally {
      setIsLoading(false);
    }
  }, [quote, effectiveDate, t, onSuccess, onClose]);

  if (!quote) return null;

  const formatCurrency = (value: number | null) => {
    if (value === null) return "€0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: quote.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-green-600" />
            {t("quotes.convert_modal.title", "Convert to Order")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "quotes.convert_modal.description",
              "Create an order from this accepted quote"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quote summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {quote.quote_reference}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {quote.quote_code || "—"}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-3 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.convert_modal.total_value", "Total Value")}
                </p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    quote.total_value ? Number(quote.total_value) : null
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.convert_modal.monthly_value", "Monthly")}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(
                    quote.monthly_recurring_value
                      ? Number(quote.monthly_recurring_value)
                      : null
                  )}
                </p>
              </div>
            </div>

            {quote.contract_duration_months && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "quotes.convert_modal.contract_duration",
                    "Contract Duration"
                  )}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {quote.contract_duration_months}{" "}
                  {t("quotes.convert_modal.months", "months")}
                </p>
              </div>
            )}
          </div>

          {/* Effective date */}
          <div className="space-y-2">
            <Label htmlFor="effective-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              {t("quotes.convert_modal.effective_date", "Effective Date")}
            </Label>
            <Input
              id="effective-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(
                "quotes.convert_modal.effective_date_hint",
                "The date when the order becomes effective"
              )}
            </p>
          </div>

          {/* What will be created */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="mb-2 text-sm font-medium text-blue-700 dark:text-blue-400">
              {t("quotes.convert_modal.what_happens", "What happens next:")}
            </p>
            <ul className="space-y-1 text-xs text-blue-600 dark:text-blue-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                {t(
                  "quotes.convert_modal.order_created",
                  "A new order will be created"
                )}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                {t(
                  "quotes.convert_modal.quote_converted",
                  "This quote status will change to 'Converted'"
                )}
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3" />
                {t(
                  "quotes.convert_modal.items_copied",
                  "All line items will be copied to the order"
                )}
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={isLoading}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {t("quotes.convert_modal.convert_button", "Convert to Order")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
