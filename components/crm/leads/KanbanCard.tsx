/**
 * KanbanCard - Card lead style Linear (dense, hover premium)
 * Affiche: company, contact, score, fleet, priority, owner, time
 */

"use client";

import { motion } from "framer-motion";
import { Building2, Car, ArrowRight, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types/crm";
import { cardHoverVariants } from "@/lib/animations/kanban-variants";

interface KanbanCardProps {
  lead: Lead;
  onClick?: () => void;
}

/**
 * Retourne les initiales d'un nom complet
 */
function getInitials(assigned: {
  first_name: string;
  last_name: string | null;
}) {
  const first = assigned.first_name?.[0]?.toUpperCase() || "";
  const last = assigned.last_name?.[0]?.toUpperCase() || "";
  return `${first}${last}`;
}

/**
 * Formate le temps relatif (ex: "2h ago")
 */
function formatTimeAgo(
  isoDate: string,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
  const now = new Date();
  const date = new Date(isoDate);
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
 * Retourne la variante Badge pour la priority
 */
function getPriorityVariant(
  priority: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "secondary";
  return "outline";
}

/**
 * Retourne le label du stage (Discovery, MQL, SQL)
 */
function getStageLabel(
  stage: string | null,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
  if (!stage) return t("leads.card.stage.indetermined");
  const stageKey = `leads.card.stage.${stage}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return t(stageKey as any);
}

export function KanbanCard({ lead, onClick }: KanbanCardProps) {
  const { t } = useTranslation("crm");

  return (
    <motion.div
      variants={cardHoverVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        "group cursor-pointer space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
        "relative overflow-hidden",
        "before:absolute before:inset-0",
        "before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent",
        "before:opacity-0 before:transition-opacity",
        "hover:before:opacity-100",
        "dark:before:from-blue-900/20"
      )}
    >
      {/* Header: Company + Flag + Stage */}
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate text-sm font-medium">
            {lead.company_name || "Unknown Company"}
          </span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {lead.country?.flag_emoji && (
            <span className="text-lg" title={lead.country.country_name_en}>
              {lead.country.flag_emoji}
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {getStageLabel(lead.lead_stage, t)}
          </Badge>
        </div>
      </div>

      {/* Contact Name (secondary) */}
      <p className="relative z-10 text-sm text-gray-600 dark:text-gray-400">
        {lead.first_name} {lead.last_name}
      </p>

      {/* Progress Bar - Qualification Score */}
      {lead.qualification_score !== null && (
        <div className="relative z-10 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t("leads.card.score")}</span>
            <span className="font-medium">{lead.qualification_score}/100</span>
          </div>
          <ProgressBar value={lead.qualification_score} max={100} />
        </div>
      )}

      {/* Fleet Size + Priority */}
      <div className="relative z-10 flex items-center gap-3 text-xs text-gray-500">
        {lead.fleet_size && (
          <div className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            <span>
              {lead.fleet_size} {t("leads.card.vehicles")}
            </span>
          </div>
        )}
        {lead.priority && (
          <Badge
            variant={getPriorityVariant(lead.priority)}
            className="text-xs"
          >
            {t(`leads.card.priority.${lead.priority}`)}
          </Badge>
        )}
      </div>

      {/* Footer: Owner + Time + Action */}
      <div className="relative z-10 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {lead.assigned_to ? (
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
              title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`}
            >
              {getInitials(lead.assigned_to)}
            </div>
          ) : (
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
              <User className="h-3 w-3 text-gray-400" />
            </div>
          )}
          <span className="text-xs text-gray-500">
            {formatTimeAgo(lead.created_at, t)}
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <ArrowRight className="h-4 w-4 text-gray-400" />
        </motion.div>
      </div>
    </motion.div>
  );
}
