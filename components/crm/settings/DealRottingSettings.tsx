/**
 * DealRottingSettings - Deal Rotting Configuration
 *
 * Allows configuration of deal rotting detection:
 * - Enable/disable rotting detection
 * - Use stage max_days or global threshold
 * - Alert settings (owner, manager)
 * - Cron time for daily checks
 *
 * @module components/crm/settings/DealRottingSettings
 */

"use client";

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Bell,
  AlertTriangle,
  Save,
  RotateCcw,
  Loader2,
  Check,
  Info,
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

export interface DealRottingConfig {
  enabled: boolean;
  use_stage_max_days: boolean;
  global_threshold_days: number | null;
  alert_owner: boolean;
  alert_manager: boolean;
  cron_time: string;
}

interface DealRottingSettingsProps {
  config: DealRottingConfig | null;
  onSave: (config: DealRottingConfig) => Promise<void>;
}

const DEFAULT_CONFIG: DealRottingConfig = {
  enabled: true,
  use_stage_max_days: true,
  global_threshold_days: null,
  alert_owner: true,
  alert_manager: true,
  cron_time: "08:00",
};

export function DealRottingSettings({
  config,
  onSave,
}: DealRottingSettingsProps) {
  const { t } = useTranslation("crm");

  // Local state
  const [localConfig, setLocalConfig] = useState<DealRottingConfig>(
    config || DEFAULT_CONFIG
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check for changes
  const initialConfig = config || DEFAULT_CONFIG;
  const hasChanges =
    JSON.stringify(localConfig) !== JSON.stringify(initialConfig);

  // Handlers
  const handleToggle = (field: keyof DealRottingConfig) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleThresholdModeChange = (useStageMaxDays: boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      use_stage_max_days: useStageMaxDays,
      global_threshold_days: useStageMaxDays
        ? null
        : prev.global_threshold_days || 30,
    }));
  };

  const handleGlobalThresholdChange = (days: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      global_threshold_days: days,
    }));
  };

  const handleCronTimeChange = (time: string) => {
    setLocalConfig((prev) => ({
      ...prev,
      cron_time: time,
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
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <CardTitle>
              {t(
                "settings.pipeline.dealRotting.title",
                "Deal Rotting Detection"
              )}
            </CardTitle>
            {hasChanges && (
              <span className="bg-fc-warning-50 text-fc-warning-600 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-yellow-900/50 dark:text-yellow-300">
                {t("settings.unsavedChanges", "Unsaved")}
              </span>
            )}
          </div>
          <Switch
            checked={localConfig.enabled}
            onCheckedChange={() => handleToggle("enabled")}
          />
        </div>
        <CardDescription>
          {t(
            "settings.pipeline.dealRotting.description",
            "Automatically detect opportunities that have been inactive too long in a stage."
          )}
        </CardDescription>
      </CardHeader>

      {localConfig.enabled && (
        <CardContent className="space-y-6">
          {/* Threshold Mode */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              {t(
                "settings.pipeline.dealRotting.thresholdMode",
                "Threshold Mode"
              )}
            </Label>

            <div className="space-y-3">
              {/* Option 1: Use stage max days */}
              <label className="hover:bg-fc-bg-hover flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                <input
                  type="radio"
                  name="thresholdMode"
                  checked={localConfig.use_stage_max_days}
                  onChange={() => handleThresholdModeChange(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {t(
                      "settings.pipeline.dealRotting.useStageMaxDays",
                      "Use stage max days"
                    )}
                  </div>
                  <div className="text-fc-text-muted text-sm">
                    {t(
                      "settings.pipeline.dealRotting.useStageMaxDaysDesc",
                      "Each stage has its own max days threshold (configured above)"
                    )}
                  </div>
                </div>
              </label>

              {/* Option 2: Global threshold */}
              <label className="hover:bg-fc-bg-hover flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors">
                <input
                  type="radio"
                  name="thresholdMode"
                  checked={!localConfig.use_stage_max_days}
                  onChange={() => handleThresholdModeChange(false)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium">
                    {t(
                      "settings.pipeline.dealRotting.globalThreshold",
                      "Global threshold"
                    )}
                  </div>
                  <div className="text-fc-text-muted text-sm">
                    {t(
                      "settings.pipeline.dealRotting.globalThresholdDesc",
                      "Apply the same threshold to all stages"
                    )}
                  </div>
                  {!localConfig.use_stage_max_days && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={localConfig.global_threshold_days || 30}
                        onChange={(e) =>
                          handleGlobalThresholdChange(Number(e.target.value))
                        }
                        className="w-24"
                      />
                      <span className="text-fc-text-muted text-sm">
                        {t("settings.pipeline.dealRotting.days", "days")}
                      </span>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">
              {t(
                "settings.pipeline.dealRotting.alertSettings",
                "Alert Settings"
              )}
            </Label>

            <div className="space-y-3">
              {/* Alert Owner */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Bell className="text-fc-text-muted h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {t(
                        "settings.pipeline.dealRotting.alertOwner",
                        "Alert deal owner"
                      )}
                    </div>
                    <div className="text-fc-text-muted text-sm">
                      {t(
                        "settings.pipeline.dealRotting.alertOwnerDesc",
                        "Send email notification to the opportunity owner"
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={localConfig.alert_owner}
                  onCheckedChange={() => handleToggle("alert_owner")}
                />
              </div>

              {/* Alert Manager */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Bell className="text-fc-text-muted h-4 w-4" />
                  <div>
                    <div className="font-medium">
                      {t(
                        "settings.pipeline.dealRotting.alertManager",
                        "Alert manager"
                      )}
                    </div>
                    <div className="text-fc-text-muted text-sm">
                      {t(
                        "settings.pipeline.dealRotting.alertManagerDesc",
                        "Include rotting deals in daily manager digest"
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={localConfig.alert_manager}
                  onCheckedChange={() => handleToggle("alert_manager")}
                />
              </div>
            </div>
          </div>

          {/* Cron Time */}
          <div className="space-y-2">
            <Label htmlFor="cronTime" className="text-sm font-medium">
              {t("settings.pipeline.dealRotting.checkTime", "Daily check time")}
            </Label>
            <div className="flex items-center gap-3">
              <Clock className="text-fc-text-muted h-4 w-4" />
              <Input
                id="cronTime"
                type="time"
                value={localConfig.cron_time}
                onChange={(e) => handleCronTimeChange(e.target.value)}
                className="w-32"
              />
              <span className="text-fc-text-muted text-sm">
                {t(
                  "settings.pipeline.dealRotting.timezone",
                  "(server timezone)"
                )}
              </span>
            </div>
            <div className="bg-fc-primary-50 text-fc-primary-600 flex items-start gap-2 rounded-lg p-3 text-sm dark:bg-blue-900/20 dark:text-blue-300">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {t(
                  "settings.pipeline.dealRotting.cronInfo",
                  "The system will check for rotting deals daily at this time and send alerts if any are found."
                )}
              </span>
            </div>
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
      )}
    </Card>
  );
}
