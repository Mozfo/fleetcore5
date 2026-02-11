/**
 * PipelineSettingsTab - Pipeline Configuration with Drag & Drop
 *
 * Contains:
 * - Lead Stages configuration (drag & drop reorder)
 * - Opportunity Stages configuration (with probability & max_days)
 *
 * Uses @dnd-kit for drag & drop reordering
 *
 * @module components/crm/settings/PipelineSettingsTab
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GitBranch,
  Target,
  Plus,
  GripVertical,
  Trash2,
  Pencil,
  Save,
  RotateCcw,
  AlertCircle,
  Check,
  Loader2,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  SettingData,
  LeadStagesSettingValue,
  OpportunityStagesSettingValue,
  LeadStage,
  OpportunityStage,
} from "./types";
import {
  DealRottingSettings,
  type DealRottingConfig,
} from "./DealRottingSettings";
import {
  OpportunityPipelinePreview,
  LeadPipelinePreview,
} from "./PipelinePreview";

// ============================================================================
// Types
// ============================================================================

interface PipelineSettingsTabProps {
  leadStages: SettingData | null;
  opportunityStages: SettingData | null;
}

type StageColor =
  | "blue"
  | "purple"
  | "green"
  | "yellow"
  | "orange"
  | "red"
  | "gray"
  | "pink"
  | "indigo"
  | "teal";

const STAGE_COLORS: StageColor[] = [
  "blue",
  "purple",
  "green",
  "yellow",
  "orange",
  "red",
  "gray",
  "pink",
  "indigo",
  "teal",
];

const COLOR_CLASSES: Record<StageColor, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  green:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  orange:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  red: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-800",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800",
  indigo:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300 border-teal-200 dark:border-teal-800",
};

// ============================================================================
// Main Component
// ============================================================================

export function PipelineSettingsTab({
  leadStages,
  opportunityStages,
}: PipelineSettingsTabProps) {
  // Parse initial values
  const initialLeadStages = useMemo(() => {
    const value = leadStages?.setting_value as
      | LeadStagesSettingValue
      | undefined;
    return value?.stages?.sort((a, b) => a.order - b.order) || [];
  }, [leadStages]);

  const initialOppStages = useMemo(() => {
    const value = opportunityStages?.setting_value as
      | OpportunityStagesSettingValue
      | undefined;
    return value?.stages?.sort((a, b) => a.order - b.order) || [];
  }, [opportunityStages]);

  // Parse rotting config
  const initialRottingConfig = useMemo(() => {
    const value = opportunityStages?.setting_value as
      | OpportunityStagesSettingValue
      | undefined;
    return value?.rotting || null;
  }, [opportunityStages]);

  // Local state for editing
  const [localLeadStages, setLocalLeadStages] =
    useState<LeadStage[]>(initialLeadStages);
  const [localOppStages, setLocalOppStages] =
    useState<OpportunityStage[]>(initialOppStages);

  // Save states
  const [isSavingLeads, setIsSavingLeads] = useState(false);
  const [isSavingOpps, setIsSavingOpps] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<
    "leads" | "opportunities" | null
  >(null);

  // Check for unsaved changes
  const hasLeadChanges = useMemo(() => {
    return (
      JSON.stringify(localLeadStages) !== JSON.stringify(initialLeadStages)
    );
  }, [localLeadStages, initialLeadStages]);

  const hasOppChanges = useMemo(() => {
    return JSON.stringify(localOppStages) !== JSON.stringify(initialOppStages);
  }, [localOppStages, initialOppStages]);

  // Save handlers
  const handleSaveLeadStages = useCallback(async () => {
    setIsSavingLeads(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/v1/crm/settings/lead_stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_value: {
            stages: localLeadStages,
            default_stage: localLeadStages[0]?.value || "new",
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save");
      }
      setSaveSuccess("leads");
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save lead stages"
      );
    } finally {
      setIsSavingLeads(false);
    }
  }, [localLeadStages]);

  const handleSaveOppStages = useCallback(async () => {
    setIsSavingOpps(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/v1/crm/settings/opportunity_stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_value: {
            stages: localOppStages,
            default_stage: localOppStages[0]?.value || "qualification",
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save");
      }
      setSaveSuccess("opportunities");
      setTimeout(() => setSaveSuccess(null), 2000);
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Failed to save opportunity stages"
      );
    } finally {
      setIsSavingOpps(false);
    }
  }, [localOppStages]);

  // Reset handlers
  const handleResetLeadStages = useCallback(() => {
    setLocalLeadStages(initialLeadStages);
  }, [initialLeadStages]);

  const handleResetOppStages = useCallback(() => {
    setLocalOppStages(initialOppStages);
  }, [initialOppStages]);

  // Save deal rotting config
  const handleSaveRottingConfig = useCallback(
    async (config: DealRottingConfig) => {
      const currentValue = opportunityStages?.setting_value as
        | OpportunityStagesSettingValue
        | undefined;
      const response = await fetch("/api/v1/crm/settings/opportunity_stages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          setting_value: {
            ...currentValue,
            rotting: config,
          },
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save");
      }
    },
    [opportunityStages]
  );

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {saveError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {saveError}
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-6 px-2"
            onClick={() => setSaveError(null)}
          >
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Stages Card */}
        <LeadStagesCard
          stages={localLeadStages}
          setStages={setLocalLeadStages}
          hasChanges={hasLeadChanges}
          isSaving={isSavingLeads}
          saveSuccess={saveSuccess === "leads"}
          onSave={handleSaveLeadStages}
          onReset={handleResetLeadStages}
        />

        {/* Opportunity Stages Card */}
        <OpportunityStagesCard
          stages={localOppStages}
          setStages={setLocalOppStages}
          hasChanges={hasOppChanges}
          isSaving={isSavingOpps}
          saveSuccess={saveSuccess === "opportunities"}
          onSave={handleSaveOppStages}
          onReset={handleResetOppStages}
        />
      </div>

      {/* Pipeline Previews */}
      <div className="grid gap-6 lg:grid-cols-2">
        <LeadPipelinePreview stages={localLeadStages} />
        <OpportunityPipelinePreview stages={localOppStages} />
      </div>

      {/* Deal Rotting Settings */}
      <DealRottingSettings
        config={initialRottingConfig as DealRottingConfig | null}
        onSave={handleSaveRottingConfig}
      />
    </div>
  );
}

