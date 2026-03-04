/**
 * LeadStatusActions — V7 "Next Steps" section.
 *
 * Status → Actions mapping (V7):
 * - callback_requested → Schedule Demo (if BANT ≥ 3/4) | Move to Nurturing | Disqualify
 * - qualified → Convert to Opportunity | Move to Nurturing | Disqualify
 * - nurturing → Reactivate (→ callback_requested) | Disqualify
 * - new / email_verified / converted / disqualified → (none)
 *
 * Schedule Demo: creates a "meeting" activity (placeholder for B5 Google Calendar).
 * Convert to Opportunity: opens ConvertToOpportunityModal.
 */

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  ArrowRightCircle,
  Clock,
  RotateCcw,
  Ban,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import { createActivityAction } from "@/lib/actions/crm/activities.actions";
import { getStatusSectionBg } from "@/lib/utils/status-colors";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import { getBantCriteriaMet } from "@/lib/constants/crm/bant.constants";
import type { Lead } from "@/types/crm";

// ── Action definitions (V7) ──────────────────────────────────────────

type ActionId =
  | "schedule_demo"
  | "convert_opportunity"
  | "move_nurturing"
  | "reactivate"
  | "disqualify";

interface ActionDef {
  id: ActionId;
  icon: React.ComponentType<{ className?: string }>;
  borderColor: string;
  bgSelected: string;
  targetStatus?: string;
  needsConfirm?: boolean;
  needsDatePicker?: boolean;
}

function getActionsForStatus(lead: Lead): ActionDef[] {
  const status = lead.status;
  const nurturingCfg = getStatusConfig("nurturing");
  const callbackCfg = getStatusConfig("callback_requested");
  const qualifiedCfg = getStatusConfig("qualified");
  const convertedCfg = getStatusConfig("converted");
  const disqualifiedCfg = getStatusConfig("disqualified");

  switch (status) {
    case "callback_requested": {
      const actions: ActionDef[] = [];

      // Schedule Demo — only if BANT ≥ 3/4
      const bantMet = getBantCriteriaMet(lead);
      if (bantMet >= 3) {
        actions.push({
          id: "schedule_demo",
          icon: Calendar,
          borderColor: qualifiedCfg.border,
          bgSelected: qualifiedCfg.bgSubtle,
          needsDatePicker: true,
        });
      }

      actions.push(
        {
          id: "move_nurturing",
          icon: Clock,
          borderColor: nurturingCfg.border,
          bgSelected: nurturingCfg.bgSubtle,
          targetStatus: "nurturing",
          needsConfirm: true,
        },
        {
          id: "disqualify",
          icon: Ban,
          borderColor: disqualifiedCfg.border,
          bgSelected: disqualifiedCfg.bgSubtle,
          targetStatus: "disqualified",
          needsConfirm: true,
        }
      );
      return actions;
    }

    case "qualified":
      return [
        {
          id: "convert_opportunity",
          icon: ArrowRightCircle,
          borderColor: convertedCfg.border,
          bgSelected: convertedCfg.bgSubtle,
          targetStatus: "converted",
          needsConfirm: true,
        },
        {
          id: "move_nurturing",
          icon: Clock,
          borderColor: nurturingCfg.border,
          bgSelected: nurturingCfg.bgSubtle,
          targetStatus: "nurturing",
          needsConfirm: true,
        },
        {
          id: "disqualify",
          icon: Ban,
          borderColor: disqualifiedCfg.border,
          bgSelected: disqualifiedCfg.bgSubtle,
          targetStatus: "disqualified",
          needsConfirm: true,
        },
      ];

    case "nurturing":
      return [
        {
          id: "reactivate",
          icon: RotateCcw,
          borderColor: callbackCfg.border,
          bgSelected: callbackCfg.bgSubtle,
          targetStatus: "callback_requested",
          needsConfirm: true,
        },
        {
          id: "disqualify",
          icon: Ban,
          borderColor: disqualifiedCfg.border,
          bgSelected: disqualifiedCfg.bgSubtle,
          targetStatus: "disqualified",
          needsConfirm: true,
        },
      ];

    default:
      return [];
  }
}

