/**
 * LeadDrawerHeader - Header for Lead Drawer
 *
 * B2B Best Practice: Company-first design
 * @see https://www.eleken.co/blog-posts/how-to-design-a-crm-system-all-you-need-to-know-about-custom-crm
 * @see https://support.pipedrive.com/en/article/leads-inbox
 *
 * Displays:
 * - Company avatar (first letter of company name)
 * - Company name (prominent) + Country
 * - Contact person name (secondary)
 * - Stage, Score, and Priority badges
 * - Open full page button
 */

"use client";

import { motion } from "framer-motion";
import { ExternalLink, Building2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  drawerSectionVariants,
  badgeVariants,
} from "@/lib/animations/drawer-variants";
import type { Lead } from "@/types/crm";

interface LeadDrawerHeaderProps {
  lead: Lead;
  onOpenFullPage?: () => void;
}

/**
 * Get initials from company name (B2B-first approach)
 */
function getCompanyInitials(companyName: string | null): string {
  if (!companyName) return "?";
  // Get first letters of first two words, or just first letter
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return companyName[0].toUpperCase();
}

/**
 * Get score color based on value
 */
function getScoreColor(score: number | null): string {
  if (score === null)
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  if (score < 40)
    return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  if (score < 70)
    return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
  return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
}

/**
 * Get priority badge variant
 */
function getPriorityVariant(
  priority: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "secondary";
  return "outline";
}

export function LeadDrawerHeader({
  lead,
  onOpenFullPage,
}: LeadDrawerHeaderProps) {
  const { t } = useTranslation("crm");

  const contactName =
    [lead.first_name, lead.last_name].filter(Boolean).join(" ") ||
    t("leads.drawer.empty.unknown_contact");
  const companyName =
    lead.company_name || t("leads.drawer.empty.unknown_company");

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
            {t("leads.drawer.open_full_page")}
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* B2B Header: Company-first design */}
      <div className="flex items-start gap-4">
        {/* Company Avatar - Building icon or initials */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-lg font-bold text-white shadow-sm">
          {lead.company_name ? (
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
            {lead.country && (
              <span
                className="shrink-0 text-lg"
                title={lead.country.country_name_en}
              >
                {lead.country.flag_emoji}
              </span>
            )}
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
        {/* Stage Badge */}
        <motion.div variants={badgeVariants}>
          <Badge variant="outline" className="text-xs">
            {t(`leads.card.stage.${lead.lead_stage}`)}
          </Badge>
        </motion.div>

        {/* Score Badge */}
        <motion.div variants={badgeVariants}>
          <Badge
            className={cn(
              "text-xs font-medium",
              getScoreColor(lead.qualification_score)
            )}
          >
            {lead.qualification_score !== null
              ? `${lead.qualification_score}/100`
              : "—"}
          </Badge>
        </motion.div>

        {/* Priority Badge */}
        {lead.priority && (
          <motion.div variants={badgeVariants}>
            <Badge
              variant={getPriorityVariant(lead.priority)}
              className="text-xs"
            >
              {t(`leads.card.priority.${lead.priority}`)}
            </Badge>
          </motion.div>
        )}

        {/* Status Badge */}
        <motion.div variants={badgeVariants}>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              lead.status === "qualified" &&
                "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
              lead.status === "lost" &&
                "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {t(`leads.columns.${lead.status}`)}
          </Badge>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
