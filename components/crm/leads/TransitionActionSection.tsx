"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRightCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInvalidate } from "@refinedev/core";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import type { Lead } from "@/types/crm";
import type { PendingTransition } from "@/features/crm/leads/hooks/use-leads-kanban";

// ── Business logic: derive reason codes from source status ──────────

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

// ── Auto-confirm statuses (no user input needed) ────────────────────

const AUTO_CONFIRM_STATUSES = new Set(["converted", "callback_requested"]);

// ── Component ───────────────────────────────────────────────────────

interface TransitionActionSectionProps {
  lead: Lead;
  transition: PendingTransition;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TransitionActionSection({
  lead,
  transition,
  onConfirm,
  onCancel,
}: TransitionActionSectionProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const invalidate = useInvalidate();
  const { getLabel } = useLeadStatuses();

  const { fromStatus, toStatus } = transition;

  const [demoDate, setDemoDate] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAutoConfirm = AUTO_CONFIRM_STATUSES.has(toStatus);

  const canConfirm =
    isAutoConfirm ||
    toStatus === "lost" ||
    toStatus === "nurturing" ||
    toStatus === "proposal_sent" ||
    (toStatus === "demo" && demoDate !== "");

  const handleConfirm = async () => {
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
      if (note && toStatus !== "lost" && toStatus !== "nurturing") {
        options.reasonDetail = note;
      }

      const result = await updateLeadStatusAction(lead.id, toStatus, options);

      if (result.success) {
        toast.success(t("leads.kanban.transition.success"));
        void invalidate({ resource: "leads", invalidates: ["list"] });
        onConfirm();
      } else {
        toast.error(result.error || t("leads.kanban.transition.error"));
        onCancel();
      }
    } catch {
      toast.error(t("leads.kanban.transition.error"));
      onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  const fromLabel = getLabel(fromStatus, locale);
  const toLabel = getLabel(toStatus, locale);

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <ArrowRightCircle className="size-5 text-amber-600 dark:text-amber-400" />
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
          {t("leads.kanban.transition.section_title", {
            from: fromLabel,
            to: toLabel,
          })}
        </h3>
      </div>

      {/* Conditional fields based on toStatus */}
      <div className="space-y-3">
        {/* Demo: date/time picker + note */}
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

        {/* Proposal sent: coming soon button + note */}
        {toStatus === "proposal_sent" && (
          <>
            <Button variant="outline" size="sm" disabled className="opacity-50">
              {t("leads.kanban.transition.send_quotation")} —{" "}
              {t("leads.kanban.transition.coming_soon")}
            </Button>
            <div className="space-y-1">
              <Label htmlFor="transition-note-proposal" className="text-xs">
                {t("leads.kanban.transition.reason_optional")}
              </Label>
              <Textarea
                id="transition-note-proposal"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("leads.kanban.transition.reason_placeholder")}
                rows={2}
              />
            </div>
          </>
        )}

        {/* Lost: reason textarea */}
        {toStatus === "lost" && (
          <div className="space-y-1">
            <Label htmlFor="transition-loss-reason" className="text-xs">
              {t("leads.kanban.transition.reason_optional")}
            </Label>
            <Textarea
              id="transition-loss-reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("leads.kanban.transition.reason_placeholder")}
              rows={2}
            />
          </div>
        )}

        {/* Nurturing: note textarea */}
        {toStatus === "nurturing" && (
          <div className="space-y-1">
            <Label htmlFor="transition-nurturing-reason" className="text-xs">
              {t("leads.kanban.transition.reason_optional")}
            </Label>
            <Textarea
              id="transition-nurturing-reason"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("leads.kanban.transition.reason_placeholder")}
              rows={2}
            />
          </div>
        )}

        {/* Auto-confirm: info message */}
        {isAutoConfirm && (
          <p className="text-muted-foreground text-xs">
            {t("leads.kanban.transition.auto_confirm_message")}
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t("leads.kanban.transition.cancel")}
        </Button>
        <Button
          size="sm"
          onClick={handleConfirm}
          disabled={!canConfirm || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {t("leads.kanban.transition.confirming")}
            </>
          ) : (
            t("leads.kanban.transition.confirm")
          )}
        </Button>
      </div>
    </div>
  );
}
