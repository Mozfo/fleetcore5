/**
 * QuotesKanbanCard - Card component for Kanban view
 */

"use client";

import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "date-fns";
import {
  MoreHorizontal,
  Send,
  ArrowRight,
  Trash2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Quote } from "@/lib/repositories/crm/quote.repository";

interface QuotesKanbanCardProps {
  quote: Quote;
  onClick: () => void;
  onSend: () => void;
  onConvert: () => void;
  onDelete: () => void;
}

export function QuotesKanbanCard({
  quote,
  onClick,
  onSend,
  onConvert,
  onDelete,
}: QuotesKanbanCardProps) {
  const { t } = useTranslation("crm");

  const formatCurrency = (value: number | null) => {
    if (value === null) return "€0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: quote.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const isExpiringSoon = () => {
    if (!quote.valid_until || quote.status !== "sent") return false;
    const validUntil = new Date(quote.valid_until);
    const daysUntilExpiry = Math.ceil(
      (validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const canSend = quote.status === "draft";
  const canConvert = quote.status === "accepted";
  const canDelete = quote.status === "draft";

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-fc-lg border-fc-border-light hover:border-fc-border-medium hover:shadow-fc-md cursor-pointer border bg-white p-3 transition-all dark:border-gray-700 dark:bg-gray-900",
        isExpiringSoon() && "border-fc-warning-500/50 dark:border-orange-700"
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1 truncate">
          <p className="text-fc-text-primary truncate text-sm font-medium dark:text-white">
            {quote.quote_reference}
          </p>
          {quote.quote_code && (
            <p className="text-fc-text-muted truncate text-xs dark:text-gray-400">
              {quote.quote_code}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
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
              >
                <ArrowRight className="mr-2 h-4 w-4" />
                {t("quotes.actions.convert", "Convert to Order")}
              </DropdownMenuItem>
            )}
            {(canSend || canConvert) && <DropdownMenuSeparator />}
            {canDelete && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-600 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("quotes.actions.delete", "Delete")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Value */}
      <div className="mb-2">
        <p className="text-fc-text-primary text-lg font-semibold dark:text-white">
          {formatCurrency(quote.total_value ? Number(quote.total_value) : null)}
        </p>
      </div>

      {/* Footer */}
      <div className="text-fc-text-muted flex items-center justify-between text-xs dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>
            {quote.valid_until
              ? formatDistanceToNow(new Date(quote.valid_until), {
                  addSuffix: true,
                })
              : "-"}
          </span>
        </div>
        {quote.view_count !== null && quote.view_count > 0 && (
          <span className="text-purple-600 dark:text-purple-400">
            {quote.view_count} {t("quotes.card.views", "views")}
          </span>
        )}
      </div>

      {/* Expiring soon warning */}
      {isExpiringSoon() && (
        <div className="bg-fc-warning-50 text-fc-warning-600 mt-2 rounded px-2 py-1 text-xs dark:bg-orange-900/30 dark:text-orange-400">
          {t("quotes.card.expiring_soon", "Expiring soon")}
        </div>
      )}
    </div>
  );
}
