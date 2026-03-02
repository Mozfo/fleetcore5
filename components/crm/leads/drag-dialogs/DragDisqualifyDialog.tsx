"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Ban, Check, Loader2, ShieldAlert } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { disqualifyLead } from "@/lib/providers/refine-data-provider";
import {
  DISQUALIFICATION_REASONS,
  type DisqualificationReason,
} from "@/lib/constants/crm/disqualify.constants";
import type { Lead } from "@/types/crm";

interface DragDisqualifyDialogProps {
  open: boolean;
  lead: Lead;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragDisqualifyDialog({
  open,
  lead,
  onConfirm,
  onCancel,
}: DragDisqualifyDialogProps) {
  const { t } = useTranslation("crm");

  const [reason, setReason] = useState<DisqualificationReason | null>(null);
  const [comment, setComment] = useState("");
  const [blacklist, setBlacklist] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOther = reason === "other";
  const commentRequired = isOther && comment.trim().length === 0;
  const canSubmit = reason !== null && !commentRequired;

  const handleConfirm = useCallback(async () => {
    if (!canSubmit || !reason) return;
    setIsSubmitting(true);

    try {
      await disqualifyLead(lead.id, {
        reason,
        comment: comment.trim() || null,
        blacklist,
      });

      toast.success(
        blacklist
          ? t("leads.disqualify.successBlacklist")
          : t("leads.disqualify.success")
      );
      onConfirm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("leads.disqualify.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canSubmit, reason, comment, blacklist, lead.id, t, onConfirm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Ban className="h-5 w-5" />
            {t("leads.kanban.drag.disqualify.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("leads.kanban.drag.disqualify.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Reason selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("leads.kanban.drag.disqualify.reason")} *
          </Label>
          <div className="space-y-1 rounded-lg border p-2">
            {DISQUALIFICATION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  reason === r
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <span className="flex-1 text-sm">
                  {t(`leads.kanban.drag.disqualify.reasons.${r}`)}
                </span>
                {reason === r && <Check className="h-4 w-4 text-orange-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        {reason && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("leads.kanban.drag.disqualify.comment")}
              {isOther && " *"}
            </Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              disabled={isSubmitting}
              className={cn(
                isOther &&
                  commentRequired &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {isOther && commentRequired && (
              <p className="text-xs text-red-500">
                {t("leads.kanban.drag.disqualify.comment_required_other")}
              </p>
            )}
          </div>
        )}

        {/* Blacklist option */}
        {reason && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <Label className="flex items-start gap-3">
              <Checkbox
                checked={blacklist}
                onCheckedChange={(checked) => setBlacklist(checked === true)}
                className="mt-0.5"
              />
              <div>
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4" />
                  {t("leads.kanban.drag.disqualify.blacklist")}
                </span>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t("leads.kanban.drag.disqualify.blacklist_hint")}
                </p>
              </div>
            </Label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("leads.kanban.drag.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("leads.disqualify.submitting")}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Ban className="h-4 w-4" />
                {t("leads.kanban.drag.disqualify.confirm")}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
