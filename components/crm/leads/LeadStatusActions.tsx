/**
 * LeadStatusActions — Always-visible step actions based on current lead status.
 *
 * Displayed in the lead popup below the header. Shows contextual next-step
 * buttons (Book Demo, Send Quotation, Not Interested, etc.) with
 * expand-on-click confirmation for status transitions.
 *
 * Status → Actions mapping:
 * - new / callback_requested → Book Demo | Send Quotation | Not Interested
 * - demo → Send Quotation | Not Interested
 * - lost → Move to Nurturing
 * - nurturing → Reactivate → Callback | Reactivate → Demo
 * - proposal_sent / payment_pending / converted / disqualified → (none)
 */

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import {
  Calendar,
  FileText,
  ThumbsDown,
  RotateCcw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useInvalidate } from "@refinedev/core";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead } from "@/types/crm";

// ── Cal.com booking links per locale ──────────────────────────────────

const CALCOM_ORIGIN =
  process.env.NEXT_PUBLIC_CALCOM_ORIGIN || "https://app.cal.eu";

const CALCOM_SLUGS: Record<string, string> = {
  en: "fleetcore/30min",
  fr: "fleetcore/30min-fr",
};

// ── Action definitions ────────────────────────────────────────────────

type ActionId =
  | "book_demo"
  | "send_quotation"
  | "not_interested"
  | "move_nurturing"
  | "reactivate_callback"
  | "reactivate_demo";

interface ActionDef {
  id: ActionId;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  targetStatus?: string;
  needsConfirm?: boolean;
  isExternal?: boolean;
  isDisabled?: boolean;
}

function getActionsForStatus(status: string): ActionDef[] {
  switch (status) {
    case "new":
    case "callback_requested":
      return [
        {
          id: "book_demo",
          icon: Calendar,
          borderColor: "border-blue-500",
          isExternal: true,
        },
        {
          id: "send_quotation",
          icon: FileText,
          borderColor: "border-orange-500",
          targetStatus: "proposal_sent",
          isDisabled: true,
        },
        {
          id: "not_interested",
          icon: ThumbsDown,
          borderColor: "border-red-500",
          targetStatus: "lost",
          needsConfirm: true,
        },
      ];
    case "demo":
      return [
        {
          id: "send_quotation",
          icon: FileText,
          borderColor: "border-orange-500",
          targetStatus: "proposal_sent",
          isDisabled: true,
        },
        {
          id: "not_interested",
          icon: ThumbsDown,
          borderColor: "border-red-500",
          targetStatus: "lost",
          needsConfirm: true,
        },
      ];
    case "lost":
      return [
        {
          id: "move_nurturing",
          icon: RotateCcw,
          borderColor: "border-purple-500",
          targetStatus: "nurturing",
          needsConfirm: true,
        },
      ];
    case "nurturing":
      return [
        {
          id: "reactivate_callback",
          icon: RotateCcw,
          borderColor: "border-blue-500",
          targetStatus: "callback_requested",
          needsConfirm: true,
        },
        {
          id: "reactivate_demo",
          icon: Calendar,
          borderColor: "border-green-500",
          targetStatus: "demo",
          needsConfirm: true,
        },
      ];
    default:
      return [];
  }
}

// ── Reason code derivation ────────────────────────────────────────────

function deriveLossReasonCode(fromStatus: string): string {
  if (fromStatus === "callback_requested" || fromStatus === "demo")
    return "not_interested";
  if (fromStatus === "proposal_sent") return "proposal_rejected";
  return "other";
}

function deriveNurturingReasonCode(fromStatus: string): string {
  if (fromStatus === "callback_requested") return "not_interested_callback";
  if (fromStatus === "demo") return "not_interested_demo";
  if (fromStatus === "proposal_sent") return "proposal_no_response";
  if (fromStatus === "lost") return "reactivation_from_lost";
  return "other";
}

// ── Component ─────────────────────────────────────────────────────────

interface LeadStatusActionsProps {
  lead: Lead;
  onStatusChanged: () => void;
}

export function LeadStatusActions({
  lead,
  onStatusChanged,
}: LeadStatusActionsProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const invalidate = useInvalidate();

  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = getActionsForStatus(lead.status);

  if (actions.length === 0) return null;

  const handleActionClick = (action: ActionDef) => {
    if (action.isDisabled) return;

    if (action.isExternal) {
      const slug = CALCOM_SLUGS[locale] || CALCOM_SLUGS.en;
      const url = new URL(`${CALCOM_ORIGIN}/${slug}`);
      if (lead.email) url.searchParams.set("email", lead.email);
      const name = [lead.first_name, lead.last_name].filter(Boolean).join(" ");
      if (name) url.searchParams.set("name", name);
      window.open(url.toString(), "_blank", "noopener,noreferrer");
      return;
    }

    if (action.needsConfirm) {
      setSelectedAction(selectedAction === action.id ? null : action.id);
      setNote("");
      return;
    }
  };

  const handleConfirm = async () => {
    const action = actions.find((a) => a.id === selectedAction);
    if (!action?.targetStatus) return;

    setIsSubmitting(true);
    try {
      const options: {
        lossReasonCode?: string;
        nurturingReasonCode?: string;
        reasonDetail?: string;
      } = {};

      if (action.targetStatus === "lost") {
        options.lossReasonCode = deriveLossReasonCode(lead.status);
        if (note) options.reasonDetail = note;
      } else if (action.targetStatus === "nurturing") {
        options.nurturingReasonCode = deriveNurturingReasonCode(lead.status);
        if (note) options.reasonDetail = note;
      } else if (note) {
        options.reasonDetail = note;
      }

      const result = await updateLeadStatusAction(
        lead.id,
        action.targetStatus,
        options
      );

      if (result.success) {
        toast.success(t("leads.step_actions.success"));
        void invalidate({ resource: "leads", invalidates: ["list"] });
        onStatusChanged();
      } else {
        toast.error(result.error || t("leads.step_actions.error"));
      }
    } catch {
      toast.error(t("leads.step_actions.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedAction(null);
    setNote("");
  };

  return (
    <div className="space-y-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {t("leads.step_actions.section_title")}
      </h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.id;

          return (
            <div key={action.id}>
              {/* Action button */}
              <button
                type="button"
                onClick={() => handleActionClick(action)}
                disabled={action.isDisabled || isSubmitting}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                  action.isDisabled
                    ? "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                    : isSelected
                      ? `${action.borderColor} bg-accent`
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">
                  {t(`leads.step_actions.${action.id}`)}
                  {action.isDisabled && (
                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                      — {t("leads.step_actions.coming_soon")}
                    </span>
                  )}
                </span>
                {action.isExternal && (
                  <ExternalLink className="text-muted-foreground size-3.5" />
                )}
              </button>

              {/* Expanded sub-fields (ml-8 indent) */}
              {isSelected && action.needsConfirm && (
                <div className="mt-2 ml-8 space-y-3">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("leads.step_actions.reason_placeholder")}
                    rows={2}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      {t("leads.step_actions.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {t("leads.step_actions.confirming")}
                        </>
                      ) : (
                        t("leads.step_actions.confirm")
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
