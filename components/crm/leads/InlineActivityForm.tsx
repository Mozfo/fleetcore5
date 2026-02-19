"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  StickyNote,
  Users,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createActivityAction } from "@/lib/actions/crm/activities.actions";

const ACTIVITY_TYPES = [
  { id: "call" as const, icon: Phone },
  { id: "email" as const, icon: Mail },
  { id: "note" as const, icon: StickyNote },
  { id: "meeting" as const, icon: Users },
  { id: "task" as const, icon: ClipboardList },
];

type ActivityType = "call" | "email" | "note" | "meeting" | "task";

interface InlineActivityFormProps {
  leadId: string;
  leadEmail?: string | null;
  leadPhone?: string | null;
  onSuccess?: () => void;
}

export function InlineActivityForm({
  leadId,
  leadEmail,
  leadPhone,
  onSuccess,
}: InlineActivityFormProps) {
  const { t } = useTranslation("crm");

  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [description, setDescription] = useState("");
  const [differentPhone, setDifferentPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState(leadPhone || "");
  const [differentEmail, setDifferentEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(leadEmail || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const autoTitle = `${activityType} — ${now.toLocaleDateString()}`;

      const result = await createActivityAction({
        leadId,
        activityType,
        subject: autoTitle,
        description: description.trim(),
      });

      if (result.success) {
        toast.success(t("leads.inline_activity.success"));
        setDescription("");
        setDifferentPhone(false);
        setDifferentEmail(false);
        onSuccess?.();
      } else {
        toast.error(result.error || t("leads.inline_activity.error"));
      }
    } catch {
      toast.error(t("leads.inline_activity.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="border-border border-l-foreground/20 space-y-3 rounded-lg border border-l-4 p-4">
      <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
        {t("leads.inline_activity.section_title")}
      </h4>

      {/* Type toggle — 5 icon buttons */}
      <div className="flex gap-1">
        {ACTIVITY_TYPES.map(({ id, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActivityType(id)}
            className={cn(
              "flex cursor-pointer items-center justify-center rounded-md p-2 text-sm transition-colors",
              activityType === id
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
            title={t(`leads.timeline.types.${id}`)}
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>

      {/* Textarea rapport */}
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("leads.step_actions.reason_placeholder")}
        rows={3}
        className="resize-none text-sm"
      />

      {/* Toggle different phone */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={differentPhone}
            onCheckedChange={setDifferentPhone}
            id="different-phone"
          />
          <Label htmlFor="different-phone" className="cursor-pointer text-xs">
            {t("leads.inline_activity.different_phone")}
          </Label>
        </div>
        {differentPhone && (
          <Input
            type="tel"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            className="h-8 text-sm"
          />
        )}
      </div>

      {/* Toggle different email */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Switch
            checked={differentEmail}
            onCheckedChange={setDifferentEmail}
            id="different-email"
          />
          <Label htmlFor="different-email" className="cursor-pointer text-xs">
            {t("leads.inline_activity.different_email")}
          </Label>
        </div>
        {differentEmail && (
          <Input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            className="h-8 text-sm"
          />
        )}
      </div>

      {/* Submit */}
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!description.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {t("leads.inline_activity.submitting")}
          </>
        ) : (
          t("leads.inline_activity.submit")
        )}
      </Button>
    </div>
  );
}
