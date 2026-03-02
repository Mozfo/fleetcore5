"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Check, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select-native";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  qualifyLead,
  patchLeadStatus,
  disqualifyLead,
} from "@/lib/providers/refine-data-provider";
import {
  type BantKey,
  BANT_DIMENSIONS,
  isQualifying,
  findLabel,
} from "@/lib/constants/crm/bant.constants";
import type { Lead } from "@/types/crm";

// ── Internal state machine ──────────────────────────────────────────────

type DialogPhase =
  | "bant_form"
  | "partial_nurturing"
  | "partial_disqualify"
  | "disqualify_form";

interface DragQualifyDialogProps {
  open: boolean;
  lead: Lead;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragQualifyDialog({
  open,
  lead,
  onConfirm,
  onCancel,
}: DragQualifyDialogProps) {
  const { t } = useTranslation("crm");

  // BANT form values
  const [budget, setBudget] = useState(lead.bant_budget ?? "");
  const [authority, setAuthority] = useState(lead.bant_authority ?? "");
  const [need, setNeed] = useState(lead.bant_need ?? "");
  const [timeline, setTimeline] = useState(lead.bant_timeline ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Phase state
  const [phase, setPhase] = useState<DialogPhase>("bant_form");
  const [qualifyResult, setQualifyResult] = useState<{
    criteriaMet: number;
    fleetSizeException: boolean;
    result: string;
  } | null>(null);

  const values: Record<BantKey, string> = useMemo(
    () => ({ budget, authority, need, timeline }),
    [budget, authority, need, timeline]
  );
  const setters: Record<BantKey, (v: string) => void> = {
    budget: setBudget,
    authority: setAuthority,
    need: setNeed,
    timeline: setTimeline,
  };

  const labelKeys: Record<BantKey, { key: string; defaultValue: string }> = {
    budget: { key: "leads.bant.budget", defaultValue: "Budget Confirmed?" },
    authority: { key: "leads.bant.authority", defaultValue: "Decision Maker?" },
    need: { key: "leads.bant.need", defaultValue: "Primary Need?" },
    timeline: {
      key: "leads.bant.timeline_field",
      defaultValue: "Start Timeline?",
    },
  };

  const allFilled =
    budget !== "" && authority !== "" && need !== "" && timeline !== "";

  const criteriaMet = useMemo(() => {
    let count = 0;
    for (const dim of BANT_DIMENSIONS) {
      if (isQualifying(dim.options, values[dim.key])) count++;
    }
    return count;
  }, [values]);

  // ── Step 1: Qualify ───────────────────────────────────────────────────

  const handleQualify = useCallback(async () => {
    if (!allFilled) return;
    setIsSubmitting(true);

    try {
      const result = await qualifyLead(lead.id, {
        bant_budget: budget,
        bant_authority: authority,
        bant_need: need,
        bant_timeline: timeline,
      });

      if (result.result === "qualified") {
        toast.success(t("leads.kanban.drag.success"));
        onConfirm();
        return;
      }

      // <4/4 → show appropriate phase
      setQualifyResult({
        criteriaMet: result.criteria_met,
        fleetSizeException: result.fleet_size_exception,
        result: result.result,
      });

      if (result.result === "nurturing") {
        setPhase("partial_nurturing");
      } else {
        // disqualified suggestion
        setPhase("partial_disqualify");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("leads.step_actions.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [allFilled, budget, authority, need, timeline, lead.id, t, onConfirm]);

  // ── Step 2a: Confirm nurturing ────────────────────────────────────────

  const handleSendNurturing = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await patchLeadStatus(lead.id, "nurturing");
      toast.success(t("leads.kanban.drag.success"));
      onConfirm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("leads.step_actions.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [lead.id, t, onConfirm]);

  // ── Step 2b: Confirm disqualify (simple) ──────────────────────────────

  const handleSimpleDisqualify = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await disqualifyLead(lead.id, {
        reason: "no_response",
        comment: `Auto-disqualified via BANT (${qualifyResult?.criteriaMet ?? 0}/4 criteria)`,
      });
      toast.success(t("leads.kanban.drag.success"));
      onConfirm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("leads.step_actions.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [lead.id, qualifyResult, t, onConfirm]);

  // ── Partial result message ────────────────────────────────────────────

  const partialMessage = useMemo(() => {
    if (!qualifyResult) return "";
    const met = qualifyResult.criteriaMet;

    if (
      qualifyResult.result === "nurturing" &&
      qualifyResult.fleetSizeException
    ) {
      return t("leads.kanban.drag.qualify.partial_big_fleet", {
        count: met,
        size: lead.fleet_size ?? "?",
      });
    }
    if (qualifyResult.result === "nurturing") {
      return t("leads.kanban.drag.qualify.partial_nurturing", { count: met });
    }
    return t("leads.kanban.drag.qualify.partial_disqualify", { count: met });
  }, [qualifyResult, lead.fleet_size, t]);

  // ── BANT summary render ───────────────────────────────────────────────

  const bantSummary = (
    <div className="space-y-2 rounded-lg border p-3">
      {BANT_DIMENSIONS.map((dim) => {
        const val = values[dim.key];
        const label = findLabel(dim.options, val);
        const qualifying = isQualifying(dim.options, val);
        return (
          <div
            key={dim.key}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-muted-foreground">
              {t(labelKeys[dim.key].key, {
                defaultValue: labelKeys[dim.key].defaultValue,
              })}
            </span>
            <div className="flex items-center gap-1.5">
              {qualifying ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-400" />
              )}
              <span
                className={cn(
                  "font-medium",
                  qualifying
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                {label || "—"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>
            {t("leads.kanban.drag.qualify.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("leads.kanban.drag.qualify.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* ── Phase: BANT form ─────────────────────────────────────── */}
        {phase === "bant_form" && (
          <>
            <div className="space-y-3">
              {BANT_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">
                    {t(labelKeys[dim.key].key, {
                      defaultValue: labelKeys[dim.key].defaultValue,
                    })}
                  </Label>
                  <Select
                    value={values[dim.key]}
                    onChange={(e) => setters[dim.key](e.target.value)}
                    disabled={isSubmitting}
                    className="h-9"
                  >
                    <option value="">—</option>
                    {dim.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.qualifying ? `✓ ${opt.label}` : opt.label}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>

            <Separator />

            <div className="text-muted-foreground text-center text-sm">
              {criteriaMet}/4{" "}
              {t("leads.bant.criteria", { defaultValue: "criteria OK" })}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t("leads.kanban.drag.cancel")}
              </Button>
              <Button
                onClick={handleQualify}
                disabled={!allFilled || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("leads.bant.qualifying", {
                      defaultValue: "Qualifying...",
                    })}
                  </>
                ) : (
                  t("leads.kanban.drag.qualify.confirm")
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Phase: Partial → Nurturing ───────────────────────────── */}
        {phase === "partial_nurturing" && (
          <>
            {bantSummary}
            <p className="text-muted-foreground text-sm">{partialMessage}</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t("leads.kanban.drag.cancel")}
              </Button>
              <Button onClick={handleSendNurturing} disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("leads.kanban.drag.qualify.send_nurturing")}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── Phase: Partial → Disqualify ──────────────────────────── */}
        {phase === "partial_disqualify" && (
          <>
            {bantSummary}
            <p className="text-muted-foreground text-sm">{partialMessage}</p>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t("leads.kanban.drag.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleSimpleDisqualify}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t("leads.kanban.drag.qualify.disqualify")}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
