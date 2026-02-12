/**
 * RecoveryWorkflowSettings - Recovery Workflow Configuration
 *
 * Configure how lost opportunities are handled for recovery:
 * - Auto-create follow-up tasks
 * - Send reminder emails
 * - Auto-reopen opportunities
 *
 * @module components/crm/settings/RecoveryWorkflowSettings
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshCw,
  Bell as _Bell,
  Calendar,
  Save,
  RotateCcw,
  Loader2,
  Check,
  Info,
  MailOpen,
  ListTodo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface RecoveryWorkflowConfig {
  auto_create_followup: boolean;
  send_reminder_email: boolean;
  reminder_days_before: number;
  auto_reopen: boolean;
}

interface RecoveryWorkflowSettingsProps {
  config: RecoveryWorkflowConfig | null;
  onSave: (config: RecoveryWorkflowConfig) => Promise<void>;
}

const DEFAULT_CONFIG: RecoveryWorkflowConfig = {
  auto_create_followup: true,
  send_reminder_email: true,
  reminder_days_before: 7,
  auto_reopen: false,
};

export function RecoveryWorkflowSettings({
  config,
  onSave,
}: RecoveryWorkflowSettingsProps) {
  const { t } = useTranslation("crm");

  // Local state
  const [localConfig, setLocalConfig] = useState<RecoveryWorkflowConfig>(
    config || DEFAULT_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check for changes
  const initialConfig = config || DEFAULT_CONFIG;
  const hasChanges =
    JSON.stringify(localConfig) !== JSON.stringify(initialConfig);

  // Handlers
  const handleToggle = (field: keyof RecoveryWorkflowConfig) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleReminderDaysChange = (days: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      reminder_days_before: Math.max(1, Math.min(30, days)),
    }));
  };

  const handleReset = useCallback(() => {
    setLocalConfig(initialConfig);
  }, [initialConfig]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave(localConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  }, [localConfig, onSave]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-green-500" />
            <CardTitle>
              {t("settings.lossReasons.recovery.title", "Recovery Workflow")}
            </CardTitle>
            {hasChanges && (
              <span className="bg-fc-warning-50 text-fc-warning-600 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-yellow-900/50 dark:text-yellow-300">
                {t("settings.unsavedChanges", "Unsaved")}
              </span>
            )}
          </div>
        </div>
        <CardDescription>
          {t(
            "settings.lossReasons.recovery.description",
            "Configure automatic actions for recovering lost opportunities marked as recoverable."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Auto-create follow-up */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <ListTodo className="text-fc-text-muted mt-0.5 h-5 w-5" />
            <div>
              <Label className="text-sm font-medium">
                {t(
                  "settings.lossReasons.recovery.autoFollowup",
                  "Auto-create follow-up task"
                )}
              </Label>
              <p className="text-fc-text-muted text-sm">
                {t(
                  "settings.lossReasons.recovery.autoFollowupDesc",
                  "Automatically create a follow-up task when recovery date is reached"
                )}
              </p>
            </div>
          </div>
          <Switch
            checked={localConfig.auto_create_followup}
            onCheckedChange={() => handleToggle("auto_create_followup")}
          />
        </div>

        {/* Send reminder email */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <MailOpen className="text-fc-text-muted mt-0.5 h-5 w-5" />
            <div>
              <Label className="text-sm font-medium">
                {t(
                  "settings.lossReasons.recovery.sendReminder",
                  "Send reminder email"
                )}
              </Label>
              <p className="text-fc-text-muted text-sm">
                {t(
                  "settings.lossReasons.recovery.sendReminderDesc",
                  "Send email notification to opportunity owner before recovery date"
                )}
              </p>
            </div>
          </div>
          <Switch
            checked={localConfig.send_reminder_email}
            onCheckedChange={() => handleToggle("send_reminder_email")}
          />
        </div>

        {/* Reminder days before - only if send_reminder_email is enabled */}
        {localConfig.send_reminder_email && (
          <div className="border-fc-primary-500/20 ml-8 space-y-2 border-l-2 pl-4">
            <Label htmlFor="reminderDays">
              {t(
                "settings.lossReasons.recovery.reminderDays",
                "Reminder days before"
              )}
            </Label>
            <div className="flex items-center gap-3">
              <Calendar className="text-fc-text-muted h-4 w-4" />
              <Input
                id="reminderDays"
                type="number"
                min={1}
                max={30}
                value={localConfig.reminder_days_before}
                onChange={(e) =>
                  handleReminderDaysChange(Number(e.target.value))
                }
                className="w-24"
              />
              <span className="text-fc-text-muted text-sm">
                {t(
                  "settings.lossReasons.recovery.daysBefore",
                  "days before recovery date"
                )}
              </span>
            </div>
          </div>
        )}

        {/* Auto-reopen */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="flex items-start gap-3">
            <RefreshCw className="text-fc-text-muted mt-0.5 h-5 w-5" />
            <div>
              <Label className="text-sm font-medium">
                {t(
                  "settings.lossReasons.recovery.autoReopen",
                  "Auto-reopen opportunity"
                )}
              </Label>
              <p className="text-fc-text-muted text-sm">
                {t(
                  "settings.lossReasons.recovery.autoReopenDesc",
                  "Automatically reopen the opportunity when recovery date is reached"
                )}
              </p>
              <div className="bg-fc-warning-50 text-fc-warning-600 mt-2 flex items-start gap-2 rounded-md p-2 text-xs dark:bg-amber-900/20 dark:text-amber-300">
                <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                <span>
                  {t(
                    "settings.lossReasons.recovery.autoReopenWarning",
                    "Use with caution - this will reopen opportunities automatically without user action"
                  )}
                </span>
              </div>
            </div>
          </div>
          <Switch
            checked={localConfig.auto_reopen}
            onCheckedChange={() => handleToggle("auto_reopen")}
          />
        </div>

        {/* Info box */}
        <div className="bg-fc-primary-50 text-fc-primary-600 flex items-start gap-2 rounded-lg p-3 text-sm dark:bg-blue-900/20 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            {t(
              "settings.lossReasons.recovery.info",
              "These settings only apply to opportunities marked as lost with a recoverable reason. The recovery date is calculated based on each reason's recovery delay."
            )}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!hasChanges || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            {t("settings.reset", "Reset")}
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? t("settings.saving", "Saving...")
              : saveSuccess
                ? t("settings.saved", "Saved!")
                : t("settings.save", "Save Changes")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
