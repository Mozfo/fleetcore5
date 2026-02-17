"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { Phone, CalendarDays, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead, LeadStatus } from "../../types/lead.types";

type ReactivationChoice = "callback_requested" | "demo";

interface NurturingReactivationModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function NurturingReactivationModal({
  open,
  lead,
  onClose,
  onConfirm,
}: NurturingReactivationModalProps) {
  const { t } = useTranslation("crm");
  const invalidate = useInvalidate();
  const [choice, setChoice] = React.useState<ReactivationChoice | null>(null);
  const [demoDate, setDemoDate] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChoice(null);
      setDemoDate("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!lead || !choice) return;

    if (choice === "demo" && !demoDate) {
      toast.error(t("leads.kanban.transition.demo_date_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      const targetStatus = choice as LeadStatus;
      const options: { reasonDetail?: string } = {};

      if (choice === "demo" && demoDate) {
        options.reasonDetail = `Reactivated from nurturing. Demo scheduled: ${demoDate}`;
      } else if (choice === "callback_requested") {
        options.reasonDetail = "Reactivated from nurturing for callback";
      }

      const result = await updateLeadStatusAction(
        lead.id,
        targetStatus,
        options
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
            {t("leads.kanban.transition.reactivation_title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.kanban.transition.reactivation_description", {
              company: companyName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Option 1: Callback Requested */}
          <button
            type="button"
            onClick={() => setChoice("callback_requested")}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              choice === "callback_requested"
                ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30"
                : "hover:bg-muted"
            }`}
          >
            <Phone className="size-5 text-amber-500" />
            <div>
              <p className="text-sm font-medium">
                {t("leads.kanban.transition.reactivate_callback")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("leads.kanban.transition.reactivate_callback_desc")}
              </p>
            </div>
          </button>

          {/* Option 2: Demo Scheduled */}
          <button
            type="button"
            onClick={() => setChoice("demo")}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              choice === "demo"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "hover:bg-muted"
            }`}
          >
            <CalendarDays className="size-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">
                {t("leads.kanban.transition.reactivate_demo")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("leads.kanban.transition.reactivate_demo_desc")}
              </p>
            </div>
          </button>

          {/* Demo date field */}
          {choice === "demo" && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="reactivate-demo-date">
                {t("leads.kanban.transition.demo_date")}
              </Label>
              <Input
                id="reactivate-demo-date"
                type="datetime-local"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("leads.kanban.transition.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={!choice || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("leads.kanban.transition.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
