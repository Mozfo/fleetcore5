"use client";

/**
 * OpportunityDrawerHeader - Header for Opportunity Drawer
 *
 * B2B Best Practice: Company-first design (via lead relation)
 *
 * Displays:
 * - Company avatar (first letter of company name from lead)
 * - Company name (prominent) + Country flag
 * - Contact person name (secondary)
 * - Stage badge, Status badge, Value badge
 * - Rotting indicator if deal is stale
 * - Open full page button
 */

import { motion } from "framer-motion";
import {
  ExternalLink,
  Building2,
  User,
  AlertTriangle,
  Trophy,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  drawerSectionVariants,
  badgeVariants,
} from "@/lib/animations/drawer-variants";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import type { Opportunity } from "@/types/crm";

interface OpportunityDrawerHeaderProps {
  opportunity: Opportunity & { days_in_stage?: number; is_rotting?: boolean };
  onOpenFullPage?: () => void;
}

/**
 * Get initials from company name (B2B-first approach)
 */
function getCompanyInitials(companyName: string | null): string {
  if (!companyName) return "?";
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return companyName[0].toUpperCase();
}

/**
 * Tailwind class map for stage colors
 */
const STAGE_COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  yellow:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  orange:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  gray: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

/**
 * Format currency value
 */
function formatValue(value: number | null, currency: string = "EUR"): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function OpportunityDrawerHeader({
  opportunity,
  onOpenFullPage,
}: OpportunityDrawerHeaderProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { getLabel, getColor } = useOpportunityStages();

  const lead = opportunity.lead;
  const contactName = lead
    ? [lead.first_name, lead.last_name].filter(Boolean).join(" ")
    : t("opportunity.card.unknown");
  const companyName = lead?.company_name || t("opportunity.card.unknown");

  const isWon = opportunity.status === "won";
  const isLost = opportunity.status === "lost";
  const isOpen = opportunity.status === "open";

  return (
    <motion.div variants={drawerSectionVariants} className="space-y-4">
      {/* Top row: Open full page button */}
      <div className="flex items-center justify-end">
        {onOpenFullPage && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-2"
            onClick={onOpenFullPage}
          >
            {t("opportunity.drawer.open_full_page")}
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* B2B Header: Company-first design */}
      <div className="flex items-start gap-4">
        {/* Company Avatar */}
        <div
          className={cn(
            "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold text-white shadow-sm",
            isWon
              ? "bg-gradient-to-br from-green-500 to-green-600"
              : isLost
                ? "bg-gradient-to-br from-gray-400 to-gray-500"
                : "bg-gradient-to-br from-blue-500 to-blue-600"
          )}
        >
          {lead?.company_name ? (
            getCompanyInitials(lead.company_name)
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>

        {/* Company Name (Primary) + Contact (Secondary) */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Company Name - Primary */}
          <div className="flex items-center gap-2">
            <h2 className="truncate text-xl font-semibold">{companyName}</h2>
            {lead?.country && (
              <span
                className="shrink-0 text-lg"
                title={lead.country.country_name_en}
              >
                {lead.country.flag_emoji}
              </span>
            )}
            {/* Won/Lost icon */}
            {isWon && <Trophy className="h-5 w-5 shrink-0 text-green-600" />}
            {isLost && <XCircle className="h-5 w-5 shrink-0 text-gray-500" />}
          </div>
          {/* Contact Person - Secondary */}
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <User className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contactName}</span>
          </div>
        </div>
      </div>

      {/* Badges row */}
      <motion.div
        className="flex flex-wrap items-center gap-2"
        variants={drawerSectionVariants}
      >
        {/* Stage Badge - only for open opportunities */}
        {isOpen && (
          <motion.div variants={badgeVariants}>
            <Badge
              className={cn(
                "text-xs",
                STAGE_COLOR_CLASSES[getColor(opportunity.stage)] ||
                  STAGE_COLOR_CLASSES.gray
              )}
            >
              {getLabel(opportunity.stage, "en")}
            </Badge>
          </motion.div>
        )}

        {/* Status Badge */}
        <motion.div variants={badgeVariants}>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              isWon &&
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              isLost &&
                "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
              isOpen &&
                "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
            )}
          >
            {t(`opportunity.status.${opportunity.status}`)}
          </Badge>
        </motion.div>

        {/* Value Badge */}
        <motion.div variants={badgeVariants}>
          <Badge variant="outline" className="text-xs font-medium">
            {isWon
              ? formatValue(
                  opportunity.won_value,
                  opportunity.currency || "EUR"
                )
              : formatValue(
                  opportunity.expected_value,
                  opportunity.currency || "EUR"
                )}
          </Badge>
        </motion.div>

        {/* Probability Badge - only for open */}
        {isOpen && opportunity.probability_percent !== null && (
          <motion.div variants={badgeVariants}>
            <Badge variant="outline" className="text-xs">
              {opportunity.probability_percent}%
            </Badge>
          </motion.div>
        )}

        {/* Rotting Indicator */}
        {isOpen && opportunity.is_rotting && (
          <motion.div variants={badgeVariants}>
            <Badge
              variant="destructive"
              className="gap-1 bg-orange-100 text-xs text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
            >
              <AlertTriangle className="h-3 w-3" />
              {t("opportunity.card.rotting")}
            </Badge>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
