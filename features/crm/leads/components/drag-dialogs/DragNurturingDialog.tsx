"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead } from "@/types/crm";

interface DragNurturingDialogProps {
  open: boolean;
  lead: Lead;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragNurturingDialog({
  open,
  lead,
  onConfirm,
  onCancel,
}: DragNurturingDialogProps) {
  const { t } = useTranslation("crm");

  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const options: { reasonDetail?: string } = {};
      if (note.trim()) {
        options.reasonDetail = note.trim();
      }

      const result = await updateLeadStatusAction(
        lead.id,
        "nurturing",
        options
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(t("leads.kanban.drag.success"));
      onConfirm();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("leads.step_actions.error")
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [note, lead.id, t, onConfirm]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>
            {t("leads.kanban.drag.nurturing.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("leads.kanban.drag.nurturing.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("leads.kanban.drag.nurturing.note_placeholder")}
          maxLength={500}
          rows={3}
          disabled={isSubmitting}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("leads.kanban.drag.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("leads.step_actions.confirming")}
              </>
            ) : (
              t("leads.kanban.drag.nurturing.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
