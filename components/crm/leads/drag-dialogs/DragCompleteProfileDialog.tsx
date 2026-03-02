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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  updateLeadAction,
  updateLeadStatusAction,
} from "@/lib/actions/crm/lead.actions";
import type { Lead } from "@/types/crm";

interface DragCompleteProfileDialogProps {
  open: boolean;
  lead: Lead;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DragCompleteProfileDialog({
  open,
  lead,
  onConfirm,
  onCancel,
}: DragCompleteProfileDialogProps) {
  const { t } = useTranslation("crm");

  const [phone, setPhone] = useState(lead.phone ?? "");
  const [firstName, setFirstName] = useState(lead.first_name ?? "");
  const [lastName, setLastName] = useState(lead.last_name ?? "");
  const [company, setCompany] = useState(lead.company_name ?? "");
  const [fleetSize, setFleetSize] = useState(lead.fleet_size ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = phone.trim().length > 0;

  const handleConfirm = useCallback(async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);

    try {
      // 1. Update lead fields
      const fields: Record<string, string | null> = {};
      if (phone.trim()) fields.phone = phone.trim();
      if (firstName.trim()) fields.first_name = firstName.trim();
      if (lastName.trim()) fields.last_name = lastName.trim();
      if (company.trim()) fields.company_name = company.trim();
      if (fleetSize) fields.fleet_size = String(fleetSize);

      const updateResult = await updateLeadAction(lead.id, fields);
      if (!updateResult.success) {
        toast.error(updateResult.error);
        return;
      }

      // 2. Transition to callback_requested
      const statusResult = await updateLeadStatusAction(
        lead.id,
        "callback_requested"
      );
      if (!statusResult.success) {
        toast.error(statusResult.error);
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
  }, [
    canSubmit,
    phone,
    firstName,
    lastName,
    company,
    fleetSize,
    lead.id,
    t,
    onConfirm,
  ]);

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
            {t("leads.kanban.drag.complete_profile.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("leads.kanban.drag.complete_profile.title", {
              leadCode: lead.lead_code ?? lead.email,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t("leads.kanban.drag.complete_profile.phone")} *
            </Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 123 4567"
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("leads.kanban.drag.complete_profile.first_name")}
              </Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("leads.kanban.drag.complete_profile.last_name")}
              </Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("leads.kanban.drag.complete_profile.company")}
              </Label>
              <Input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                {t("leads.kanban.drag.complete_profile.fleet_size")}
              </Label>
              <Input
                value={fleetSize}
                onChange={(e) => setFleetSize(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            {t("leads.kanban.drag.cancel")}
          </Button>
          <Button onClick={handleConfirm} disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("leads.step_actions.confirming")}
              </>
            ) : (
              t("leads.kanban.drag.complete_profile.confirm")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
