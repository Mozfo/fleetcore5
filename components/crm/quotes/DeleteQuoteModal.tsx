/**
 * DeleteQuoteModal - Confirmation modal for deleting a quote
 *
 * deleteQuoteAction takes quoteId and returns { success, data: { quoteId, deletedAt } }
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Trash, Loader2, AlertTriangle } from "lucide-react";
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
import { deleteQuoteAction } from "@/lib/actions/crm/quote.actions";
import type { Quote } from "@/lib/repositories/crm/quote.repository";

interface DeleteQuoteModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (deletedQuoteId: string) => void;
}

export function DeleteQuoteModal({
  quote,
  isOpen,
  onClose,
  onSuccess,
}: DeleteQuoteModalProps) {
  const { t } = useTranslation("crm");
  const [isLoading, setIsLoading] = useState(false);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!quote) return;

    setIsLoading(true);
    try {
      const result = await deleteQuoteAction(quote.id);

      if (result.success) {
        toast.success(
          t("quotes.delete_modal.success", "Quote deleted successfully")
        );
        onSuccess?.(quote.id);
        onClose();
      } else {
        toast.error(
          result.error ||
            t("quotes.delete_modal.error", "Failed to delete quote")
        );
      }
    } catch {
      toast.error(t("quotes.delete_modal.error", "Failed to delete quote"));
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
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash className="h-5 w-5" />
            {t("quotes.delete_modal.title", "Delete Quote")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "quotes.delete_modal.description",
              "Are you sure you want to delete this quote? This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Quote summary */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div className="flex-1">
                <p className="font-medium text-red-900 dark:text-red-100">
                  {quote.quote_reference}
                </p>
                {quote.quote_code && (
                  <p className="text-sm text-red-700 dark:text-red-300">
                    {quote.quote_code}
                  </p>
                )}
                <p className="mt-1 text-lg font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(
                    quote.total_value ? Number(quote.total_value) : null
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            {t("quotes.delete_modal.delete_button", "Delete Quote")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
