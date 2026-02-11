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

// Status badge vivid colors (Salesforce Cosmos)
const STATUS_BADGE_CLASSES: Record<string, string> = {
  new: "bg-blue-600 text-white border-blue-600",
  email_verified: "bg-cyan-600 text-white border-cyan-600",
  callback_requested: "bg-blue-500 text-white border-blue-500",
  demo: "bg-indigo-600 text-white border-indigo-600",
  proposal_sent: "bg-amber-500 text-white border-amber-500",
  payment_pending: "bg-orange-500 text-white border-orange-500",
  converted: "bg-green-600 text-white border-green-600",
  lost: "bg-red-600 text-white border-red-600",
  nurturing: "bg-teal-500 text-white border-teal-500",
  disqualified: "bg-gray-500 text-white border-gray-500",
};

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
  const statusBadgeClass =
    STATUS_BADGE_CLASSES[lead.status] || STATUS_BADGE_CLASSES.new;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0">
        {/* Accessibility */}
        <VisuallyHidden.Root>
          <DialogTitle>{lead.company_name || "Lead"} - Details</DialogTitle>
        </VisuallyHidden.Root>

        {/* ========== HEADER (48px) ========== */}
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-gray-200 px-4">
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
                <span className="truncate text-sm font-semibold text-gray-900">
                  {lead.company_name || "Unknown"}
                </span>
                {lead.country?.flag_emoji && (
                  <span className="text-sm">{lead.country.flag_emoji}</span>
                )}
              </div>
              <p className="truncate text-xs text-gray-500">
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
                  className="text-orange-600 focus:text-orange-600"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  {t("leads.drawer.actions.disqualify")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(lead.id)}
                  className="text-red-600 focus:text-red-600"
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
          <div className="w-3/5 space-y-3 overflow-y-auto border-r border-gray-200 p-4">
            {/* Qualification Section */}
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  {t("leads.drawer.sections.scoring", {
                    defaultValue: "Qualification",
                  })}
                </h3>
              </div>
              <div className="space-y-3 p-3">
                {lead.qualification_score !== null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Score</span>
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
                    <span className="text-xs text-gray-500">Stage</span>
                    <p className="font-medium text-gray-900">
                      {lead.lead_stage
                        ? getStageLabel(lead.lead_stage, locale)
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Priority</span>
                    <p className="font-medium text-gray-900">
                      {lead.priority
                        ? t(`leads.card.priority.${lead.priority}`)
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Company Info Section */}
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  {t("leads.drawer.sections.company", {
                    defaultValue: "Company",
                  })}
                </h3>
              </div>
              <div className="p-3">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="flex items-center gap-1 text-gray-500">
                    <Building2 className="h-3 w-3" /> Company
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {lead.company_name || "—"}
                  </dd>

                  <dt className="flex items-center gap-1 text-gray-500">
                    <MapPin className="h-3 w-3" /> Country
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {lead.country?.flag_emoji}{" "}
                    {lead.country?.country_name_en || lead.country_code || "—"}
                  </dd>

                  <dt className="flex items-center gap-1 text-gray-500">
                    <Car className="h-3 w-3" /> Fleet size
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {lead.fleet_size || "—"}
                  </dd>

                  <dt className="flex items-center gap-1 text-gray-500">
                    <Clock className="h-3 w-3" /> Created
                  </dt>
                  <dd className="font-medium text-gray-900">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </dd>

                  {lead.source && (
                    <>
                      <dt className="text-gray-500">Source</dt>
                      <dd className="font-medium text-gray-900">
                        {lead.source}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            </section>

            {/* Timeline Section */}
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
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
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Status
                </h3>
              </div>
              <div className="space-y-3 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Current</span>
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
                    className="h-7 w-full text-xs text-orange-600"
                    onClick={() => onDisqualify?.(lead.id)}
                  >
                    <Ban className="mr-1 h-3 w-3" />
                    Disqualify
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs text-red-600"
                    onClick={() => onDelete?.(lead.id)}
                  >
                    <Trash className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Assigned to</span>
                  <span className="text-sm font-medium text-gray-900">
                    {lead.assigned_to
                      ? `${lead.assigned_to.first_name} ${lead.assigned_to.last_name || ""}`
                      : "Unassigned"}
                  </span>
                </div>
              </div>
            </section>

            {/* Quick Contact Section */}
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
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
                <div className="space-y-1 text-xs text-gray-500">
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
                <p className="text-xs text-gray-400">
                  Last updated:{" "}
                  {lead.updated_at ? formatTimeAgo(lead.updated_at) : "—"}
                </p>
              </div>
            </section>

            {/* Assignment Section */}
            <section className="rounded-md border border-gray-200">
              <div className="border-b border-gray-200 bg-gray-50 px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-gray-700 uppercase">
                  Details
                </h3>
              </div>
              <div className="space-y-2 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">
                    <User className="mr-1 inline h-3 w-3" />
                    Contact
                  </span>
                  <span className="font-medium text-gray-900">
                    {fullName || "—"}
                  </span>
                </div>
                {lead.linkedin_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">LinkedIn</span>
                    <a
                      href={lead.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <ExternalLink className="inline h-3 w-3" /> Profile
                    </a>
                  </div>
                )}
                {lead.website_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Website</span>
                    <a
                      href={lead.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <ExternalLink className="inline h-3 w-3" /> Visit
                    </a>
                  </div>
                )}
                {lead.qualification_notes && (
                  <div className="mt-2 rounded border border-gray-100 bg-gray-50 p-2 text-xs text-gray-700">
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
