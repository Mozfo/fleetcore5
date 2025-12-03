/**
 * LossReasonEditor - Modal for editing a loss reason
 *
 * Fields:
 * - Label EN / Label FR
 * - Category (dropdown)
 * - Is Recoverable (toggle)
 * - Recovery delay (days) - if recoverable
 * - Require competitor name (toggle)
 *
 * @module components/crm/settings/LossReasonEditor
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LossReasonConfig } from "./types";

type LossReasonCategory =
  | "price"
  | "product"
  | "competition"
  | "timing"
  | "other";

const CATEGORIES: {
  value: LossReasonCategory;
  labelKey: string;
  icon: string;
}[] = [
  {
    value: "price",
    labelKey: "settings.lossReasons.categories.price",
    icon: "💰",
  },
  {
    value: "product",
    labelKey: "settings.lossReasons.categories.product",
    icon: "📦",
  },
  {
    value: "competition",
    labelKey: "settings.lossReasons.categories.competition",
    icon: "🏆",
  },
  {
    value: "timing",
    labelKey: "settings.lossReasons.categories.timing",
    icon: "⏰",
  },
  {
    value: "other",
    labelKey: "settings.lossReasons.categories.other",
    icon: "❓",
  },
];

interface LossReasonEditorProps {
  reason?: LossReasonConfig | null;
  defaultCategory?: LossReasonCategory;
  isOpen: boolean;
  onClose: () => void;
  onSave: (reason: LossReasonConfig) => Promise<void>;
  existingValues: string[];
}

export function LossReasonEditor({
  reason,
  defaultCategory = "other",
  isOpen,
  onClose,
  onSave,
  existingValues,
}: LossReasonEditorProps) {
  const { t } = useTranslation("crm");
  const isEditing = !!reason;

  // Form state
  const [labelEn, setLabelEn] = useState("");
  const [labelFr, setLabelFr] = useState("");
  const [category, setCategory] = useState<LossReasonCategory>(defaultCategory);
  const [isRecoverable, setIsRecoverable] = useState(false);
  const [recoveryDelayDays, setRecoveryDelayDays] = useState<number>(90);
  const [requireCompetitorName, setRequireCompetitorName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when reason changes
  useEffect(() => {
    if (reason) {
      setLabelEn(reason.label_en);
      setLabelFr(reason.label_fr);
      setCategory(reason.category);
      setIsRecoverable(reason.is_recoverable);
      setRecoveryDelayDays(reason.recovery_delay_days || 90);
      setRequireCompetitorName(reason.require_competitor_name);
    } else {
      setLabelEn("");
      setLabelFr("");
      setCategory(defaultCategory);
      setIsRecoverable(false);
      setRecoveryDelayDays(90);
      setRequireCompetitorName(false);
    }
    setError(null);
  }, [reason, defaultCategory, isOpen]);

  // Generate value from label
  const generateValue = (label: string): string => {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "_")
      .slice(0, 50);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!labelEn.trim()) {
      setError(
        t(
          "settings.lossReasons.errors.labelEnRequired",
          "English label is required"
        )
      );
      return false;
    }
    if (!labelFr.trim()) {
      setError(
        t(
          "settings.lossReasons.errors.labelFrRequired",
          "French label is required"
        )
      );
      return false;
    }

    // Check for duplicate value (only for new reasons)
    if (!isEditing) {
      const newValue = generateValue(labelEn);
      if (existingValues.includes(newValue)) {
        setError(
          t(
            "settings.lossReasons.errors.duplicateValue",
            "A reason with this name already exists"
          )
        );
        return false;
      }
    }

    if (isRecoverable && (recoveryDelayDays < 1 || recoveryDelayDays > 365)) {
      setError(
        t(
          "settings.lossReasons.errors.invalidRecoveryDelay",
          "Recovery delay must be between 1 and 365 days"
        )
      );
      return false;
    }

    return true;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const newReason: LossReasonConfig = {
        value: isEditing ? reason.value : generateValue(labelEn),
        label_en: labelEn.trim(),
        label_fr: labelFr.trim(),
        category,
        order: isEditing ? reason.order : Date.now(), // Will be reordered
        is_active: true,
        is_recoverable: isRecoverable,
        recovery_delay_days: isRecoverable ? recoveryDelayDays : null,
        require_competitor_name:
          category === "competition" ? requireCompetitorName : false,
      };

      await onSave(newReason);
      onClose();
    } catch (_err) {
      setError(
        t(
          "settings.lossReasons.errors.saveFailed",
          "Failed to save. Please try again."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("settings.lossReasons.editReason", "Edit Loss Reason")
              : t("settings.lossReasons.addReason", "Add Loss Reason")}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t(
                  "settings.lossReasons.editReasonDesc",
                  "Modify the loss reason details."
                )
              : t(
                  "settings.lossReasons.addReasonDesc",
                  "Create a new loss reason for tracking lost opportunities."
                )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Labels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labelEn">
                {t("settings.lossReasons.fields.labelEn", "Label (English)")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="labelEn"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="e.g., Price too high"
                maxLength={100}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="labelFr">
                {t("settings.lossReasons.fields.labelFr", "Label (French)")}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="labelFr"
                value={labelFr}
                onChange={(e) => setLabelFr(e.target.value)}
                placeholder="ex: Prix trop élevé"
                maxLength={100}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              {t("settings.lossReasons.fields.category", "Category")}
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as LossReasonCategory)
              }
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {t(cat.labelKey, cat.value)}
                </option>
              ))}
            </select>
          </div>

          {/* Is Recoverable */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm font-medium">
                {t("settings.lossReasons.fields.isRecoverable", "Recoverable")}
              </Label>
              <p className="text-muted-foreground text-xs">
                {t(
                  "settings.lossReasons.fields.isRecoverableDesc",
                  "Enable follow-up after a delay to attempt recovery"
                )}
              </p>
            </div>
            <Switch
              checked={isRecoverable}
              onCheckedChange={setIsRecoverable}
            />
          </div>

          {/* Recovery Delay - only if recoverable */}
          {isRecoverable && (
            <div className="border-primary/20 space-y-2 border-l-2 pl-4">
              <Label htmlFor="recoveryDelay">
                {t(
                  "settings.lossReasons.fields.recoveryDelay",
                  "Recovery Delay"
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="recoveryDelay"
                  type="number"
                  min={1}
                  max={365}
                  value={recoveryDelayDays}
                  onChange={(e) => setRecoveryDelayDays(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-muted-foreground text-sm">
                  {t("settings.lossReasons.fields.days", "days")}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">
                {t(
                  "settings.lossReasons.fields.recoveryDelayDesc",
                  "Days to wait before scheduling a follow-up"
                )}
              </p>
            </div>
          )}

          {/* Require Competitor Name - only for competition category */}
          {category === "competition" && (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label className="text-sm font-medium">
                  {t(
                    "settings.lossReasons.fields.requireCompetitor",
                    "Require Competitor Name"
                  )}
                </Label>
                <p className="text-muted-foreground text-xs">
                  {t(
                    "settings.lossReasons.fields.requireCompetitorDesc",
                    "Require entering competitor name when selecting this reason"
                  )}
                </p>
              </div>
              <Switch
                checked={requireCompetitorName}
                onCheckedChange={setRequireCompetitorName}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            {t("settings.cancel", "Cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving
              ? t("settings.saving", "Saving...")
              : t("settings.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
