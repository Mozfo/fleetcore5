/**
 * LossReasonsSettingsTab - Loss Reasons Configuration Tab
 *
 * Contains:
 * - Loss reasons list organized by category (accordion)
 * - Add/Edit/Delete loss reasons
 * - Recovery workflow configuration
 *
 * @module components/crm/settings/LossReasonsSettingsTab
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  XCircle,
  Plus,
  Save,
  RotateCcw,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  SettingData,
  LossReasonsSettingValue,
  LossReasonConfig,
} from "./types";
import { LossReasonsList, type LossReasonCategory } from "./LossReasonsList";
import { LossReasonEditor } from "./LossReasonEditor";
import {
  RecoveryWorkflowSettings,
  type RecoveryWorkflowConfig,
} from "./RecoveryWorkflowSettings";

// ============================================================================
// Types
// ============================================================================

interface LossReasonsSettingsTabProps {
  lossReasons: SettingData | null;
}

// ============================================================================
// Main Component
// ============================================================================

export function LossReasonsSettingsTab({
  lossReasons,
}: LossReasonsSettingsTabProps) {
  const { t } = useTranslation("crm");

  // Parse initial values
  const initialReasons = useMemo(() => {
    const value = lossReasons?.setting_value as
      | LossReasonsSettingValue
      | undefined;
    return value?.reasons?.sort((a, b) => a.order - b.order) || [];
  }, [lossReasons]);

  const initialRecoveryConfig = useMemo(() => {
    const value = lossReasons?.setting_value as
      | LossReasonsSettingValue
      | undefined;
    return value?.recovery_workflow || null;
  }, [lossReasons]);

  // Local state for reasons
  const [localReasons, setLocalReasons] =
    useState<LossReasonConfig[]>(initialReasons);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor modal state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingReason, setEditingReason] = useState<LossReasonConfig | null>(
    null
  );
  const [editorDefaultCategory, setEditorDefaultCategory] =
    useState<LossReasonCategory>("other");

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reasonToDelete, setReasonToDelete] = useState<LossReasonConfig | null>(
    null
  );

  // Check for changes
  const hasChanges =
    JSON.stringify(localReasons) !== JSON.stringify(initialReasons);

  // Get existing values for validation
  const existingValues = useMemo(
    () => localReasons.map((r) => r.value),
    [localReasons]
  );

  // ============================================================================
  // Handlers
  // ============================================================================

  // Open editor for new reason
  const handleAddReason = useCallback(
    (category: LossReasonCategory = "other") => {
      setEditingReason(null);
      setEditorDefaultCategory(category);
      setEditorOpen(true);
    },
    []
  );

  // Open editor for existing reason
  const handleEditReason = useCallback((reason: LossReasonConfig) => {
    setEditingReason(reason);
    setEditorDefaultCategory(reason.category);
    setEditorOpen(true);
  }, []);

  // Save reason (add or update)
  const handleSaveReason = useCallback(
    async (reason: LossReasonConfig) => {
      if (editingReason) {
        // Update existing
        setLocalReasons((prev) =>
          prev.map((r) => (r.value === editingReason.value ? reason : r))
        );
      } else {
        // Add new with proper order
        const maxOrder = Math.max(0, ...localReasons.map((r) => r.order));
        const newReason = { ...reason, order: maxOrder + 1 };
        setLocalReasons((prev) => [...prev, newReason]);
      }
    },
    [editingReason, localReasons]
  );

  // Confirm delete
  const handleDeleteClick = useCallback((reason: LossReasonConfig) => {
    setReasonToDelete(reason);
    setDeleteConfirmOpen(true);
  }, []);

  // Perform delete
  const handleConfirmDelete = useCallback(() => {
    if (reasonToDelete) {
      setLocalReasons((prev) =>
        prev.filter((r) => r.value !== reasonToDelete.value)
      );
      setReasonToDelete(null);
      setDeleteConfirmOpen(false);
    }
  }, [reasonToDelete]);

  // Reset to initial
  const handleReset = useCallback(() => {
    setLocalReasons(initialReasons);
    setError(null);
  }, [initialReasons]);

  // Save all reasons to API
  const handleSaveAll = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(
        "/api/v1/crm/settings/opportunity_loss_reasons",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setting_value: {
              default: null,
              reasons: localReasons,
              recovery_workflow: initialRecoveryConfig || {
                auto_create_followup: true,
                send_reminder_email: true,
                reminder_days_before: 7,
                auto_reopen: false,
              },
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (_err) {
      setError(
        t(
          "settings.lossReasons.errors.saveFailed",
          "Failed to save loss reasons"
        )
      );
    } finally {
      setIsSaving(false);
    }
  }, [localReasons, initialRecoveryConfig, t]);

  // Save recovery workflow
  const handleSaveRecoveryWorkflow = useCallback(
    async (config: RecoveryWorkflowConfig) => {
      const response = await fetch(
        "/api/v1/crm/settings/opportunity_loss_reasons",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            setting_value: {
              default: null,
              reasons: localReasons,
              recovery_workflow: config,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save");
      }
    },
    [localReasons]
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Main Loss Reasons Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <CardTitle>
                {t("settings.lossReasons.title", "Loss Reasons")}
              </CardTitle>
              {hasChanges && (
                <span className="bg-fc-warning-50 text-fc-warning-600 rounded-full px-2 py-0.5 text-xs font-medium dark:bg-yellow-900/50 dark:text-yellow-300">
                  {t("settings.unsavedChanges", "Unsaved")}
                </span>
              )}
            </div>
            <Button size="sm" onClick={() => handleAddReason()}>
              <Plus className="mr-2 h-4 w-4" />
              {t("settings.lossReasons.addReason", "Add Reason")}
            </Button>
          </div>
          <CardDescription>
            {t(
              "settings.lossReasons.description",
              "Configure reasons for lost opportunities. Group them by category to understand why deals are lost."
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-fc-danger-50 text-fc-danger-600 flex items-center gap-2 rounded-md p-3 text-sm dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Reasons List */}
          <LossReasonsList
            reasons={localReasons}
            onEdit={handleEditReason}
            onDelete={handleDeleteClick}
            onAddToCategory={handleAddReason}
          />

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
              onClick={handleSaveAll}
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

      {/* Recovery Workflow Settings */}
      <RecoveryWorkflowSettings
        config={initialRecoveryConfig}
        onSave={handleSaveRecoveryWorkflow}
      />

      {/* Loss Reason Editor Modal */}
      <LossReasonEditor
        reason={editingReason}
        defaultCategory={editorDefaultCategory}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveReason}
        existingValues={
          editingReason
            ? existingValues.filter((v) => v !== editingReason.value)
            : existingValues
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              {t(
                "settings.lossReasons.confirmDelete.title",
                "Delete Loss Reason"
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "settings.lossReasons.confirmDelete.description",
                "Are you sure you want to delete this loss reason? This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>

          {reasonToDelete && (
            <div className="bg-fc-bg-hover rounded-md p-3 dark:bg-gray-900">
              <p className="font-medium">{reasonToDelete.label_en}</p>
              <p className="text-fc-text-muted text-sm">
                {reasonToDelete.label_fr}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              {t("settings.cancel", "Cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("settings.delete", "Delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
