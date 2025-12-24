/**
 * QuotesTableRow - Row de table pour une quote avec actions hover
 * Basé sur OpportunitiesTableRow.tsx - même pattern
 *
 * Note: Uses base Quote type. Relations like opportunity/items not available here.
 */

"use client";

import {
  type ReactNode,
  cloneElement,
  isValidElement,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  Eye,
  MoreHorizontal,
  Send,
  ArrowRight,
  Trash,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { QuoteStatusBadge } from "./QuoteStatusBadge";
import type { Quote } from "@/lib/repositories/crm/quote.repository";
import type { QuoteColumnConfig } from "@/lib/config/quotes-columns";

interface QuotesTableRowProps {
  quote: Quote;
  columns: QuoteColumnConfig[];
  isSelected: boolean;
  onClick: () => void;
  onSelect: () => void;
  onSend: () => void;
  onConvert: () => void;
  onDelete: () => void;
}

/**
 * Formate le temps relatif (ex: "2h ago")
 */
function formatTimeAgo(
  dateValue: Date | string | null | undefined,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
  if (!dateValue) return "—";
  const now = new Date();
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t("leads.time.just_now");
  if (seconds < 3600)
    return t("leads.time.minutes_ago", { count: Math.floor(seconds / 60) });
  if (seconds < 86400)
    return t("leads.time.hours_ago", { count: Math.floor(seconds / 3600) });
  if (seconds < 604800)
    return t("leads.time.days_ago", { count: Math.floor(seconds / 86400) });
  return t("leads.time.weeks_ago", { count: Math.floor(seconds / 604800) });
}

/**
 * Formate une date en format court
 */
function formatDate(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "—";
  const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Formate une valeur monétaire
 */
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

export const QuotesTableRow = memo(
  function QuotesTableRow({
    quote,
    columns,
    isSelected,
    onClick,
    onSelect,
    onSend,
    onConvert,
    onDelete,
  }: QuotesTableRowProps) {
    const { t } = useTranslation("crm");

    // Click delay mechanism to distinguish single click from double click
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const CLICK_DELAY = 250;

    const handleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        onClick();
        clickTimeoutRef.current = null;
      }, CLICK_DELAY);
    }, [onClick]);

    const canSend = quote.status === "draft";
    const canConvert = quote.status === "accepted";
    const canDelete = quote.status === "draft";

    // Check if expiring soon (within 7 days)
    const isExpiringSoon = () => {
      if (!quote.valid_until || quote.status !== "sent") return false;
      const validUntil = new Date(quote.valid_until);
      const daysUntilExpiry = Math.ceil(
        (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    };

    // Cell renderers for each column type
    const cellRenderers: Record<string, () => ReactNode> = {
      checkbox: () => (
        <TableCell className="w-[40px]">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${quote.quote_reference}`}
          />
        </TableCell>
      ),

      quote_reference: () => (
        <TableCell className="w-[160px] overflow-hidden">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-gray-400" />
            <div className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">
                {quote.quote_reference}
              </span>
              {quote.quote_code && (
                <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                  {quote.quote_code}
                </span>
              )}
            </div>
          </div>
        </TableCell>
      ),

      // Note: company_name column key is mapped but Quote base type doesn't have relations
      // This would need QuoteWithRelations type to work properly
      company_name: () => (
        <TableCell className="w-[180px] overflow-hidden">
          <span className="text-sm text-gray-500">—</span>
        </TableCell>
      ),

      total_value: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <div className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
            <DollarSign className="h-3.5 w-3.5" />
            {formatCurrency(
              quote.total_value ? Number(quote.total_value) : null,
              quote.currency || "EUR"
            )}
          </div>
        </TableCell>
      ),

      monthly_recurring_value: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(
              quote.monthly_recurring_value
                ? Number(quote.monthly_recurring_value)
                : null,
              quote.currency || "EUR"
            )}
          </span>
        </TableCell>
      ),

      annual_recurring_value: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {formatCurrency(
              quote.annual_recurring_value
                ? Number(quote.annual_recurring_value)
                : null,
              quote.currency || "EUR"
            )}
          </span>
        </TableCell>
      ),

      status: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <QuoteStatusBadge status={quote.status} />
        </TableCell>
      ),

      valid_until: () => (
        <TableCell className="w-[130px] overflow-hidden">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <span
              className={cn(
                "truncate text-sm",
                isExpiringSoon() && "text-orange-600 dark:text-orange-400"
              )}
            >
              {formatDate(quote.valid_until)}
            </span>
          </div>
        </TableCell>
      ),

      valid_from: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(quote.valid_from)}
          </span>
        </TableCell>
      ),

      billing_cycle: () => (
        <TableCell className="w-[100px] overflow-hidden">
          <span className="text-sm capitalize">
            {quote.billing_cycle
              ? t(`quotes.billing.${quote.billing_cycle}`, quote.billing_cycle)
              : "—"}
          </span>
        </TableCell>
      ),

      currency: () => (
        <TableCell className="w-[80px] overflow-hidden">
          <span className="text-sm">{quote.currency || "EUR"}</span>
        </TableCell>
      ),

      view_count: () => (
        <TableCell className="w-[80px] overflow-hidden">
          <span
            className={cn(
              "text-sm",
              quote.view_count && quote.view_count > 0
                ? "text-purple-600 dark:text-purple-400"
                : "text-gray-400"
            )}
          >
            {quote.view_count ?? 0}
          </span>
        </TableCell>
      ),

      sent_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(quote.sent_at)}
          </span>
        </TableCell>
      ),

      accepted_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatDate(quote.accepted_at)}
          </span>
        </TableCell>
      ),

      created_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatTimeAgo(quote.created_at, t)}
          </span>
        </TableCell>
      ),

      updated_at: () => (
        <TableCell className="w-[120px] overflow-hidden">
          <span className="block truncate text-sm">
            {formatTimeAgo(quote.updated_at, t)}
          </span>
        </TableCell>
      ),

      actions: () => (
        <TableCell className="w-[140px]">
          <div
            className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
              title={t("quotes.actions.view", "View")}
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canSend && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSend();
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {t("quotes.actions.send", "Send")}
                  </DropdownMenuItem>
                )}
                {canConvert && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onConvert();
                    }}
                    className="text-green-600 focus:text-green-600"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {t("quotes.actions.convert", "Convert to Order")}
                  </DropdownMenuItem>
                )}
                {(canSend || canConvert) && canDelete && (
                  <DropdownMenuSeparator />
                )}
                {canDelete && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    {t("quotes.actions.delete", "Delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      ),
    };

    // Render cells based on columns config
    const renderCells = () => {
      return columns.map((col) => {
        const renderer = cellRenderers[col.key];
        if (!renderer) return null;
        const cell = renderer();
        if (isValidElement(cell)) {
          return cloneElement(cell as React.ReactElement<{ key?: string }>, {
            key: col.key,
          });
        }
        return null;
      });
    };

    return (
      <TableRow
        className={cn(
          "group cursor-pointer",
          isSelected && "bg-primary/5",
          isExpiringSoon() && "bg-orange-50/50 dark:bg-orange-900/10"
        )}
        onClick={handleClick}
      >
        {renderCells()}
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.quote.id === nextProps.quote.id &&
      prevProps.quote.status === nextProps.quote.status &&
      prevProps.quote.updated_at === nextProps.quote.updated_at &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.columns.length === nextProps.columns.length
    );
  }
);
