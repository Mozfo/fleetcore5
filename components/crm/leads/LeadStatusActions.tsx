/**
 * LeadStatusActions — Unique "Next Steps" section.
 *
 * Handles BOTH manual click actions AND drag & drop transitions.
 * TransitionActionSection is absorbed here.
 *
 * Status → Actions mapping:
 * - new / callback_requested → Book Demo | Send Quotation | Not Interested
 * - demo → Send Quotation | Not Interested
 * - lost → Move to Nurturing
 * - nurturing → Reactivate → Callback | Reactivate → Demo
 * - proposal_sent / payment_pending / converted / disqualified → (none)
 *
 * Drag & drop:
 * - pendingTransition → pre-select action, auto-scroll, amber banner
 * - auto-confirm for converted / callback_requested
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import {
  Calendar,
  FileText,
  ThumbsDown,
  RotateCcw,
  Loader2,
  ArrowRightCircle,
} from "lucide-react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { toast } from "sonner";
import { useInvalidate } from "@refinedev/core";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { getStatusSectionBg } from "@/lib/utils/status-colors";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import type { Lead } from "@/types/crm";
import type { PendingTransition } from "@/features/crm/leads/hooks/use-leads-kanban";

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
  bgSelected: string;
  targetStatus?: string;
  needsConfirm?: boolean;
  isExternal?: boolean;
  isDisabled?: boolean;
  hint?: string;
}

function getActionsForStatus(status: string): ActionDef[] {
  const demoCfg = getStatusConfig("demo");
  const proposalCfg = getStatusConfig("proposal_sent");
  const lostCfg = getStatusConfig("lost");
  const nurturingCfg = getStatusConfig("nurturing");
  const callbackCfg = getStatusConfig("callback_requested");
  const convertedCfg = getStatusConfig("converted");

  switch (status) {
    case "new":
    case "callback_requested":
      return [
        {
          id: "book_demo",
          icon: Calendar,
          borderColor: demoCfg.border,
          bgSelected: demoCfg.bgSubtle,
          isExternal: true,
          hint: "book_demo_hint",
        },
        {
          id: "send_quotation",
          icon: FileText,
          borderColor: proposalCfg.border,
          bgSelected: proposalCfg.bgSubtle,
          targetStatus: "proposal_sent",
          isDisabled: true,
        },
        {
          id: "not_interested",
          icon: ThumbsDown,
          borderColor: lostCfg.border,
          bgSelected: lostCfg.bgSubtle,
          targetStatus: "lost",
          needsConfirm: true,
          hint: "not_interested_hint",
        },
      ];
    case "demo":
      return [
        {
          id: "send_quotation",
          icon: FileText,
          borderColor: proposalCfg.border,
          bgSelected: proposalCfg.bgSubtle,
          targetStatus: "proposal_sent",
          isDisabled: true,
        },
        {
          id: "not_interested",
          icon: ThumbsDown,
          borderColor: lostCfg.border,
          bgSelected: lostCfg.bgSubtle,
          targetStatus: "lost",
          needsConfirm: true,
          hint: "not_interested_hint",
        },
      ];
    case "lost":
      return [
        {
          id: "move_nurturing",
          icon: RotateCcw,
          borderColor: nurturingCfg.border,
          bgSelected: nurturingCfg.bgSubtle,
          targetStatus: "nurturing",
          needsConfirm: true,
        },
      ];
    case "nurturing":
      return [
        {
          id: "reactivate_callback",
          icon: RotateCcw,
          borderColor: callbackCfg.border,
          bgSelected: callbackCfg.bgSubtle,
          targetStatus: "callback_requested",
          needsConfirm: true,
        },
        {
          id: "reactivate_demo",
          icon: Calendar,
          borderColor: convertedCfg.border,
          bgSelected: convertedCfg.bgSubtle,
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

// ── Auto-confirm statuses (no user input needed) ─────────────────────

const AUTO_CONFIRM_STATUSES = new Set(["converted", "callback_requested"]);

// ── Component ─────────────────────────────────────────────────────────

interface LeadStatusActionsProps {
  lead: Lead;
  onStatusChanged: () => void;
  pendingTransition?: PendingTransition | null;
  onTransitionCancel?: () => void;
  showCalEmbed?: boolean;
  onShowCalEmbed?: (show: boolean) => void;
}

export function LeadStatusActions({
  lead,
  onStatusChanged,
  pendingTransition,
  onTransitionCancel,
  showCalEmbed,
  onShowCalEmbed,
}: LeadStatusActionsProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const invalidate = useInvalidate();
  const { getLabel } = useLeadStatuses();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedAction, setSelectedAction] = useState<ActionId | null>(null);
  const [note, setNote] = useState("");
  const [demoDate, setDemoDate] = useState("");
  const [nurturingToggle, setNurturingToggle] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actions = getActionsForStatus(lead.status);
  const isDragMode = !!pendingTransition;

  // ── Drag & drop: auto-scroll + auto-select + auto-confirm ──────────

  useEffect(() => {
    if (!pendingTransition) return;

    const { toStatus } = pendingTransition;

    // Auto-confirm for certain statuses
    if (AUTO_CONFIRM_STATUSES.has(toStatus)) {
      void handleDragConfirm(pendingTransition);
      return;
    }

    // Pre-select the matching action
    const matchingAction = actions.find((a) => a.targetStatus === toStatus);
    if (matchingAction) {
      setSelectedAction(matchingAction.id);
    }

    // Auto-scroll to this section
    setTimeout(() => {
      containerRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTransition?.toStatus]);

  // ── Cal.com embed: UI config + booking event listener ──────────────
  useEffect(() => {
    if (!showCalEmbed) return;
    let dismissed = false;

    void (async () => {
      const cal = await getCalApi({ namespace: "fleetcore-demo" });

      // Workaround for #9577 — force hideEventTypeDetails via "ui" API
      cal("ui", {
        hideEventTypeDetails: true,
        layout: "week_view",
      });

      // Listen for successful booking → update status + auto-close
      cal("on", {
        action: "bookingSuccessfulV2",
        callback: () => {
          if (dismissed) return;
          dismissed = true;

          // Transition lead to "demo" status
          void updateLeadStatusAction(lead.id, "demo", {
            reasonDetail: "Demo booked via Cal.com",
          }).then((result) => {
            if (result.success) {
              toast.success(t("leads.step_actions.success"));
              void invalidate({ resource: "leads", invalidates: ["list"] });
            }
          });

          // Auto-dismiss Cal embed after 3 seconds
          setTimeout(() => {
            onShowCalEmbed?.(false);
            onStatusChanged();
          }, 3000);
        },
      });
    })();
  }, [showCalEmbed, lead.id, t, invalidate, onShowCalEmbed, onStatusChanged]);

  // ── Handle drag confirm (TransitionActionSection logic) ────────────

  const handleDragConfirm = async (transition: PendingTransition) => {
    const { toStatus, fromStatus } = transition;
    setIsSubmitting(true);

    try {
      const options: {
        lossReasonCode?: string;
        nurturingReasonCode?: string;
        reasonDetail?: string;
      } = {};

      if (toStatus === "demo" && demoDate) {
        options.reasonDetail = `Demo scheduled: ${demoDate}`;
      }
      if (toStatus === "lost") {
        options.lossReasonCode = deriveLossReasonCode(fromStatus);
        if (note) options.reasonDetail = note;
      }
      if (toStatus === "nurturing") {
        options.nurturingReasonCode = deriveNurturingReasonCode(fromStatus);
        if (note) options.reasonDetail = note;
      }
      if (toStatus === "proposal_sent" && note) {
        options.reasonDetail = note;
      }

      const result = await updateLeadStatusAction(lead.id, toStatus, options);

      if (result.success) {
        toast.success(t("leads.step_actions.success"));
        void invalidate({ resource: "leads", invalidates: ["list"] });
        onStatusChanged();
      } else {
        toast.error(result.error || t("leads.step_actions.error"));
        onTransitionCancel?.();
      }
    } catch {
      toast.error(t("leads.step_actions.error"));
      onTransitionCancel?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Handle manual action click ─────────────────────────────────────

  const handleActionClick = (action: ActionDef) => {
    if (action.isDisabled) return;

    if (action.isExternal) {
      onShowCalEmbed?.(true);
      return;
    }

    if (action.needsConfirm) {
      setSelectedAction(selectedAction === action.id ? null : action.id);
      setNote("");
      setNurturingToggle(false);
      return;
    }
  };

  // ── Handle manual confirm ──────────────────────────────────────────

  const handleConfirm = async () => {
    const action = actions.find((a) => a.id === selectedAction);
    if (!action?.targetStatus) return;

    // If nurturing toggle is ON for "not_interested", redirect to nurturing
    const actualTarget =
      action.id === "not_interested" && nurturingToggle
        ? "nurturing"
        : action.targetStatus;

    setIsSubmitting(true);
    try {
      const options: {
        lossReasonCode?: string;
        nurturingReasonCode?: string;
        reasonDetail?: string;
      } = {};

      if (actualTarget === "lost") {
        options.lossReasonCode = deriveLossReasonCode(lead.status);
        if (note) options.reasonDetail = note;
      } else if (actualTarget === "nurturing") {
        options.nurturingReasonCode = deriveNurturingReasonCode(lead.status);
        if (note) options.reasonDetail = note;
      } else if (note) {
        options.reasonDetail = note;
      }

      const result = await updateLeadStatusAction(
        lead.id,
        actualTarget,
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
    setDemoDate("");
    setNurturingToggle(false);
  };

  // ── Drag mode: render transition UI ────────────────────────────────

  if (isDragMode && pendingTransition) {
    const { fromStatus, toStatus } = pendingTransition;
    const fromLabel = getLabel(fromStatus, locale);
    const toLabel = getLabel(toStatus, locale);
    const isAutoConfirm = AUTO_CONFIRM_STATUSES.has(toStatus);

    const canConfirmDrag =
      isAutoConfirm ||
      toStatus === "lost" ||
      toStatus === "nurturing" ||
      toStatus === "proposal_sent" ||
      (toStatus === "demo" && demoDate !== "");

    return (
      <div ref={containerRef} className="space-y-2">
        <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
          {t("leads.step_actions.section_title")}
        </h3>

        {/* Drag transition banner */}
        <div className="border-primary/30 bg-primary/10 rounded-lg border p-3">
          <div className="flex items-center gap-2">
            <ArrowRightCircle className="text-primary size-5" />
            <span className="text-primary text-sm font-semibold">
              {t("leads.step_actions.drag_banner", {
                from: fromLabel,
                to: toLabel,
              })}
            </span>
          </div>
        </div>

        {/* Conditional fields based on toStatus */}
        <div className="space-y-3">
          {toStatus === "demo" && (
            <>
              <div className="space-y-1">
                <Label htmlFor="transition-demo-date" className="text-xs">
                  {t("leads.kanban.transition.demo_date")}{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="transition-demo-date"
                  type="datetime-local"
                  value={demoDate}
                  onChange={(e) => setDemoDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="transition-note" className="text-xs">
                  {t("leads.kanban.transition.reason_optional")}
                </Label>
                <Textarea
                  id="transition-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("leads.kanban.transition.reason_placeholder")}
                  rows={2}
                />
              </div>
            </>
          )}

          {toStatus === "proposal_sent" && (
            <div className="space-y-1">
              <Label className="text-xs">
                {t("leads.kanban.transition.reason_optional")}
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("leads.kanban.transition.reason_placeholder")}
                rows={2}
              />
            </div>
          )}

          {toStatus === "lost" && (
            <div className="space-y-1">
              <Label className="text-xs">
                {t("leads.kanban.transition.reason_optional")}
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("leads.kanban.transition.reason_placeholder")}
                rows={2}
              />
            </div>
          )}

          {toStatus === "nurturing" && (
            <div className="space-y-1">
              <Label className="text-xs">
                {t("leads.kanban.transition.reason_optional")}
              </Label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("leads.kanban.transition.reason_placeholder")}
                rows={2}
              />
            </div>
          )}

          {isAutoConfirm && (
            <p className="text-muted-foreground text-xs">
              {t("leads.kanban.transition.auto_confirm_message")}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!isAutoConfirm && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onTransitionCancel}
              disabled={isSubmitting}
            >
              {t("leads.step_actions.cancel")}
            </Button>
            <Button
              size="sm"
              onClick={() => handleDragConfirm(pendingTransition)}
              disabled={!canConfirmDrag || isSubmitting}
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
        )}
      </div>
    );
  }

  // ── Cal.com inline embed mode ─────────────────────────────────────

  if (showCalEmbed) {
    const slug = CALCOM_SLUGS[locale] || CALCOM_SLUGS.en;
    const guestName = [lead.first_name, lead.last_name]
      .filter(Boolean)
      .join(" ");

    return (
      <div ref={containerRef} className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-foreground text-xs font-semibold tracking-wider uppercase">
            {t("leads.step_actions.book_demo")}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShowCalEmbed?.(false)}
          >
            {t("leads.step_actions.cancel")}
          </Button>
        </div>
        <Cal
          namespace="fleetcore-demo"
          calLink={slug}
          calOrigin={CALCOM_ORIGIN}
          embedJsUrl={`${CALCOM_ORIGIN}/embed/embed.js`}
          config={{
            theme: "light",
            locale,
            ...(guestName && { name: guestName }),
            ...(lead.email && { email: lead.email }),
          }}
          style={{ width: "100%", height: "100%", overflow: "auto" }}
        />
      </div>
    );
  }

  // ── Normal mode: manual step actions ───────────────────────────────

  if (actions.length === 0) return null;

  return (
    <div
      ref={containerRef}
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
                disabled={action.isDisabled || isSubmitting}
                className={cn(
                  "flex w-full cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-sm font-medium transition-all",
                  action.isDisabled
                    ? "border-muted bg-muted/50 text-muted-foreground cursor-not-allowed opacity-60"
                    : isSelected
                      ? `${action.borderColor} ${action.bgSelected}`
                      : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="flex-1">
                  <span className="block">
                    {t(`leads.step_actions.${action.id}`)}
                    {action.isDisabled && (
                      <span className="text-muted-foreground ml-2 text-xs font-normal">
                        — {t("leads.step_actions.coming_soon")}
                      </span>
                    )}
                  </span>
                  {action.hint && (
                    <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                      {t(`leads.step_actions.${action.hint}`)}
                    </p>
                  )}
                </span>
              </button>

              {/* Expanded sub-fields (ml-8 indent) */}
              {isSelected && action.needsConfirm && (
                <div className="mt-2 ml-8 space-y-3">
                  {/* Nurturing toggle for "not_interested" */}
                  {action.id === "not_interested" && (
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={nurturingToggle}
                        onCheckedChange={setNurturingToggle}
                        id="nurturing-toggle"
                      />
                      <Label
                        htmlFor="nurturing-toggle"
                        className="cursor-pointer text-xs"
                      >
                        {t("leads.step_actions.nurturing_toggle")}
                      </Label>
                    </div>
                  )}

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
