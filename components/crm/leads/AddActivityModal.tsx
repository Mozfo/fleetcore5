"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Phone,
  Mail,
  FileText,
  Calendar,
  CheckSquare,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createActivityAction } from "@/lib/actions/crm/activities.actions";

type ActivityType = "call" | "email" | "note" | "meeting" | "task";

const ACTIVITY_TYPES: { type: ActivityType; icon: typeof Phone }[] = [
  { type: "call", icon: Phone },
  { type: "email", icon: Mail },
  { type: "note", icon: FileText },
  { type: "meeting", icon: Calendar },
  { type: "task", icon: CheckSquare },
];

const baseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
});

interface AddActivityModalProps {
  leadId: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type FormValues = {
  title: string;
  description?: string;
  duration_minutes?: string;
  outcome?: string;
  phone?: string;
  email_to?: string;
  template?: string;
  location?: string;
  attendees?: string;
  scheduled_at?: string;
};

export function AddActivityModal({
  leadId,
  leadEmail,
  leadPhone,
  open,
  onOpenChange,
  onSuccess,
}: AddActivityModalProps) {
  const { t } = useTranslation("crm");
  const [selectedType, setSelectedType] = useState<ActivityType>("note");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: "",
      description: "",
      phone: leadPhone || "",
      email_to: leadEmail || "",
    },
  });

  const handleTypeChange = (type: ActivityType) => {
    setSelectedType(type);
    // Pre-fill based on type
    if (type === "call" && leadPhone) {
      setValue("phone", leadPhone);
    }
    if (type === "email" && leadEmail) {
      setValue("email_to", leadEmail);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    // Build metadata based on type
    const metadata: Record<string, unknown> = {};

    if (selectedType === "call") {
      if (data.duration_minutes)
        metadata.duration_minutes = parseInt(data.duration_minutes);
      if (data.outcome) metadata.outcome = data.outcome;
      if (data.phone) metadata.phone_number = data.phone;
    } else if (selectedType === "email") {
      if (data.email_to) metadata.to = data.email_to;
      if (data.template) metadata.template_used = data.template;
    } else if (selectedType === "meeting") {
      if (data.duration_minutes)
        metadata.duration_minutes = parseInt(data.duration_minutes);
      if (data.location) metadata.location = data.location;
      if (data.attendees) metadata.attendees = data.attendees;
    }

    const result = await createActivityAction({
      lead_id: leadId,
      activity_type: selectedType,
      title: data.title,
      description: data.description || undefined,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      scheduled_at: data.scheduled_at || undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(t("leads.timeline.add_modal.success"));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || t("leads.timeline.add_modal.error"));
    }
  };

  const handleClose = () => {
    reset();
    setSelectedType("note");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("leads.timeline.add_modal.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Activity Type Selection */}
          <div className="space-y-2">
            <Label>{t("leads.timeline.add_modal.select_type")}</Label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map(({ type, icon: Icon }) => (
                <Button
                  key={type}
                  type="button"
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "flex items-center gap-1.5",
                    selectedType === type && "ring-2 ring-offset-2"
                  )}
                  onClick={() => handleTypeChange(type)}
                >
                  <Icon className="h-4 w-4" />
                  {t(`leads.timeline.types.${type}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t("leads.timeline.add_modal.fields.title")}
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder={t("leads.timeline.add_modal.placeholders.title")}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Type-specific fields */}
          {selectedType === "call" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    {t("leads.timeline.add_modal.fields.duration")}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    {...register("duration_minutes")}
                    placeholder="15"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="outcome">
                    {t("leads.timeline.add_modal.fields.outcome")}
                  </Label>
                  <Select id="outcome" {...register("outcome")}>
                    <option value="">
                      {t("leads.timeline.add_modal.fields.outcome")}
                    </option>
                    <option value="answered">
                      {t("leads.timeline.add_modal.outcomes.answered")}
                    </option>
                    <option value="no_answer">
                      {t("leads.timeline.add_modal.outcomes.no_answer")}
                    </option>
                    <option value="voicemail">
                      {t("leads.timeline.add_modal.outcomes.voicemail")}
                    </option>
                    <option value="busy">
                      {t("leads.timeline.add_modal.outcomes.busy")}
                    </option>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t("leads.timeline.add_modal.fields.phone")}
                </Label>
                <Input id="phone" {...register("phone")} />
              </div>
            </>
          )}

          {selectedType === "email" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email_to">
                  {t("leads.timeline.add_modal.fields.email_to")}
                </Label>
                <Input id="email_to" type="email" {...register("email_to")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template">
                  {t("leads.timeline.add_modal.fields.template")}
                </Label>
                <Input id="template" {...register("template")} />
              </div>
            </>
          )}

          {selectedType === "meeting" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">
                    {t("leads.timeline.add_modal.fields.duration")}
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    {...register("duration_minutes")}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">
                    {t("leads.timeline.add_modal.fields.location")}
                  </Label>
                  <Input
                    id="location"
                    {...register("location")}
                    placeholder={t(
                      "leads.timeline.add_modal.placeholders.location"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">
                  {t("leads.timeline.add_modal.fields.attendees")}
                </Label>
                <Input id="attendees" {...register("attendees")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled_at">
                  {t("leads.timeline.add_modal.fields.scheduled_at")}
                </Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  {...register("scheduled_at")}
                />
              </div>
            </>
          )}

          {selectedType === "task" && (
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">
                {t("leads.timeline.add_modal.fields.scheduled_at")}
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                {...register("scheduled_at")}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("leads.timeline.add_modal.fields.description")}
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t(
                "leads.timeline.add_modal.placeholders.description"
              )}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("common.cancel", { defaultValue: "Cancel" })}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("leads.timeline.add_modal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
