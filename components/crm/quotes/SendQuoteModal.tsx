/**
 * SendQuoteModal - Confirmation modal for sending a quote
 *
 * The sendQuoteAction only takes the quoteId (no email/message params).
 * Email is sent to the opportunity's lead email automatically by the action.
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Send, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { sendQuoteAction } from "@/lib/actions/crm/quote.actions";
import type { Quote } from "@/lib/repositories/crm/quote.repository";

interface SendQuoteModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedQuote: Quote) => void;
}

export function SendQuoteModal({
  quote,
  isOpen,
  onClose,
  onSuccess,
}: SendQuoteModalProps) {
  const { t } = useTranslation("crm");
  const [isLoading, setIsLoading] = useState(false);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!quote) return;

    setIsLoading(true);
    try {
      // sendQuoteAction only takes quoteId
      const result = await sendQuoteAction(quote.id);

      if (result.success) {
        toast.success(
          t("quotes.send_modal.success", "Quote sent successfully")
        );
        onSuccess?.(result.data.quote);
        onClose();
      } else {
        toast.error(
          result.error || t("quotes.send_modal.error", "Failed to send quote")
        );
      }
    } catch {
      toast.error(t("quotes.send_modal.error", "Failed to send quote"));
    } finally {
      setIsLoading(false);
    }
  }, [quote, t, onSuccess, onClose]);

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            {t("quotes.send_modal.title", "Send Quote")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "quotes.send_modal.description",
              "Send this quote to the customer via email"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Quote summary */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {quote.quote_reference}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {quote.quote_code || "—"}
            </p>
            <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">
              {formatCurrency(
                quote.total_value ? Number(quote.total_value) : null
              )}
            </p>
          </div>

          {/* Info message */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
            <p className="text-xs text-blue-700 dark:text-blue-400">
              {t(
                "quotes.send_modal.info",
                "A unique public link will be generated for the customer to view and accept the quote."
              )}
            </p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" />
            <p className="text-xs text-orange-700 dark:text-orange-400">
              {t(
                "quotes.send_modal.warning",
                "Once sent, the quote status will change to 'Sent' and cannot be edited."
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSend} disabled={isLoading} className="gap-2">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t("quotes.send_modal.send_button", "Send Quote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
