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
  Copy,
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getStatusBadgeColor } from "@/lib/utils/status-colors";
import type { Lead } from "@/types/crm";
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

// Status colors now from centralized mapping (lib/utils/status-colors.ts)

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
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-status-converted/20 text-status-converted";
  if (score >= 40) return "bg-status-proposal/20 text-status-proposal";
  return "bg-status-lost/20 text-status-lost";
}

// Priority badge color
function getPriorityColor(priority: string | null): string {
  switch (priority) {
    case "urgent":
      return "bg-destructive/20 text-destructive";
    case "high":
      return "bg-status-proposal/20 text-status-proposal";
    case "medium":
      return "bg-status-proposal/10 text-status-proposal";
    default:
      return "bg-muted text-muted-foreground";
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

  const handleCopyCode = async () => {
    if (!lead.lead_code) return;
    try {
      await navigator.clipboard.writeText(lead.lead_code);
      toast.success(`${lead.lead_code} ${t("leads.drawer.actions.copied")}`);
    } catch {
      toast.error(t("leads.drawer.actions.copy_failed"));
    }
  };

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
    <header className="border-border bg-background shrink-0 border-b px-6 py-4">
      {/* Top Bar: Back button + Navigation */}
      <div className="mb-3 flex items-center justify-between">
        {/* Left: Back */}
        <div className="flex items-center gap-3">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            className="text-muted-foreground hover:text-foreground h-8 gap-1.5"
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
          <span className="text-muted-foreground text-sm">
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
        {/* Left: Avatar + Info (Lead Code FIRST, then B2B Company-First) */}
        <div className="flex items-start gap-4">
          {/* Avatar with Company Initials */}
          <div className="bg-primary text-primary-foreground flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-lg">
            {getCompanyInitials(lead.company_name)}
          </div>

          <div className="min-w-0">
            {/* Lead Code — FIRST, prominent */}
            {lead.lead_code && (
              <div className="mb-1 flex items-center gap-2">
                <span className="text-primary font-mono text-base font-semibold">
                  {lead.lead_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-muted-foreground hover:text-primary rounded p-0.5 transition-colors"
                  title={t("leads.drawer.actions.copy")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Company Name (H1) + Country Flag */}
            <div className="flex items-center gap-2">
              <h1 className="text-foreground truncate text-xl font-semibold">
                {companyName}
              </h1>
              {lead.country?.flag_emoji && (
                <span className="text-xl" title={lead.country.country_name_en}>
                  {lead.country.flag_emoji}
                </span>
              )}
            </div>

            {/* Contact Info (Secondary) */}
            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
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
                  <span className="text-muted-foreground/50">•</span>
                  <span>
                    {lead.assigned_to.first_name} {lead.assigned_to.last_name}
                  </span>
                </>
              )}
            </div>

            {/* Badges Row: Status, Stage, Score, Priority */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {/* Status Badge — centralized colors */}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  getStatusBadgeColor(lead.status)
                )}
              >
                {t(`leads.status.${lead.status}`)}
              </span>

              {/* Stage Badge */}
              {lead.lead_stage && (
                <span className="bg-status-nurturing/20 text-status-nurturing inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
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
                className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                      "text-destructive focus:text-destructive",
                      showDeleteConfirm && "bg-destructive/10"
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
