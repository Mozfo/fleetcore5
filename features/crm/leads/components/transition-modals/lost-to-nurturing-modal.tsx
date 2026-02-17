"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInvalidate } from "@refinedev/core";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead, LeadStatus } from "../../types/lead.types";

interface LostToNurturingModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function LostToNurturingModal({
  open,
  lead,
  onClose,
  onConfirm,
}: LostToNurturingModalProps) {
  const { t } = useTranslation("crm");
  const invalidate = useInvalidate();
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) setReason("");
  }, [open]);

  const handleSubmit = async () => {
    if (!lead) return;

    setIsSubmitting(true);
    try {
      const result = await updateLeadStatusAction(
        lead.id,
        "nurturing" as LeadStatus,
        {
          nurturingReasonCode: "reactivation_from_lost",
          reasonDetail: reason || undefined,
        }
      );

      if (result.success) {
        toast.success(t("leads.kanban.transition.success"));
        void invalidate({ resource: "leads", invalidates: ["list"] });
        onConfirm();
      } else {
        toast.error(result.error || t("leads.kanban.transition.error"));
        onClose();
      }
    } catch {
      toast.error(t("leads.kanban.transition.error"));
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyName = lead?.company_name || "Unknown";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("leads.kanban.transition.lost_nurturing_title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.kanban.transition.lost_nurturing_description", {
              company: companyName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="space-y-1">
            <Label htmlFor="reason-nurturing" className="text-sm">
              {t("leads.kanban.transition.reason_optional")}
            </Label>
            <Textarea
              id="reason-nurturing"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("leads.kanban.transition.reason_placeholder")}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("leads.kanban.transition.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("leads.kanban.transition.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
