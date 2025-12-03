"use client";

/**
 * MarkAsWonModal - Modal to mark an opportunity as won
 *
 * Features:
 * - Pre-populated with expected_value from opportunity
 * - Won date defaults to today
 * - Optional notes field
 * - Calls markOpportunityWonAction server action
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Trophy, Loader2 } from "lucide-react";
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
import { markOpportunityWonAction } from "@/lib/actions/crm/opportunity.actions";
import type { Opportunity } from "@/types/crm";

interface MarkAsWonModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (data: {
    id: string;
    status: string;
    won_date?: string;
    won_value?: number;
  }) => void;
}

export function MarkAsWonModal({
  opportunity,
  isOpen,
  onClose,
  onSuccess,
}: MarkAsWonModalProps) {
  const { t } = useTranslation("crm");

  // Form state
  const [wonValue, setWonValue] = useState<string>("");
  const [wonDate, setWonDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      // Default to expected_value
      setWonValue(opportunity.expected_value?.toString() ?? "");
      // Default to today
      setWonDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [isOpen, opportunity.expected_value]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      setIsSubmitting(true);
      try {
        const result = await markOpportunityWonAction(
          opportunity.id,
          wonValue ? parseFloat(wonValue) : undefined
        );

        if (!result.success) {
          toast.error(result.error || t("opportunity.won_modal.error"));
          return;
        }
        toast.success(t("opportunity.won_modal.success"));
        onSuccess?.(result.data);
        onClose();
      } catch {
        toast.error(t("opportunity.won_modal.error"));
      } finally {
        setIsSubmitting(false);
      }
    },
    [opportunity.id, wonValue, t, onSuccess, onClose]
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
            <Trophy className="h-5 w-5 text-green-600" />
            {t("opportunity.won_modal.title")}
          </DialogTitle>
          <DialogDescription>
            {t("opportunity.won_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Won Value */}
          <div className="space-y-2">
            <Label htmlFor="won-value">
              {t("opportunity.won_modal.won_value")}
            </Label>
            <div className="relative">
              <Input
                id="won-value"
                type="number"
                min="0"
                step="0.01"
                value={wonValue}
                onChange={(e) => setWonValue(e.target.value)}
                placeholder={t("opportunity.won_modal.won_value_placeholder")}
                className="pr-12"
              />
              <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                {opportunity.currency || "EUR"}
              </span>
            </div>
          </div>

          {/* Won Date */}
          <div className="space-y-2">
            <Label htmlFor="won-date">
              {t("opportunity.won_modal.won_date")}
            </Label>
            <Input
              id="won-date"
              type="date"
              value={wonDate}
              onChange={(e) => setWonDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* Notes (optional) */}
          <div className="space-y-2">
            <Label htmlFor="won-notes">
              {t("opportunity.won_modal.notes")}
            </Label>
            <Textarea
              id="won-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("opportunity.won_modal.notes_placeholder")}
              rows={3}
            />
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
              disabled={isSubmitting}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("opportunity.won_modal.confirming")}
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  {t("opportunity.won_modal.confirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
