/**
 * QuoteDrawer - Main drawer component for quote quick view
 *
 * Opens on quote click (single click = drawer)
 * Features:
 * - Read-only sections displaying quote data
 * - Send, Convert to Order, Delete actions
 *
 * Uses QuoteWithRelations type for full data including items and opportunity.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Send,
  ArrowRight,
  Trash,
  DollarSign,
  Calendar,
  FileText,
  Copy,
  Eye,
  Clock,
  Loader2,
  Package,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import {
  drawerContainerVariants,
  drawerSectionVariants,
} from "@/lib/animations/drawer-variants";
import type {
  Quote,
  QuoteWithRelations,
} from "@/lib/repositories/crm/quote.repository";
import type { LucideIcon } from "lucide-react";

// Extended Quote type that may include relations (for drawer display)
type QuoteForDrawer = Quote | QuoteWithRelations;

interface QuoteDrawerProps {
  quote: QuoteForDrawer | null;
  isOpen: boolean;
  onClose: () => void;
  onSend?: (quote: QuoteForDrawer) => void;
  onConvert?: (quote: QuoteForDrawer) => void;
  onDelete?: (quote: QuoteForDrawer) => void;
  onOpenFullPage?: (id: string) => void;
  isLoading?: boolean;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function DrawerSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Badges skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      <Separator />

      {/* Sections skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

interface DrawerSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  visible?: boolean;
}

function DrawerSection({
  icon: Icon,
  title,
  children,
  visible = true,
}: DrawerSectionProps) {
  if (!visible) return null;

  return (
    <motion.div variants={drawerSectionVariants} className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        {children}
      </div>
      <Separator className="mt-4" />
    </motion.div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
  }>;
  emptyText?: string;
  className?: string;
}

function InfoRow({
  label,
  value,
  actions,
  emptyText = "—",
  className,
}: InfoRowProps) {
  const displayValue =
    value !== null && value !== undefined ? String(value) : emptyText;
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            isEmpty && "text-muted-foreground italic"
          )}
        >
          {displayValue}
        </p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            return (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                onClick={action.onClick}
                title={action.label}
              >
                <ActionIcon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(
  value: number | null,
  currency: string = "EUR"
): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | Date | null): string {
  if (!dateStr) return "—";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteDrawer({
  quote,
  isOpen,
  onClose,
  onSend,
  onConvert,
  onDelete,
  onOpenFullPage,
  isLoading = false,
}: QuoteDrawerProps) {
  const { t } = useTranslation("crm");

  // Current quote state (for local updates)
  const [currentQuote, setCurrentQuote] = useState(quote);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync current quote with prop
  useEffect(() => {
    setCurrentQuote(quote);
  }, [quote]);

  // Reset states when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsDeleting(false);
    }
  }, [isOpen]);

  // Copy reference to clipboard
  const handleCopyReference = useCallback(() => {
    if (currentQuote?.quote_reference) {
      void navigator.clipboard.writeText(currentQuote.quote_reference);
      toast.success(t("quotes.drawer.reference_copied", "Reference copied"));
    }
  }, [currentQuote, t]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!currentQuote || !onDelete) return;

    if (
      !confirm(
        t(
          "quotes.delete_modal.description",
          "Are you sure you want to delete this quote?"
        )
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      onDelete(currentQuote);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }, [currentQuote, onDelete, onClose, t]);

  const canSend = currentQuote?.status === "draft";
  const canConvert = currentQuote?.status === "accepted";
  const canDelete = currentQuote?.status === "draft";

  // Check if expiring soon
  const isExpiringSoon = () => {
    if (!currentQuote?.valid_until || currentQuote.status !== "sent")
      return false;
    const validUntil = new Date(currentQuote.valid_until);
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-lg"
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden.Root>
          <SheetTitle>
            {currentQuote?.quote_reference || "Quote Details"}
          </SheetTitle>
          <SheetDescription>Quick view of quote information</SheetDescription>
        </VisuallyHidden.Root>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <DrawerSkeleton />
          ) : currentQuote ? (
            <motion.div
              variants={drawerContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6 py-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {currentQuote.quote_reference}
                    </h2>
                    {currentQuote.quote_code && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {currentQuote.quote_code}
                      </p>
                    )}
                  </div>
                </div>
                {onOpenFullPage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onOpenFullPage(currentQuote.id)}
                    className="shrink-0"
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    {t("quotes.drawer.view_full", "Full view")}
                  </Button>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap items-center gap-2">
                <QuoteStatusBadge status={currentQuote.status} size="md" />
                {isExpiringSoon() && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                    {t("quotes.card.expiring_soon", "Expiring soon")}
                  </span>
                )}
                {currentQuote.view_count !== null &&
                  currentQuote.view_count > 0 && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {currentQuote.view_count}{" "}
                      {t("quotes.card.views", "views")}
                    </span>
                  )}
              </div>

              <Separator />

              {/* Value Section */}
              <DrawerSection
                icon={DollarSign}
                title={t("quotes.drawer.sections.value", "Value")}
              >
                <InfoRow
                  label={t("quotes.drawer.fields.total_value", "Total Value")}
                  value={formatCurrency(
                    currentQuote.total_value
                      ? Number(currentQuote.total_value)
                      : null,
                    currentQuote.currency || "EUR"
                  )}
                />
                <InfoRow
                  label={t(
                    "quotes.drawer.fields.monthly_value",
                    "Monthly Value"
                  )}
                  value={formatCurrency(
                    currentQuote.monthly_recurring_value
                      ? Number(currentQuote.monthly_recurring_value)
                      : null,
                    currentQuote.currency || "EUR"
                  )}
                />
                <InfoRow
                  label={t("quotes.drawer.fields.annual_value", "Annual Value")}
                  value={formatCurrency(
                    currentQuote.annual_recurring_value
                      ? Number(currentQuote.annual_recurring_value)
                      : null,
                    currentQuote.currency || "EUR"
                  )}
                />
                <InfoRow
                  label={t(
                    "quotes.drawer.fields.billing_cycle",
                    "Billing Cycle"
                  )}
                  value={
                    currentQuote.billing_cycle
                      ? t(
                          `quotes.billing.${currentQuote.billing_cycle}`,
                          currentQuote.billing_cycle
                        )
                      : null
                  }
                />
              </DrawerSection>

              {/* Dates Section */}
              <DrawerSection
                icon={Calendar}
                title={t("quotes.drawer.sections.dates", "Dates")}
              >
                <InfoRow
                  label={t("quotes.drawer.fields.valid_from", "Valid From")}
                  value={formatDate(currentQuote.valid_from)}
                />
                <InfoRow
                  label={t("quotes.drawer.fields.valid_until", "Valid Until")}
                  value={formatDate(currentQuote.valid_until)}
                  className={
                    isExpiringSoon()
                      ? "text-orange-600 dark:text-orange-400"
                      : undefined
                  }
                />
                {currentQuote.contract_start_date && (
                  <InfoRow
                    label={t(
                      "quotes.drawer.fields.contract_start",
                      "Contract Start"
                    )}
                    value={formatDate(currentQuote.contract_start_date)}
                  />
                )}
                {currentQuote.contract_duration_months && (
                  <InfoRow
                    label={t(
                      "quotes.drawer.fields.contract_duration",
                      "Contract Duration"
                    )}
                    value={`${currentQuote.contract_duration_months} ${t("quotes.drawer.months", "months")}`}
                  />
                )}
                {currentQuote.sent_at && (
                  <InfoRow
                    label={t("quotes.drawer.fields.sent_at", "Sent At")}
                    value={formatDate(currentQuote.sent_at)}
                  />
                )}
                {currentQuote.accepted_at && (
                  <InfoRow
                    label={t("quotes.drawer.fields.accepted_at", "Accepted At")}
                    value={formatDate(currentQuote.accepted_at)}
                  />
                )}
              </DrawerSection>

              {/* Opportunity Section - only if relations loaded */}
              {"crm_opportunities" in currentQuote &&
                currentQuote.crm_opportunities && (
                  <DrawerSection
                    icon={FileText}
                    title={t(
                      "quotes.drawer.sections.opportunity",
                      "Opportunity"
                    )}
                  >
                    <InfoRow
                      label={t(
                        "quotes.drawer.fields.opportunity_title",
                        "Title"
                      )}
                      value={currentQuote.crm_opportunities.title}
                    />
                    <InfoRow
                      label={t(
                        "quotes.drawer.fields.opportunity_stage",
                        "Stage"
                      )}
                      value={currentQuote.crm_opportunities.stage}
                    />
                  </DrawerSection>
                )}

              {/* Items Section - only if relations loaded */}
              {"crm_quote_items" in currentQuote &&
                currentQuote.crm_quote_items &&
                currentQuote.crm_quote_items.length > 0 && (
                  <DrawerSection
                    icon={Package}
                    title={t("quotes.drawer.sections.items", "Line Items")}
                  >
                    <div className="space-y-2">
                      {currentQuote.crm_quote_items
                        .slice(0, 5)
                        .map((item, index) => (
                          <div
                            key={item.id || index}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="truncate text-gray-700 dark:text-gray-300">
                              {item.name}
                            </span>
                            <span className="font-medium">
                              {formatCurrency(
                                item.line_total
                                  ? Number(item.line_total)
                                  : null,
                                currentQuote.currency || "EUR"
                              )}
                            </span>
                          </div>
                        ))}
                      {currentQuote.crm_quote_items.length > 5 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          +{currentQuote.crm_quote_items.length - 5}{" "}
                          {t("quotes.drawer.more_items", "more items")}
                        </p>
                      )}
                    </div>
                  </DrawerSection>
                )}

              {/* Reference Section */}
              <DrawerSection
                icon={Clock}
                title={t("quotes.drawer.sections.reference", "Reference")}
              >
                <InfoRow
                  label={t("quotes.drawer.fields.reference", "Quote Reference")}
                  value={currentQuote.quote_reference}
                  actions={[
                    {
                      icon: Copy,
                      label: "Copy reference",
                      onClick: handleCopyReference,
                    },
                  ]}
                />
                <InfoRow
                  label={t("quotes.drawer.fields.created_at", "Created")}
                  value={formatDate(currentQuote.created_at)}
                />
                {currentQuote.updated_at && (
                  <InfoRow
                    label={t("quotes.drawer.fields.updated_at", "Last Updated")}
                    value={formatDate(currentQuote.updated_at)}
                  />
                )}
              </DrawerSection>

              {/* Notes Section */}
              <DrawerSection
                icon={FileText}
                title={t("quotes.drawer.sections.notes", "Notes")}
                visible={!!currentQuote.notes}
              >
                <p className="text-sm whitespace-pre-wrap">
                  {currentQuote.notes}
                </p>
              </DrawerSection>
            </motion.div>
          ) : null}
        </div>

        {/* Footer with action buttons */}
        {currentQuote && !isLoading && (
          <div className="mt-auto border-t pt-4">
            <div className="flex flex-wrap gap-2">
              {/* Send - Only for draft quotes */}
              {canSend && onSend && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                  onClick={() => onSend(currentQuote)}
                >
                  <Send className="h-4 w-4" />
                  {t("quotes.actions.send", "Send")}
                </Button>
              )}

              {/* Convert to Order - Only for accepted quotes */}
              {canConvert && onConvert && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950"
                  onClick={() => onConvert(currentQuote)}
                >
                  <ArrowRight className="h-4 w-4" />
                  {t("quotes.actions.convert", "Convert to Order")}
                </Button>
              )}

              {/* Delete - Only for draft quotes */}
              {canDelete && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash className="h-4 w-4" />
                  )}
                  {t("quotes.actions.delete", "Delete")}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
