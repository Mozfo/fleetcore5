"use client";

/**
 * LeadQuoteSection - Inline quotes section for Segment 4 leads
 *
 * V6.2-11: Shows quotes inline in lead detail for enterprise leads (Segment 4).
 * Segment 4 = fleet_size >= 21 vehicles (configurable via crm_settings)
 *
 * The standalone Quotes module is FROZEN (hidden via feature flags),
 * but enterprise leads get inline quote management.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import {
  FileText,
  Plus,
  Eye,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/crm";

// ============================================================
// TYPES
// ============================================================

interface Quote {
  id: string;
  quote_reference: string;
  quote_code: string | null;
  quote_version: number;
  status:
    | "draft"
    | "sent"
    | "viewed"
    | "accepted"
    | "rejected"
    | "expired"
    | "converted";
  total_value: number | null;
  currency: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

interface LeadQuoteSectionProps {
  lead: Lead;
  onQuoteCreated?: () => void;
}

// Segment 4 threshold (default, should be loaded from crm_settings)
const SEGMENT_4_MIN_FLEET = 21;

// Status configuration
const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> =
  {
    draft: {
      color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      icon: <FileText className="h-3 w-3" />,
    },
    sent: {
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      icon: <Send className="h-3 w-3" />,
    },
    viewed: {
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
      icon: <Eye className="h-3 w-3" />,
    },
    accepted: {
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      icon: <CheckCircle className="h-3 w-3" />,
    },
    rejected: {
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      icon: <XCircle className="h-3 w-3" />,
    },
    expired: {
      color:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      icon: <Clock className="h-3 w-3" />,
    },
    converted: {
      color:
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      icon: <CheckCircle className="h-3 w-3" />,
    },
  };

// ============================================================
// COMPONENT
// ============================================================

export function LeadQuoteSection({
  lead,
  onQuoteCreated: _onQuoteCreated,
}: LeadQuoteSectionProps) {
  const { t } = useTranslation(["crm", "common"]);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse fleet size to determine segment
  const fleetSize = parseInt(lead.fleet_size || "0", 10);
  const isSegment4 = fleetSize >= SEGMENT_4_MIN_FLEET;

  // Fetch quotes for this lead - MUST be called before any conditional returns (React Hooks rules)
  useEffect(() => {
    // Only fetch if Segment 4
    if (!isSegment4) {
      setIsLoading(false);
      return;
    }

    async function fetchQuotes() {
      setIsLoading(true);
      setError(null);
      try {
        // Fetch quotes filtered by lead_id
        const response = await fetch(
          `/api/v1/crm/quotes?lead_id=${lead.id}&limit=10`
        );
        const result = await response.json();

        if (result.success) {
          setQuotes(result.data || []);
        } else {
          setError(result.error?.message || "Failed to load quotes");
        }
      } catch {
        setError("Failed to load quotes");
      } finally {
        setIsLoading(false);
      }
    }

    void fetchQuotes();
  }, [lead.id, isSegment4]);

  // Only show for Segment 4 leads - AFTER all hooks
  if (!isSegment4) return null;

  // Format currency
  const formatCurrency = (value: number | null, currency: string) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(value);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Navigate to create new quote
  const handleCreateQuote = () => {
    router.push(`/${locale}/crm/quotes/new?lead_id=${lead.id}`);
  };

  // Navigate to view quote
  const handleViewQuote = (quoteId: string) => {
    router.push(`/${locale}/crm/quotes/${quoteId}`);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
          <FileText className="h-4 w-4 text-purple-600" />
          {t("crm:leads.quotes.section", "Quotes")}
          <Badge variant="secondary" className="ml-1 text-xs">
            {t("crm:leads.quotes.segment4", "Enterprise")}
          </Badge>
        </h3>
        <Button size="sm" variant="outline" onClick={handleCreateQuote}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          {t("crm:leads.quotes.create", "New Quote")}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      ) : quotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-3 rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-900 dark:text-gray-100">
            {t("crm:leads.quotes.noQuotes", "No quotes yet")}
          </p>
          <p className="text-muted-foreground mb-4 text-xs">
            {t(
              "crm:leads.quotes.noQuotesDesc",
              "Create a custom quote for this enterprise lead"
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {quotes.map((quote) => {
            const statusConfig =
              STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
            return (
              <div
                key={quote.id}
                className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {quote.quote_code || quote.quote_reference}
                    </span>
                    {quote.quote_version > 1 && (
                      <span className="text-xs text-gray-500">
                        v{quote.quote_version}
                      </span>
                    )}
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", statusConfig.color)}
                    >
                      <span className="mr-1">{statusConfig.icon}</span>
                      {t(`crm:quotes.status.${quote.status}`, quote.status)}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {formatCurrency(quote.total_value, quote.currency)}
                    </span>
                    <span>|</span>
                    <span>
                      {t("crm:leads.quotes.validUntil", "Valid until")}:{" "}
                      {formatDate(quote.valid_until)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewQuote(quote.id)}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
