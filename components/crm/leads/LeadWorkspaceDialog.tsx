/**
 * LeadWorkspaceDialog - Popup workspace for lead detail
 *
 * Opens on card click (replaces drawer).
 * Two-column layout: left (qualification, company, timeline), right (status, contact, notes).
 * Application-style design: borders, no shadows, compact padding.
 */

"use client";

import { useMemo, useCallback } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Building2,
  MapPin,
  Car,
  User,
  Clock,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  ArrowRightCircle,
  Ban,
  Trash,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTranslation } from "react-i18next";
import { useParams, useRouter } from "next/navigation";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import { LeadTimeline } from "./LeadTimeline";
import type { Lead } from "@/types/crm";

interface LeadWorkspaceDialogProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  // Navigation between leads
  allLeadIds: string[];
  onNavigate: (leadId: string) => void;
  // Actions
  onEdit?: (leadId: string) => void;
  onConvert?: (leadId: string) => void;
  onDisqualify?: (leadId: string) => void;
  onDelete?: (leadId: string) => void;
  onStatusChange?: (leadId: string, status: string) => void;
}

// Status badge classes from pipeline config (vivid solid bg + white text)

function formatTimeAgo(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 604800)}w ago`;
}

export function LeadWorkspaceDialog({
  lead,
  isOpen,
  onClose,
  allLeadIds,
  onNavigate,
  onEdit,
  onConvert,
  onDisqualify,
  onDelete,
}: LeadWorkspaceDialogProps) {
  const { t } = useTranslation("crm");
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { getLabel: getStageLabel } = useLeadStages();

  // Prev/Next navigation
  const currentIndex = useMemo(() => {
    if (!lead) return -1;
    return allLeadIds.indexOf(lead.id);
  }, [lead, allLeadIds]);

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLeadIds.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) onNavigate(allLeadIds[currentIndex - 1]);
  }, [hasPrev, currentIndex, allLeadIds, onNavigate]);

  const goToNext = useCallback(() => {
    if (hasNext) onNavigate(allLeadIds[currentIndex + 1]);
  }, [hasNext, currentIndex, allLeadIds, onNavigate]);

  if (!lead) return null;

  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
  const statusCfg = getStatusConfig(lead.status);
  const statusBadgeClass = `${statusCfg.bg} text-white ${statusCfg.border}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        {/* Accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>{lead.company_name || "Lead"} - Details</DialogTitle>
        </VisuallyHidden.Root>

        {/* ========== HEADER (48px) ========== */}
        <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-4">
          {/* Left: Close + Info */}
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-foreground truncate text-sm font-semibold">
                  {lead.company_name || "Unknown"}
                </span>
                {lead.country?.flag_emoji && (
                  <span className="text-sm">{lead.country.flag_emoji}</span>
                )}
              </div>
              <p className="text-muted-foreground truncate text-xs">
                {fullName}
                {lead.phone && ` \u00B7 ${lead.phone}`}
                {lead.email && ` \u00B7 ${lead.email}`}
              </p>
            </div>
          </div>

          {/* Right: Nav + Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToPrev}
              disabled={!hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={goToNext}
              disabled={!hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onClose();
                router.push(`/${locale}/crm/leads/${lead.id}`);
              }}
            >
              <ExternalLink className="mr-1 h-3 w-3" />
              Full page
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(lead.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t("leads.drawer.actions.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConvert?.(lead.id)}>
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  {t("leads.drawer.actions.convert")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDisqualify?.(lead.id)}
                  className="text-status-proposal focus:text-status-proposal"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {t("leads.drawer.actions.disqualify")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(lead.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  {t("leads.drawer.actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ========== BODY (2 columns) ========== */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Left Column - 60% */}
          <div className="border-border w-3/5 space-y-3 overflow-y-auto border-r p-4">
            {/* Qualification Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("leads.drawer.sections.scoring", {
                    defaultValue: "Qualification",
                  })}
                </h3>
              </div>
              <div className="space-y-3 p-3">
                {lead.qualification_score !== null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Score</span>
                      <span className="font-medium">
                        {lead.qualification_score}/100
                      </span>
                    </div>
                    <ProgressBar
                      value={lead.qualification_score ?? 0}
                      max={100}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Stage</span>
                    <p className="text-foreground font-medium">
                      {lead.lead_stage
                        ? getStageLabel(lead.lead_stage, locale)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Priority
                    </span>
                    <p className="text-foreground font-medium">
                      {lead.priority
                        ? t(`leads.card.priority.${lead.priority}`)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Info Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  {t("leads.drawer.sections.company", {
                    defaultValue: "Company",
                  })}
                </h3>
              </div>
              <div className="p-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> Company
                  </dt>
                  <dd className="text-foreground font-medium">
                    {lead.company_name || "—"}
                  </dd>

                  <dt className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Country
                  </dt>
                  <dd className="text-foreground font-medium">
                    {lead.country?.flag_emoji}{" "}
                    {lead.country?.country_name_en || lead.country_code || "—"}
                  </dd>

                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Car className="h-3 w-3" /> Fleet size
                  </dt>
                  <dd className="text-foreground font-medium">
                    {lead.fleet_size || "—"}
                  </dd>

                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Created
                  </dt>
                  <dd className="text-foreground font-medium">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </dd>

                  {lead.source && (
                    <>
                      <dt className="text-muted-foreground">Source</dt>
                      <dd className="text-foreground font-medium">
                        {lead.source}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </section>

            {/* Timeline Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  Timeline
                </h3>
              </div>
              <div className="max-h-64 overflow-y-auto p-3">
                <LeadTimeline leadId={lead.id} />
              </div>
            </section>
          </div>

          {/* Right Column - 40% */}
          <div className="w-2/5 space-y-3 overflow-y-auto p-4">
            {/* Status & Actions Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  Status
                </h3>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Current</span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${statusBadgeClass}`}
                  >
                    {t(`leads.status.${lead.status}`)}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="h-7 w-full text-xs"
                    onClick={() => onEdit?.(lead.id)}
                  >
                    <Pencil className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs"
                    onClick={() => onConvert?.(lead.id)}
                  >
                    <ArrowRightCircle className="mr-1 h-3 w-3" />
                    Convert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-status-proposal h-7 w-full text-xs"
                    onClick={() => onDisqualify?.(lead.id)}
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Disqualify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive h-7 w-full text-xs"
                    onClick={() => onDelete?.(lead.id)}
                  >
                    <Trash className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    Assigned to
                  </span>
                  <span className="text-foreground text-sm font-medium">
                    {lead.assigned_to
                      ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`
                      : "Unassigned"}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Contact Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  Quick Contact
                </h3>
              </div>
              <div className="space-y-2 p-3">
                <div className="flex gap-2">
                  {lead.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      asChild
                    >
                      <a href={`tel:${lead.phone}`}>
                        <Phone className="mr-1 h-3 w-3" /> Call
                      </a>
                    </Button>
                  )}
                  {lead.email && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 flex-1 text-xs"
                      asChild
                    >
                      <a href={`mailto:${lead.email}`}>
                        <Mail className="mr-1 h-3 w-3" /> Email
                      </a>
                    </Button>
                  )}
                </div>
                <div className="text-muted-foreground space-y-1 text-xs">
                  {lead.email && (
                    <p className="flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {lead.email}
                    </p>
                  )}
                  {lead.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {lead.phone}
                    </p>
                  )}
                </div>
                <p className="text-muted-foreground/70 text-xs">
                  Last updated:{" "}
                  {lead.updated_at ? formatTimeAgo(lead.updated_at) : "—"}
                </p>
              </div>
            </section>

            {/* Assignment Section */}
            <section className="border-border rounded-md border">
              <div className="border-border bg-muted/50 border-b px-3 py-2">
                <h3 className="text-foreground text-xs font-semibold tracking-wide uppercase">
                  Details
                </h3>
              </div>
              <div className="space-y-2 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    <User className="mr-1 inline h-3 w-3" />
                    Contact
                  </span>
                  <span className="text-foreground font-medium">
                    {fullName || "—"}
                  </span>
                </div>
                {lead.linkedin_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">LinkedIn</span>
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="inline h-3 w-3" /> Profile
                    </a>
                  </div>
                )}
                {lead.website_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Website</span>
                    <a
                      href={lead.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="inline h-3 w-3" /> Visit
                    </a>
                  </div>
                )}
                {lead.qualification_notes && (
                  <div className="border-border bg-muted/50 text-foreground mt-2 rounded border p-2 text-xs">
                    {lead.qualification_notes}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