// ============================================================================
// Lead Stages Card
// ============================================================================

interface LeadStagesCardProps {
  stages: LeadStage[];
  setStages: React.Dispatch<React.SetStateAction<LeadStage[]>>;
  hasChanges: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onReset: () => void;
}

function LeadStagesCard({
  stages,
  setStages,
  hasChanges,
  isSaving,
  saveSuccess,
  onSave,
  onReset,
}: LeadStagesCardProps) {
  const { t } = useTranslation("crm");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<LeadStage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.value === active.id);
        const newIndex = items.findIndex((item) => item.value === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const handleAddStage = (stage: LeadStage) => {
    setStages((prev) => [...prev, { ...stage, order: prev.length + 1 }]);
    setIsAddModalOpen(false);
  };

  const handleEditStage = (stage: LeadStage) => {
    setStages((prev) => prev.map((s) => (s.value === stage.value ? stage : s)));
    setEditingStage(null);
  };

  const handleDeleteStage = (value: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.value !== value);
      return filtered.map((item, index) => ({ ...item, order: index + 1 }));
    });
  };

  const activeStage = stages.find((s) => s.value === activeId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-blue-500" />
            <CardTitle>
              {t("settings.pipeline.leadStages.title", "Lead Stages")}
            </CardTitle>
            {hasChanges && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                {t("settings.unsavedChanges", "Unsaved")}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("settings.pipeline.addStage", "Add Stage")}
          </Button>
        </div>
        <CardDescription>
          {t(
            "settings.pipeline.leadStages.description",
            "Configure the stages for your lead pipeline. Drag to reorder."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.value)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stages.map((stage) => (
                  <SortableLeadStageRow
                    key={stage.value}
                    stage={stage}
                    onEdit={() => setEditingStage(stage)}
                    onDelete={() => handleDeleteStage(stage.value)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeStage && (
                <div className="bg-card rounded-lg border p-3 shadow-lg">
                  <LeadStageRowContent stage={activeStage} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <EmptyStateMessage
            message={t(
              "settings.pipeline.leadStages.empty",
              "No lead stages configured. Add your first stage to get started."
            )}
          />
        )}

        {/* Action Buttons */}
        {stages.length > 0 && (
          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("settings.reset", "Reset")}
            </Button>
            <Button
              size="sm"
              onClick={onSave}
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
        )}
      </CardContent>

      {/* Add Modal */}
      <LeadStageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddStage}
        existingValues={stages.map((s) => s.value)}
      />

      {/* Edit Modal */}
      {editingStage && (
        <LeadStageModal
          isOpen={true}
          onClose={() => setEditingStage(null)}
          onSave={handleEditStage}
          existingValues={stages
            .filter((s) => s.value !== editingStage.value)
            .map((s) => s.value)}
          initialData={editingStage}
        />
      )}
    </Card>
  );
}

