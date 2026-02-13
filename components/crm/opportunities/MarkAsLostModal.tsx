"use client";

/**
 * MarkAsLostModal - Modal to mark an opportunity as lost
 *
 * Features:
 * - Required loss reason dropdown (from crm_settings)
 * - Lost date defaults to today
 * - Required notes field (min 20 characters)
 * - Calls markOpportunityLostAction server action
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { XCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { markOpportunityLostAction } from "@/lib/actions/crm/opportunity.actions";
import type { Opportunity } from "@/types/crm";

// Type for loss reason from crm_settings
export interface LossReasonOption {
  value: string;
  label_en: string;
  label_fr: string;
  category: string;
  order: number;
  is_active: boolean;
}

interface MarkAsLostModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: {
    id: string;
    status: string;
    lost_date?: string;
  }) => void;
  lossReasons: LossReasonOption[]; // From crm_settings.opportunity_loss_reasons
}

export function MarkAsLostModal({
  opportunity,
  isOpen,
  onClose,
  onSuccess,
  lossReasons,
}: MarkAsLostModalProps) {
  const { t, i18n } = useTranslation("crm");
  const currentLocale = i18n.language || "en";

  // Form state
  const [lossReason, setLossReason] = useState<string>("");
  const [lostDate, setLostDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [notesError, setNotesError] = useState<string>("");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setLossReason("");
      // Default to today
      setLostDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setNotesError("");
    }
  }, [isOpen]);

  // Validate notes length
  const validateNotes = useCallback(
    (value: string): boolean => {
      if (value.length < 20) {
        setNotesError(t("opportunity.lost_modal.notes_min"));
        return false;
      }
      setNotesError("");
      return true;
    },
    [t]
  );

  const handleNotesChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setNotes(value);
      // Clear error when typing
      if (value.length >= 20) {
        setNotesError("");
      }
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate notes
      if (!validateNotes(notes)) {
        return;
      }

      // Validate reason
      if (!lossReason) {
        toast.error(t("opportunity.lost_modal.select_reason"));
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await markOpportunityLostAction(
          opportunity.id,
          lossReason, // In real implementation, this would be the UUID from DB
          notes
        );

        if (!result.success) {
          toast.error(result.error || t("opportunity.lost_modal.error"));
          return;
        }
        toast.success(t("opportunity.lost_modal.success"));
        onSuccess?.(result.data);
        onClose();
      } catch {
        toast.error(t("opportunity.lost_modal.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [opportunity.id, lossReason, notes, validateNotes, t, onSuccess, onClose]
  );

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-orange-600" />
            {t("opportunity.lost_modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("opportunity.lost_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Loss Reason */}
          <div className="space-y-2">
            <Label htmlFor="loss-reason">
              {t("opportunity.lost_modal.loss_reason")}
            </Label>
            <Select
              id="loss-reason"
              value={lossReason}
              onChange={(e) => setLossReason(e.target.value)}
              required
            >
              <option value="">
                {t("opportunity.lost_modal.select_reason")}
              </option>
              {lossReasons
                .filter((reason) => reason.is_active)
                .sort((a, b) => a.order - b.order)
                .map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {currentLocale === "fr" ? reason.label_fr : reason.label_en}
                  </option>
                ))}
            </Select>
          </div>

          {/* Lost Date */}
          <div className="space-y-2">
            <Label htmlFor="lost-date">
              {t("opportunity.lost_modal.lost_date")}
            </Label>
            <Input
              id="lost-date"
              type="date"
              value={lostDate}
              onChange={(e) => setLostDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Notes (required) */}
          <div className="space-y-2">
            <Label htmlFor="lost-notes">
              {t("opportunity.lost_modal.notes")}{" "}
              <span className="text-destructive">
                {t("opportunity.lost_modal.notes_required")}
              </span>
            </Label>
            <Textarea
              id="lost-notes"
              value={notes}
              onChange={handleNotesChange}
              onBlur={() => validateNotes(notes)}
              placeholder={t("opportunity.lost_modal.notes_placeholder")}
              rows={4}
              required
              className={notesError ? "border-destructive" : ""}
            />
            {notesError && (
              <p className="text-destructive text-sm">{notesError}</p>
            )}
            <p className="text-muted-foreground text-xs">
              {notes.length}/20{" "}
              {t("opportunity.lost_modal.notes_min")
                .replace("Please provide at least ", "")
                .replace("Veuillez fournir au moins ", "")}
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              {t("opportunity.drawer.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !lossReason || notes.length < 20}
              className="bg-orange-600 text-white hover:bg-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("opportunity.lost_modal.confirming")}
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  {t("opportunity.lost_modal.confirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
