/**
 * QuoteDetailClient - Client component for quote detail page
 *
 * Uses QuoteWithRelations type which includes:
 * - crm_quote_items: QuoteItem[]
 * - crm_opportunities?: { id, title, stage, status }
 * - crm_orders?: Array<{ id, order_reference, status }>
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Send,
  ArrowRight,
  Pencil,
  Trash,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  Package,
  Clock,
  Eye,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import { SendQuoteModal } from "./SendQuoteModal";
import { ConvertToOrderModal } from "./ConvertToOrderModal";
import { DeleteQuoteModal } from "./DeleteQuoteModal";
import type {
  QuoteWithRelations,
  Quote,
} from "@/lib/repositories/crm/quote.repository";

interface QuoteDetailClientProps {
  quote: QuoteWithRelations;
  locale: "en" | "fr";
}

export function QuoteDetailClient({ quote, locale }: QuoteDetailClientProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");

  // Local state for optimistic updates
  const [currentQuote, setCurrentQuote] = useState<QuoteWithRelations>(quote);

  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canSend = currentQuote.status === "draft";
  const canConvert = currentQuote.status === "accepted";
  const canEdit = currentQuote.status === "draft";
  const canDelete = currentQuote.status === "draft";

  // Format helpers
  const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return "€0";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "€0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currentQuote.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "—";
    const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
    return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Copy reference to clipboard
  const handleCopyReference = useCallback(() => {
    void navigator.clipboard.writeText(currentQuote.quote_reference);
    toast.success(t("quotes.detail.reference_copied", "Reference copied"));
  }, [currentQuote.quote_reference, t]);

  // Check if expiring soon
  const isExpiringSoon = () => {
    if (!currentQuote.valid_until || currentQuote.status !== "sent")
      return false;
    const validUntil = new Date(currentQuote.valid_until);
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  // Get items
  const items = currentQuote.crm_quote_items || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/crm/quotes`)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentQuote.quote_reference}
              </h1>
              <QuoteStatusBadge status={currentQuote.status} size="md" />
              {isExpiringSoon() && (
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                  {t("quotes.card.expiring_soon", "Expiring soon")}
                </span>
              )}
            </div>
            {currentQuote.quote_code && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {currentQuote.quote_code}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canSend && (
            <Button
              variant="outline"
              className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => setIsSendModalOpen(true)}
            >
              <Send className="h-4 w-4" />
              {t("quotes.actions.send", "Send")}
            </Button>
          )}
          {canConvert && (
            <Button
              variant="outline"
              className="gap-2 text-green-600 hover:bg-green-50 hover:text-green-700"
              onClick={() => setIsConvertModalOpen(true)}
            >
              <ArrowRight className="h-4 w-4" />
              {t("quotes.actions.convert", "Convert to Order")}
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              onClick={() =>
                router.push(`/${locale}/crm/quotes/${currentQuote.id}/edit`)
              }
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              {t("quotes.actions.edit", "Edit")}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outline"
              className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsDeleteModalOpen(true)}
            >
              <Trash className="h-4 w-4" />
              {t("quotes.actions.delete", "Delete")}
            </Button>
          )}
        </div>
      </motion.div>

      <Separator />

      {/* Main content grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Details */}
        <div className="space-y-6 md:col-span-2">
          {/* Value Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-5 w-5 text-green-600" />
                {t("quotes.detail.value", "Value")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.total_value", "Total Value")}
                  </p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(Number(currentQuote.total_value))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.monthly_value", "Monthly")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(
                      currentQuote.monthly_recurring_value
                        ? Number(currentQuote.monthly_recurring_value)
                        : null
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.annual_value", "Annual")}
                  </p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(
                      currentQuote.annual_recurring_value
                        ? Number(currentQuote.annual_recurring_value)
                        : null
                    )}
                  </p>
                </div>
              </div>
              {(currentQuote.discount_type ||
                Number(currentQuote.tax_rate) > 0) && (
                <>
                  <Separator className="my-4" />
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    {currentQuote.subtotal && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">
                          {t("quotes.detail.subtotal", "Subtotal")}
                        </p>
                        <p className="font-medium">
                          {formatCurrency(Number(currentQuote.subtotal))}
                        </p>
                      </div>
                    )}
                    {currentQuote.discount_amount &&
                      Number(currentQuote.discount_amount) > 0 && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            {t("quotes.detail.discount", "Discount")}
                          </p>
                          <p className="font-medium text-red-600">
                            -
                            {formatCurrency(
                              Number(currentQuote.discount_amount)
                            )}
                          </p>
                        </div>
                      )}
                    {currentQuote.tax_amount &&
                      Number(currentQuote.tax_amount) > 0 && (
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">
                            {t("quotes.detail.tax", "Tax")} (
                            {Number(currentQuote.tax_rate)}%)
                          </p>
                          <p className="font-medium">
                            {formatCurrency(Number(currentQuote.tax_amount))}
                          </p>
                        </div>
                      )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Line Items Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Package className="h-5 w-5 text-purple-600" />
                {t("quotes.detail.line_items", "Line Items")}
                {items.length > 0 && (
                  <span className="ml-auto text-sm font-normal text-gray-500">
                    {items.length} {t("quotes.detail.items", "items")}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="flex items-start justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-800"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </p>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {item.quantity} ×{" "}
                            {formatCurrency(Number(item.unit_price))}
                          </span>
                          {item.item_type && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-gray-800">
                              {item.item_type}
                            </span>
                          )}
                          {item.recurrence && (
                            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {item.recurrence}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(Number(item.line_total))}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  {t("quotes.detail.no_items", "No line items")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes Card */}
          {currentQuote.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-gray-600" />
                  {t("quotes.detail.notes", "Notes")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {currentQuote.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Terms Card */}
          {currentQuote.terms_and_conditions && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-5 w-5 text-gray-600" />
                  {t("quotes.detail.terms", "Terms & Conditions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {currentQuote.terms_and_conditions}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          {/* Dates Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-blue-600" />
                {t("quotes.detail.dates", "Dates")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.detail.valid_from", "Valid From")}
                </p>
                <p className="font-medium">
                  {formatDate(currentQuote.valid_from)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.detail.valid_until", "Valid Until")}
                </p>
                <p
                  className={
                    isExpiringSoon()
                      ? "font-medium text-orange-600 dark:text-orange-400"
                      : "font-medium"
                  }
                >
                  {formatDate(currentQuote.valid_until)}
                </p>
              </div>
              {currentQuote.contract_start_date && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.contract_start", "Contract Start")}
                  </p>
                  <p className="font-medium">
                    {formatDate(currentQuote.contract_start_date)}
                  </p>
                </div>
              )}
              {currentQuote.contract_duration_months && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.contract_duration", "Contract Duration")}
                  </p>
                  <p className="font-medium">
                    {currentQuote.contract_duration_months}{" "}
                    {t("quotes.detail.months", "months")}
                  </p>
                </div>
              )}
              <Separator />
              {currentQuote.sent_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.sent_at", "Sent")}
                  </p>
                  <p className="font-medium">
                    {formatDate(currentQuote.sent_at)}
                  </p>
                </div>
              )}
              {currentQuote.accepted_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.accepted_at", "Accepted")}
                  </p>
                  <p className="font-medium text-green-600 dark:text-green-400">
                    {formatDate(currentQuote.accepted_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Customer Card - Show opportunity info if available */}
          {currentQuote.crm_opportunities && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-5 w-5 text-indigo-600" />
                  {t("quotes.detail.opportunity", "Opportunity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.opportunity_title", "Title")}
                  </p>
                  <p className="font-medium">
                    {currentQuote.crm_opportunities.title}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.stage", "Stage")}
                  </p>
                  <p className="font-medium capitalize">
                    {currentQuote.crm_opportunities.stage}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.status", "Status")}
                  </p>
                  <p className="font-medium capitalize">
                    {currentQuote.crm_opportunities.status}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-purple-600" />
                {t("quotes.detail.tracking", "Tracking")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.detail.views", "Views")}
                </p>
                <p className="font-medium text-purple-600 dark:text-purple-400">
                  {currentQuote.view_count ?? 0}
                </p>
              </div>
              {currentQuote.first_viewed_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.first_viewed", "First Viewed")}
                  </p>
                  <p className="font-medium">
                    {formatDate(currentQuote.first_viewed_at)}
                  </p>
                </div>
              )}
              {currentQuote.last_viewed_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.last_viewed", "Last Viewed")}
                  </p>
                  <p className="font-medium">
                    {formatDate(currentQuote.last_viewed_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reference Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5 text-gray-600" />
                {t("quotes.detail.reference", "Reference")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.quote_ref", "Quote Ref")}
                  </p>
                  <p className="font-mono text-sm font-medium">
                    {currentQuote.quote_reference}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyReference}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("quotes.detail.created", "Created")}
                </p>
                <p className="font-medium">
                  {formatDate(currentQuote.created_at)}
                </p>
              </div>
              {currentQuote.updated_at && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("quotes.detail.updated", "Last Updated")}
                  </p>
                  <p className="font-medium">
                    {formatDate(currentQuote.updated_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <SendQuoteModal
        quote={currentQuote}
        isOpen={isSendModalOpen}
        onClose={() => setIsSendModalOpen(false)}
        onSuccess={(updatedQuote: Quote) => {
          setCurrentQuote({ ...currentQuote, ...updatedQuote });
          setIsSendModalOpen(false);
        }}
      />

      <ConvertToOrderModal
        quote={currentQuote}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={({ quote: updatedQuote }) => {
          setCurrentQuote({ ...currentQuote, ...updatedQuote });
          setIsConvertModalOpen(false);
          toast.success(t("quotes.detail.order_created", "Order created"));
        }}
      />

      <DeleteQuoteModal
        quote={currentQuote}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          router.push(`/${locale}/crm/quotes`);
        }}
      />
    </div>
  );
}