// ============================================================================
// Opportunity Stages Card
// ============================================================================

interface OpportunityStagesCardProps {
  stages: OpportunityStage[];
  setStages: React.Dispatch<React.SetStateAction<OpportunityStage[]>>;
  hasChanges: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
  onReset: () => void;
}

function OpportunityStagesCard({
  stages,
  setStages,
  hasChanges,
  isSaving,
  saveSuccess,
  onSave,
  onReset,
}: OpportunityStagesCardProps) {
  const { t } = useTranslation("crm");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<OpportunityStage | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.value === active.id);
        const newIndex = items.findIndex((item) => item.value === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, order: index + 1 }));
      });
    }
  };

  const handleAddStage = (stage: OpportunityStage) => {
    setStages((prev) => [...prev, { ...stage, order: prev.length + 1 }]);
    setIsAddModalOpen(false);
  };

  const handleEditStage = (stage: OpportunityStage) => {
    setStages((prev) => prev.map((s) => (s.value === stage.value ? stage : s)));
    setEditingStage(null);
  };

  const handleDeleteStage = (value: string) => {
    setStages((prev) => {
      const filtered = prev.filter((s) => s.value !== value);
      return filtered.map((item, index) => ({ ...item, order: index + 1 }));
    });
  };

  const activeStage = stages.find((s) => s.value === activeId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-green-500" />
            <CardTitle>
              {t(
                "settings.pipeline.opportunityStages.title",
                "Opportunity Stages"
              )}
            </CardTitle>
            {hasChanges && (
              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                {t("settings.unsavedChanges", "Unsaved")}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("settings.pipeline.addStage", "Add Stage")}
          </Button>
        </div>
        <CardDescription>
          {t(
            "settings.pipeline.opportunityStages.description",
            "Configure the stages for your sales pipeline with probability and max days."
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {stages.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={stages.map((s) => s.value)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {stages.map((stage) => (
                  <SortableOpportunityStageRow
                    key={stage.value}
                    stage={stage}
                    onEdit={() => setEditingStage(stage)}
                    onDelete={() => handleDeleteStage(stage.value)}
                  />
                ))}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeStage && (
                <div className="bg-card rounded-lg border p-3 shadow-lg">
                  <OpportunityStageRowContent stage={activeStage} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <EmptyStateMessage
            message={t(
              "settings.pipeline.opportunityStages.empty",
              "No opportunity stages configured. Add your first stage to get started."
            )}
          />
        )}

        {/* Action Buttons */}
        {stages.length > 0 && (
          <div className="mt-4 flex justify-end gap-2 border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={!hasChanges || isSaving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {t("settings.reset", "Reset")}
            </Button>
            <Button
              size="sm"
              onClick={onSave}
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
        )}
      </CardContent>

      {/* Add Modal */}
      <OpportunityStageModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddStage}
        existingValues={stages.map((s) => s.value)}
      />

      {/* Edit Modal */}
      {editingStage && (
        <OpportunityStageModal
          isOpen={true}
          onClose={() => setEditingStage(null)}
          onSave={handleEditStage}
          existingValues={stages
            .filter((s) => s.value !== editingStage.value)
            .map((s) => s.value)}
          initialData={editingStage}
        />
      )}
    </Card>
  );
}

// ============================================================================
// Sortable Row Components
// ============================================================================

interface SortableLeadStageRowProps {
  stage: LeadStage;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableLeadStageRow({
  stage,
  onEdit,
  onDelete,
}: SortableLeadStageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none focus:outline-none active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </button>
      <LeadStageRowContent stage={stage} />
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function LeadStageRowContent({ stage }: { stage: LeadStage }) {
  const { i18n } = useTranslation("crm");
  const colorClass =
    COLOR_CLASSES[stage.color as StageColor] || COLOR_CLASSES.gray;

  return (
    <>
      <span className="text-muted-foreground w-6 text-center text-sm">
        {stage.order}
      </span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {i18n.language === "fr"
          ? stage.label_fr || stage.label_en
          : stage.label_en}
      </span>
      <span className="text-muted-foreground text-xs">{stage.value}</span>
    </>
  );
}

interface SortableOpportunityStageRowProps {
  stage: OpportunityStage;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableOpportunityStageRow({
  stage,
  onEdit,
  onDelete,
}: SortableOpportunityStageRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.value });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card hover:bg-accent/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none focus:outline-none active:cursor-grabbing"
      >
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </button>
      <OpportunityStageRowContent stage={stage} />
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onEdit}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive h-7 w-7"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function OpportunityStageRowContent({ stage }: { stage: OpportunityStage }) {
  const { i18n } = useTranslation("crm");
  const colorClass =
    COLOR_CLASSES[stage.color as StageColor] || COLOR_CLASSES.gray;

  return (
    <>
      <span className="text-muted-foreground w-6 text-center text-sm">
        {stage.order}
      </span>
      <span
        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
      >
        {i18n.language === "fr"
          ? stage.label_fr || stage.label_en
          : stage.label_en}
      </span>
      <div className="text-muted-foreground flex items-center gap-3 text-xs">
        <span className="bg-muted rounded px-1.5 py-0.5">
          {stage.probability}%
        </span>
        <span>{stage.max_days}d max</span>
      </div>
    </>
  );
}

// ============================================================================
// Modal Components
// ============================================================================

interface LeadStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: LeadStage) => void;
  existingValues: string[];
  initialData?: LeadStage;
}

