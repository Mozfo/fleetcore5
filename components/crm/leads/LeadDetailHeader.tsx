/**
 * LeadDetailHeader - Breadcrumb, title, status badge, and actions
 * Premium design with smooth animations
 * Includes prev/next navigation and back button
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion as _motion } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Pencil,
  Save,
  X,
  Trash2,
  MoreHorizontal,
  Mail,
  Phone,
  Loader2,
  User,
  ArrowLeft,
  Target,
  TrendingUp,
  Flag,
} from "lucide-react";
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
import type { Lead, LeadStatus } from "@/types/crm";
import { LeadSearchCommand } from "./LeadSearchCommand";

interface LeadNavigation {
  prevId: string | null;
  nextId: string | null;
  currentPosition: number;
  totalCount: number;
}

interface LeadDetailHeaderProps {
  lead: Lead;
  locale: "en" | "fr";
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
  onQualify?: () => void;
  onConvert?: () => void;
  navigation: LeadNavigation;
}

// Status colors and labels
const statusConfig: Record<
  LeadStatus,
  { bg: string; text: string; label: string }
> = {
  new: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
    label: "New",
  },
  working: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    label: "Working",
  },
  qualified: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
    label: "Qualified",
  },
  lost: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
    label: "Lost",
  },
};

// Get company initials for avatar
function getCompanyInitials(companyName: string | null): string {
  if (!companyName) return "??";
  return companyName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Score badge color based on value
function getScoreColor(score: number | null): string {
  if (score === null)
    return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  if (score >= 70)
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  if (score >= 40)
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
}

// Priority badge color
function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  }
}

export function LeadDetailHeader({
  lead,
  locale,
  isEditing,
  isSaving,
  onEdit,
  onSave,
  onDelete,
  onQualify,
  onConvert,
  navigation,
}: LeadDetailHeaderProps) {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const contactName = `${lead.first_name || ""} ${lead.last_name || ""}`.trim();
  const companyName =
    lead.company_name || t("leads.drawer.empty.unknown_company");
  const status = statusConfig[lead.status] || statusConfig.new;

  // Navigation handlers
  const goToPrev = () => {
    if (navigation.prevId) {
      router.push(`/${locale}/crm/leads/${navigation.prevId}`);
    }
  };

  const goToNext = () => {
    if (navigation.nextId) {
      router.push(`/${locale}/crm/leads/${navigation.nextId}`);
    }
  };

  const goBack = () => {
    router.push(`/${locale}/crm/leads`);
  };

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete();
      setShowDeleteConfirm(false);
    } else {
      setShowDeleteConfirm(true);
      // Reset after 3s
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
      {/* Top Bar: Back button + Navigation */}
      <div className="mb-3 flex items-center justify-between">
        {/* Left: Back */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="h-8 gap-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">
              {t("leads.navigation.back_to_list")}
            </span>
          </Button>
        </div>

        {/* Right: Navigation Controls */}
        <div className="flex items-center gap-2">
          {/* Search Command */}
          <LeadSearchCommand locale={locale} />

          {/* Position Indicator */}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {navigation.currentPosition} / {navigation.totalCount}
          </span>

          {/* Prev/Next Buttons */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPrev}
              disabled={!navigation.prevId}
              className="h-8 w-8"
              title={t("leads.navigation.previous")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNext}
              disabled={!navigation.nextId}
              className="h-8 w-8"
              title={t("leads.navigation.next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Header Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: Avatar + Info (B2B Company-First Design) */}
        <div className="flex items-start gap-4">
          {/* Avatar with Company Initials */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-lg font-bold text-white shadow-lg">
            {getCompanyInitials(lead.company_name)}
          </div>

          <div className="min-w-0">
            {/* Company Name (H1) + Country Flag */}
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-semibold text-gray-900 dark:text-white">
                {companyName}
              </h1>
              {lead.country?.flag_emoji && (
                <span className="text-xl" title={lead.country.country_name_en}>
                  {lead.country.flag_emoji}
                </span>
              )}
            </div>

            {/* Contact Info (Secondary) */}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
              {contactName && (
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {contactName}
                </span>
              )}
              {lead.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="max-w-[200px] truncate">{lead.email}</span>
                </span>
              )}
              {lead.assigned_to && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>
                    {lead.assigned_to.first_name} {lead.assigned_to.last_name}
                  </span>
                </>
              )}
            </div>

            {/* Badges Row: Status, Stage, Score, Priority */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Status Badge */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status.bg,
                  status.text
                )}
              >
                {t(`leads.status.${lead.status}`)}
              </span>

              {/* Stage Badge */}
              {lead.lead_stage && (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  <Target className="h-3 w-3" />
                  {t(`leads.card.stage.${lead.lead_stage}`)}
                </span>
              )}

              {/* Score Badge */}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getScoreColor(lead.qualification_score)
                )}
              >
                <TrendingUp className="h-3 w-3" />
                {t("leads.card.score")}: {lead.qualification_score ?? "—"}
              </span>

              {/* Priority Badge */}
              {lead.priority && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                    getPriorityColor(lead.priority)
                  )}
                >
                  <Flag className="h-3 w-3" />
                  {t(`leads.card.priority.${lead.priority}`)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isSaving}
              >
                <X className="mr-1.5 h-4 w-4" />
                {t("leads.drawer.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isSaving ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-4 w-4" />
                )}
                {isSaving ? t("leads.drawer.saving") : t("leads.drawer.save")}
              </Button>
            </>
          ) : (
            <>
              {/* Quick Actions */}
              {lead.email && (
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <a
                    href={`mailto:${lead.email}`}
                    title={t("leads.context_menu.email")}
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {lead.phone && (
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <a
                    href={`tel:${lead.phone}`}
                    title={t("leads.context_menu.call")}
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </Button>
              )}

              {/* Edit Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="transition-all active:scale-[0.98]"
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                {t("leads.drawer.actions.edit")}
              </Button>

              {/* More Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={onQualify}
                    disabled={
                      lead.lead_stage === "sales_qualified" ||
                      lead.lead_stage === "opportunity"
                    }
                    className={cn(
                      (lead.lead_stage === "sales_qualified" ||
                        lead.lead_stage === "opportunity") &&
                        "cursor-not-allowed opacity-50"
                    )}
                  >
                    {t("leads.drawer.actions.qualify")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onConvert}
                    disabled={lead.lead_stage !== "sales_qualified"}
                    className={cn(
                      lead.lead_stage !== "sales_qualified" &&
                        "cursor-not-allowed opacity-50"
                    )}
                  >
                    {t("leads.drawer.actions.convert")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className={cn(
                      "text-red-600 focus:text-red-600 dark:text-red-400",
                      showDeleteConfirm && "bg-red-50 dark:bg-red-950"
                    )}
                    onClick={handleDeleteClick}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {showDeleteConfirm
                      ? "Click again to confirm"
                      : t("leads.drawer.actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