// ── Component ─────────────────────────────────────────────────────────

interface LeadStatusActionsProps {
  lead: Lead;
  onMutationSuccess: () => void;
}

export function LeadStatusActions({
  lead,
  onMutationSuccess,
}: LeadStatusActionsProps) {
  const { t } = useTranslation("crm");

  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [note, setNote] = useState("");
  const [demoDate, setDemoDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = getActionsForStatus(lead);

  // ── Handle action click (toggle selection) ─────────────────────────

  const handleActionClick = (action: ActionDef) => {
    if (action.needsConfirm || action.needsDatePicker) {
      setSelectedAction(selectedAction === action.id ? null : action.id);
      setNote("");
      setDemoDate("");
      return;
    }
  };

  // ── Handle Schedule Demo submit ────────────────────────────────────

  const handleScheduleDemo = async () => {
    if (!demoDate) return;

    setIsSubmitting(true);
    try {
      const scheduledDate = new Date(demoDate);
      const dateStr = scheduledDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const result = await createActivityAction({
        leadId: lead.id,
        activityType: "meeting",
        subject: "Demo scheduled",
        description: note.trim() || undefined,
        activityDate: scheduledDate,
      });

      if (result.success) {
        toast.success(
          t("leads.step_actions.demo_scheduled", {
            defaultValue: `Demo scheduled for ${dateStr}`,
            date: dateStr,
          })
        );
        setSelectedAction(null);
        setDemoDate("");
        setNote("");
        onMutationSuccess();
      } else {
        toast.error(result.error || t("leads.step_actions.error"));
      }
    } catch {
      toast.error(t("leads.step_actions.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle status change confirm ───────────────────────────────────

  const handleConfirm = async () => {
    const action = actions.find((a) => a.id === selectedAction);
    if (!action?.targetStatus) return;

    setIsSubmitting(true);
    try {
      const options: {
        nurturingReasonCode?: string;
        reasonDetail?: string;
      } = {};

      if (action.targetStatus === "nurturing") {
        options.nurturingReasonCode =
          lead.status === "nurturing"
            ? "reactivation"
            : `manual_from_${lead.status}`;
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
        onMutationSuccess();
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
    setDemoDate("");
  };

  // ── Render ─────────────────────────────────────────────────────────

  if (actions.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg p-3",
        getStatusSectionBg(lead.status)
      )}
    >
      <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
        {t("leads.step_actions.section_title")}
      </h3>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.id;

          return (
            <div key={action.id}>
              {/* Action button — full width */}
              <button
                type="button"
                onClick={() => handleActionClick(action)}
                disabled={isSubmitting}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                  isSelected
                    ? `${action.borderColor} ${action.bgSelected}`
                    : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="block">
                  {t(`leads.step_actions.${action.id}`, {
                    defaultValue: action.id.replace(/_/g, " "),
                  })}
                </span>
              </button>

              {/* Schedule Demo expanded form */}
              {isSelected && action.needsDatePicker && (
                <div className="mt-2 ml-8 space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="demo-date" className="text-xs">
                      {t("leads.step_actions.demo_date_label", {
                        defaultValue: "Date & Time",
                      })}{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="demo-date"
                      type="datetime-local"
                      value={demoDate}
                      onChange={(e) => setDemoDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="demo-note" className="text-xs">
                      {t("leads.step_actions.demo_note_label", {
                        defaultValue: "Note (optional)",
                      })}
                    </Label>
                    <Textarea
                      id="demo-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder={t(
                        "leads.step_actions.demo_note_placeholder",
                        {
                          defaultValue:
                            "e.g. Full product demo, Fleet management focus...",
                        }
                      )}
                      rows={2}
                      className="text-sm"
                    />
                  </div>
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
                      onClick={handleScheduleDemo}
                      disabled={!demoDate || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          {t("leads.step_actions.confirming")}
                        </>
                      ) : (
                        t("leads.step_actions.schedule", {
                          defaultValue: "Schedule",
                        })
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Status change expanded form */}
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
