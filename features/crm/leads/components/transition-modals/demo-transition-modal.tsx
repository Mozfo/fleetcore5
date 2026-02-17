"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { FileText, XCircle, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { updateLeadStatusAction } from "@/lib/actions/crm/lead.actions";
import type { Lead, LeadStatus } from "../../types/lead.types";

type TransitionChoice = "send_quotation" | "not_interested";

interface DemoTransitionModalProps {
  open: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DemoTransitionModal({
  open,
  lead,
  onClose,
  onConfirm,
}: DemoTransitionModalProps) {
  const { t } = useTranslation("crm");
  const invalidate = useInvalidate();
  const [choice, setChoice] = React.useState<TransitionChoice | null>(null);
  const [nurturing, setNurturing] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setChoice(null);
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

      if (choice === "not_interested") {
        if (nurturing) {
          targetStatus = "nurturing" as LeadStatus;
          options.nurturingReasonCode = "not_interested_demo";
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
          <DialogTitle>{t("leads.kanban.transition.demo_title")}</DialogTitle>
          <DialogDescription>
            {t("leads.kanban.transition.demo_description", {
              company: companyName,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {/* Option 1: Send Quotation (placeholder) */}
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

          {/* Option 2: Not Interested */}
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

          {choice === "not_interested" && (
            <div className="ml-8 space-y-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="nurturing-toggle-demo"
                  checked={nurturing}
                  onCheckedChange={setNurturing}
                />
                <Label htmlFor="nurturing-toggle-demo" className="text-sm">
                  {t("leads.kanban.transition.move_to_nurturing")}
                </Label>
              </div>
              <div className="space-y-1">
                <Label htmlFor="reason-demo" className="text-xs">
                  {t("leads.kanban.transition.reason_optional")}
                </Label>
                <Textarea
                  id="reason-demo"
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
