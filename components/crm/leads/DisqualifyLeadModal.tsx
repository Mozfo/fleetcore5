/**
 * DisqualifyLeadModal - Modal for disqualifying a lead with reason + optional blacklist
 *
 * V6.6: 7 disqualification reasons, optional comment, optional blacklist.
 * Calls POST /api/crm/leads/{id}/disqualify
 */

"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Ban, Check, Loader2, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Lead } from "@/types/crm";

const DISQUALIFICATION_REASONS = [
  "fantasy_email",
  "competitor",
  "no_response",
  "wrong_market",
  "student_test",
  "duplicate",
  "other",
] as const;

type DisqualificationReason = (typeof DISQUALIFICATION_REASONS)[number];

interface DisqualifyLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
  onSuccess: () => void;
}

export function DisqualifyLeadModal({
  isOpen,
  onClose,
  lead,
  onSuccess,
}: DisqualifyLeadModalProps) {
  const { t } = useTranslation("crm");

  const [reason, setReason] = useState<DisqualificationReason | null>(null);
  const [comment, setComment] = useState("");
  const [blacklist, setBlacklist] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOther = reason === "other";
  const commentRequired = isOther && comment.trim().length === 0;
  const canSubmit = reason && !commentRequired;

  const resetState = () => {
    setReason(null);
    setComment("");
    setBlacklist(true);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleConfirm = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/crm/leads/${lead.id}/disqualify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason,
          comment: comment.trim() || null,
          blacklist,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message || "Failed to disqualify lead");
      }

      toast.success(
        blacklist
          ? t("leads.disqualify.successBlacklist")
          : t("leads.disqualify.success")
      );
      resetState();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("leads.disqualify.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const leadName =
    lead.first_name || lead.last_name
      ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim()
      : lead.email || "Unknown";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[480px]"
        data-testid="disqualify-lead-modal"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Ban className="h-5 w-5" />
            {t("leads.disqualify.title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.disqualify.description", { name: leadName })}
          </DialogDescription>
        </DialogHeader>

        {/* Reason Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("leads.disqualify.reasonLabel")} *
          </label>

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
                  {t(`leads.disqualify.reasons.${r}`)}
                </span>
                {reason === r && <Check className="h-4 w-4 text-orange-600" />}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        {reason && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("leads.disqualify.commentLabel")}
              {isOther && " *"}
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("leads.disqualify.commentPlaceholder")}
              maxLength={1000}
              rows={3}
              className={cn(
                isOther &&
                  commentRequired &&
                  "border-red-500 focus-visible:ring-red-500"
              )}
            />
            {isOther && commentRequired && (
              <p className="text-xs text-red-500">
                {t("leads.disqualify.commentRequired")}
              </p>
            )}
            <p className="text-right text-xs text-gray-400">
              {comment.length}/1000
            </p>
          </div>
        )}

        {/* Blacklist Option */}
        {reason && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={blacklist}
                onChange={(e) => setBlacklist(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-800 dark:text-amber-200">
                  <ShieldAlert className="h-4 w-4" />
                  {t("leads.disqualify.blacklistLabel")}
                </span>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t("leads.disqualify.blacklistHint")}
                </p>
              </div>
            </label>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            {t("leads.disqualify.cancel")}
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
                {t("leads.disqualify.confirm")}
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