function LeadStageModal({
  isOpen,
  onClose,
  onSave,
  existingValues,
  initialData,
}: LeadStageModalProps) {
  const { t } = useTranslation("crm");
  const isEditing = !!initialData;

  const [value, setValue] = useState(initialData?.value || "");
  const [labelEn, setLabelEn] = useState(initialData?.label_en || "");
  const [labelFr, setLabelFr] = useState(initialData?.label_fr || "");
  const [color, setColor] = useState<StageColor>(
    (initialData?.color as StageColor) || "blue"
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedValue = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmedValue) {
      setError("Value is required");
      return;
    }
    if (!isEditing && existingValues.includes(trimmedValue)) {
      setError("This value already exists");
      return;
    }
    if (!labelEn.trim()) {
      setError("English label is required");
      return;
    }

    onSave({
      value: trimmedValue,
      label_en: labelEn.trim(),
      label_fr: labelFr.trim() || labelEn.trim(),
      color,
      order: initialData?.order || 0,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t("settings.pipeline.editStage", "Edit Stage")
                : t("settings.pipeline.addStage", "Add Stage")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "settings.pipeline.stageModalDescription",
                "Configure the stage properties."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Value */}
            <div className="grid gap-2">
              <Label htmlFor="value">
                {t("settings.pipeline.stageValue", "Value (ID)")}
              </Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., new, qualified, working"
                disabled={isEditing}
              />
            </div>

            {/* English Label */}
            <div className="grid gap-2">
              <Label htmlFor="labelEn">
                {t("settings.pipeline.labelEn", "Label (English)")}
              </Label>
              <Input
                id="labelEn"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="e.g., New Lead"
              />
            </div>

            {/* French Label */}
            <div className="grid gap-2">
              <Label htmlFor="labelFr">
                {t("settings.pipeline.labelFr", "Label (French)")}
              </Label>
              <Input
                id="labelFr"
                value={labelFr}
                onChange={(e) => setLabelFr(e.target.value)}
                placeholder="e.g., Nouveau Lead"
              />
            </div>

            {/* Color */}
            <div className="grid gap-2">
              <Label>{t("settings.pipeline.color", "Color")}</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      COLOR_CLASSES[c].split(" ")[0]
                    } ${
                      color === c
                        ? "ring-primary ring-2 ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit">
              {isEditing ? t("common.save", "Save") : t("common.add", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface OpportunityStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stage: OpportunityStage) => void;
  existingValues: string[];
  initialData?: OpportunityStage;
}

function OpportunityStageModal({
  isOpen,
  onClose,
  onSave,
  existingValues,
  initialData,
}: OpportunityStageModalProps) {
  const { t } = useTranslation("crm");
  const isEditing = !!initialData;

  const [value, setValue] = useState(initialData?.value || "");
  const [labelEn, setLabelEn] = useState(initialData?.label_en || "");
  const [labelFr, setLabelFr] = useState(initialData?.label_fr || "");
  const [color, setColor] = useState<StageColor>(
    (initialData?.color as StageColor) || "blue"
  );
  const [probability, setProbability] = useState(initialData?.probability || 0);
  const [maxDays, setMaxDays] = useState(initialData?.max_days || 30);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate
    const trimmedValue = value.trim().toLowerCase().replace(/\s+/g, "_");
    if (!trimmedValue) {
      setError("Value is required");
      return;
    }
    if (!isEditing && existingValues.includes(trimmedValue)) {
      setError("This value already exists");
      return;
    }
    if (!labelEn.trim()) {
      setError("English label is required");
      return;
    }
    if (probability < 0 || probability > 100) {
      setError("Probability must be between 0 and 100");
      return;
    }
    if (maxDays < 1) {
      setError("Max days must be at least 1");
      return;
    }

    onSave({
      value: trimmedValue,
      label_en: labelEn.trim(),
      label_fr: labelFr.trim() || labelEn.trim(),
      color,
      order: initialData?.order || 0,
      probability,
      max_days: maxDays,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing
                ? t("settings.pipeline.editStage", "Edit Stage")
                : t("settings.pipeline.addStage", "Add Stage")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "settings.pipeline.opportunityStageModalDescription",
                "Configure the opportunity stage properties including probability and max days."
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Value */}
            <div className="grid gap-2">
              <Label htmlFor="value">
                {t("settings.pipeline.stageValue", "Value (ID)")}
              </Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g., qualification, proposal"
                disabled={isEditing}
              />
            </div>

            {/* English Label */}
            <div className="grid gap-2">
              <Label htmlFor="labelEn">
                {t("settings.pipeline.labelEn", "Label (English)")}
              </Label>
              <Input
                id="labelEn"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder="e.g., Qualification"
              />
            </div>

            {/* French Label */}
            <div className="grid gap-2">
              <Label htmlFor="labelFr">
                {t("settings.pipeline.labelFr", "Label (French)")}
              </Label>
              <Input
                id="labelFr"
                value={labelFr}
                onChange={(e) => setLabelFr(e.target.value)}
                placeholder="e.g., Qualification"
              />
            </div>

            {/* Probability & Max Days */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="probability">
                  {t("settings.pipeline.probability", "Probability (%)")}
                </Label>
                <Input
                  id="probability"
                  type="number"
                  min={0}
                  max={100}
                  value={probability}
                  onChange={(e) => setProbability(Number(e.target.value))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxDays">
                  {t("settings.pipeline.maxDays", "Max Days")}
                </Label>
                <Input
                  id="maxDays"
                  type="number"
                  min={1}
                  value={maxDays}
                  onChange={(e) => setMaxDays(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Color */}
            <div className="grid gap-2">
              <Label>{t("settings.pipeline.color", "Color")}</Label>
              <div className="flex flex-wrap gap-2">
                {STAGE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      COLOR_CLASSES[c].split(" ")[0]
                    } ${
                      color === c
                        ? "ring-primary ring-2 ring-offset-2"
                        : "opacity-60 hover:opacity-100"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="text-destructive flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel", "Cancel")}
            </Button>
            <Button type="submit">
              {isEditing ? t("common.save", "Save") : t("common.add", "Add")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyStateMessage({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <GitBranch className="text-muted-foreground/50 h-10 w-10" />
      <p className="text-muted-foreground mt-2 text-sm">{message}</p>
    </div>
  );
}
