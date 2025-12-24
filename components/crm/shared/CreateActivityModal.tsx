"use client";

/**
 * Create Activity Modal (Polymorphic)
 *
 * A unified modal for creating activities that can be linked to leads,
 * opportunities, or both. Supports all activity types with type-specific fields.
 *
 * @see lib/actions/crm/activities.actions.ts - createActivityAction
 * @see lib/types/activities.ts - Activity type definition
 */

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

// User-creatable activity types (excludes system-generated types like stage_change, status_change)
type CreatableActivityType = "call" | "email" | "note" | "meeting" | "task";

// Activity types with icons
const ACTIVITY_TYPES: { type: CreatableActivityType; icon: typeof Phone }[] = [
  { type: "call", icon: Phone },
  { type: "email", icon: Mail },
  { type: "note", icon: FileText },
  { type: "meeting", icon: Calendar },
  { type: "task", icon: CheckSquare },
];

// Form validation schema
const formSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(255),
  description: z.string().max(5000).optional(),
  durationMinutes: z.string().optional(),
  outcome: z.string().optional(),
  activityDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export interface CreateActivityModalProps {
  /** Lead ID - provide if linking to a lead */
  leadId?: string;
  /** Opportunity ID - provide if linking to an opportunity */
  opportunityId?: string;
  /** Optional email for pre-filling email activities */
  email?: string | null;
  /** Optional phone for pre-filling call activities */
  phone?: string | null;
  /** Modal open state */
  open: boolean;
  /** Modal open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Success callback */
  onSuccess?: () => void;
}

export function CreateActivityModal({
  leadId,
  opportunityId,
  email,
  phone,
  open,
  onOpenChange,
  onSuccess,
}: CreateActivityModalProps) {
  const { t } = useTranslation("crm");
  const [selectedType, setSelectedType] =
    useState<CreatableActivityType>("note");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subject: "",
      description: "",
    },
  });

  const handleTypeChange = (type: CreatableActivityType) => {
    setSelectedType(type);
    // Pre-fill default subject based on type
    const defaultSubjects: Partial<Record<CreatableActivityType, string>> = {
      call: phone ? `${t("activities.types.call")} - ${phone}` : "",
      email: email ? `${t("activities.types.email")} - ${email}` : "",
    };
    const defaultSubject = defaultSubjects[type];
    if (defaultSubject) {
      setValue("subject", defaultSubject);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    // Parse duration minutes if provided
    const durationMinutes = data.durationMinutes
      ? parseInt(data.durationMinutes)
      : undefined;

    // Create activity with polymorphic linking
    const result = await createActivityAction({
      leadId: leadId || undefined,
      opportunityId: opportunityId || undefined,
      activityType: selectedType,
      subject: data.subject,
      description: data.description || undefined,
      durationMinutes:
        selectedType === "call" || selectedType === "meeting"
          ? durationMinutes
          : undefined,
      outcome: selectedType === "call" ? data.outcome : undefined,
      activityDate: data.activityDate ? new Date(data.activityDate) : undefined,
    });

    setIsSubmitting(false);

    if (result.success) {
      toast.success(t("activities.modal.success"));
      reset();
      onOpenChange(false);
      onSuccess?.();
    } else {
      toast.error(result.error || t("activities.modal.error"));
    }
  };

  const handleClose = () => {
    reset();
    setSelectedType("note");
    onOpenChange(false);
  };

  // Determine entity context for UI
  const entityContext = leadId ? "lead" : opportunityId ? "opportunity" : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {t("activities.modal.title")}
            {entityContext && (
              <span className="text-muted-foreground ml-2 text-sm font-normal">
                ({t(`activities.modal.for_${entityContext}`)})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Activity Type Selection */}
          <div className="space-y-2">
            <Label>{t("activities.modal.select_type")}</Label>
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
                  {t(`activities.types.${type}`)}
                </Button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              {t("activities.modal.fields.subject")}
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder={t("activities.modal.placeholders.subject")}
              className={errors.subject ? "border-red-500" : ""}
            />
            {errors.subject && (
              <p className="text-xs text-red-500">{errors.subject.message}</p>
            )}
          </div>

          {/* Type-specific fields */}
          {(selectedType === "call" || selectedType === "meeting") && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="durationMinutes">
                  {t("activities.modal.fields.duration")}
                </Label>
                <Input
                  id="durationMinutes"
                  type="number"
                  min="0"
                  max="1440"
                  {...register("durationMinutes")}
                  placeholder={selectedType === "call" ? "15" : "30"}
                />
              </div>
              {selectedType === "call" && (
                <div className="space-y-2">
                  <Label htmlFor="outcome">
                    {t("activities.modal.fields.outcome")}
                  </Label>
                  <Select id="outcome" {...register("outcome")}>
                    <option value="">
                      {t("activities.modal.select_outcome")}
                    </option>
                    <option value="answered">
                      {t("activities.outcomes.answered")}
                    </option>
                    <option value="no_answer">
                      {t("activities.outcomes.no_answer")}
                    </option>
                    <option value="voicemail">
                      {t("activities.outcomes.voicemail")}
                    </option>
                    <option value="busy">
                      {t("activities.outcomes.busy")}
                    </option>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Scheduled date for meetings and tasks */}
          {(selectedType === "meeting" || selectedType === "task") && (
            <div className="space-y-2">
              <Label htmlFor="activityDate">
                {t("activities.modal.fields.scheduled_at")}
              </Label>
              <Input
                id="activityDate"
                type="datetime-local"
                {...register("activityDate")}
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t("activities.modal.fields.description")}
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("activities.modal.placeholders.description")}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t("cancel", { ns: "common" })}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("activities.modal.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
