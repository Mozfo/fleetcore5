"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, FileText, XCircle, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead, LeadStatus } from "../../types/lead.types";

type TransitionChoice = "book_demo" | "send_quotation" | "not_interested";

interface CallbackTransitionModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function CallbackTransitionModal({
  open,
  lead,
  onClose,
  onConfirm,
}: CallbackTransitionModalProps) {
  const { t } = useTranslation("crm");
  const invalidate = useInvalidate();
  const [choice, setChoice] = React.useState<TransitionChoice | null>(null);
  const [demoDate, setDemoDate] = React.useState("");
  const [nurturing, setNurturing] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setChoice(null);
      setDemoDate("");
      setNurturing(false);
      setReason("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!lead || !choice) return;

    setIsSubmitting(true);
    try {
      let targetStatus: LeadStatus;
      const options: {
        lossReasonCode?: string;
        nurturingReasonCode?: string;
        reasonDetail?: string;
      } = {};

      if (choice === "book_demo") {
        if (!demoDate) {
          toast.error(t("leads.kanban.transition.demo_date_required"));
          setIsSubmitting(false);
          return;
        }
        targetStatus = "demo" as LeadStatus;
        options.reasonDetail = `Demo scheduled: ${demoDate}`;
      } else if (choice === "not_interested") {
        if (nurturing) {
          targetStatus = "nurturing" as LeadStatus;
          options.nurturingReasonCode = "not_interested_callback";
        } else {
          targetStatus = "lost" as LeadStatus;
          options.lossReasonCode = "not_interested";
        }
        if (reason) {
          options.reasonDetail = reason;
        }
      } else {
        setIsSubmitting(false);
        return;
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
            {t("leads.kanban.transition.callback_title")}
          </DialogTitle>
          <DialogDescription>
            {t("leads.kanban.transition.callback_description", {
              company: companyName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Option 1: Book Demo */}
          <button
            type="button"
            onClick={() => setChoice("book_demo")}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              choice === "book_demo"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "hover:bg-muted"
            }`}
          >
            <CalendarDays className="size-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">
                {t("leads.kanban.transition.book_demo")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("leads.kanban.transition.book_demo_desc")}
              </p>
            </div>
          </button>

          {/* Demo date field */}
          {choice === "book_demo" && (
            <div className="ml-8 space-y-2">
              <Label htmlFor="demo-date">
                {t("leads.kanban.transition.demo_date")}
              </Label>
              <Input
                id="demo-date"
                type="datetime-local"
                value={demoDate}
                onChange={(e) => setDemoDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>
          )}

          {/* Option 2: Send Quotation (placeholder) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                disabled
                className="flex w-full items-center gap-3 rounded-lg border p-3 text-left opacity-50"
              >
                <FileText className="size-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">
                    {t("leads.kanban.transition.send_quotation")}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("leads.kanban.transition.coming_soon")}
                  </p>
                </div>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {t("leads.kanban.transition.quotation_coming_soon")}
            </TooltipContent>
          </Tooltip>

          {/* Option 3: Not Interested */}
          <button
            type="button"
            onClick={() => setChoice("not_interested")}
            className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              choice === "not_interested"
                ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                : "hover:bg-muted"
            }`}
          >
            <XCircle className="size-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">
                {t("leads.kanban.transition.not_interested")}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("leads.kanban.transition.not_interested_desc")}
              </p>
            </div>
          </button>

          {/* Not interested sub-fields */}
          {choice === "not_interested" && (
            <div className="ml-8 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="nurturing-toggle"
                  checked={nurturing}
                  onCheckedChange={setNurturing}
                />
                <Label htmlFor="nurturing-toggle" className="text-sm">
                  {t("leads.kanban.transition.move_to_nurturing")}
                </Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="reason" className="text-xs">
                  {t("leads.kanban.transition.reason_optional")}
                </Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={t("leads.kanban.transition.reason_placeholder")}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("leads.kanban.transition.cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!choice || choice === "send_quotation" || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {t("leads.kanban.transition.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
