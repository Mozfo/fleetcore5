/**
 * LeadDrawerHeader - Header for Lead Drawer
 *
 * B2B Best Practice: Lead code FIRST, then company-first design
 *
 * Layout:
 *   L-F74SF8  [📋]
 *   COMPANY_NAME 🇫🇷
 *   Contact Name
 *   [Status] [Stage] [Priority]
 *
 * Background tinted by pipeline status color.
 */

"use client";

import { motion } from "framer-motion";
import { ExternalLink, Building2, User, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getStatusBadgeColor,
  getStatusHeaderBg,
} from "@/lib/utils/status-colors";
import {
  drawerSectionVariants,
  badgeVariants,
} from "@/lib/animations/drawer-variants";
import type { Lead } from "@/types/crm";

interface LeadDrawerHeaderProps {
  lead: Lead;
  onOpenFullPage?: () => void;
}

function getCompanyInitials(companyName: string | null): string {
  if (!companyName) return "?";
  const words = companyName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return companyName[0].toUpperCase();
}

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

  const handleCopyCode = async () => {
    if (!lead.lead_code) return;
    try {
      await navigator.clipboard.writeText(lead.lead_code);
      toast.success(`${lead.lead_code} ${t("leads.drawer.actions.copied")}`);
    } catch {
      toast.error(t("leads.drawer.actions.copy_failed"));
    }
  };

  return (
    <motion.div
      variants={drawerSectionVariants}
      className={cn("space-y-4 rounded-lg p-4", getStatusHeaderBg(lead.status))}
    >
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

      {/* Lead Code — FIRST, prominent */}
      {lead.lead_code && (
        <div className="flex items-center gap-2">
          <span className="text-primary font-mono text-base font-semibold">
            {lead.lead_code}
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="text-muted-foreground hover:text-primary rounded p-1 transition-colors"
            title={t("leads.drawer.actions.copy")}
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* B2B Header: Company-first design */}
      <div className="flex items-start gap-4">
        {/* Company Avatar */}
        <div className="bg-primary text-primary-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-lg text-lg font-bold shadow-sm">
          {lead.company_name ? (
            getCompanyInitials(lead.company_name)
          ) : (
            <Building2 className="h-6 w-6" />
          )}
        </div>

        {/* Company Name + Contact */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Company Name */}
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
          {/* Contact Person */}
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
        {/* Status Badge — colored from centralized mapping */}
        <motion.div variants={badgeVariants}>
          <Badge
            variant="secondary"
            className={cn("text-xs", getStatusBadgeColor(lead.status))}
          >
            {t(`leads.status.${lead.status}`)}
          </Badge>
        </motion.div>

        {/* Stage Badge */}
        <motion.div variants={badgeVariants}>
          <Badge variant="outline" className="text-xs">
            {t(`leads.card.stage.${lead.lead_stage}`)}
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
      </motion.div>
    </motion.div>
  );
}
