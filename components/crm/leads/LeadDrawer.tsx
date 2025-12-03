/**
 * LeadDrawer - Main drawer component for lead quick view
 *
 * Opens on lead click (single click = drawer, double click = full page)
 * Supports read-only mode and edit mode (F1-B).
 *
 * Uses dynamic lead stages from crm_settings via useLeadStages hook.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Pencil,
  ArrowRightCircle,
  Trash,
  CheckCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LeadDrawerHeader } from "./LeadDrawerHeader";
import {
  ContactSection,
  CompanySection,
  LocationSection,
  SourceSection,
  ScoringSection,
  AssignmentSection,
  GdprSection,
  NotesSection,
  MessageSection,
  TimelineSection,
} from "./LeadDrawerSections";
import { QualifyModal } from "./QualifyModal";
import { ConvertToOpportunityModal } from "./ConvertToOpportunityModal";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { drawerContainerVariants } from "@/lib/animations/drawer-variants";
import {
  updateLeadAction,
  type UpdateLeadData,
} from "@/lib/actions/crm/lead.actions";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import type { Lead } from "@/types/crm";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onOpenFullPage?: (id: string) => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
  isLoading?: boolean;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
}

/**
 * Loading skeleton for drawer content
 */
function DrawerSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Badges skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <Separator />

      {/* Sections skeleton */}
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-4 w-24" />
          <div className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LeadDrawer({
  lead,
  isOpen,
  onClose,
  onDelete,
  onOpenFullPage,
  onLeadUpdated,
  isLoading = false,
  owners = [],
}: LeadDrawerProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { stages } = useLeadStages();

  // ============================================================================
  // F1-B: Edit Mode States
  // ============================================================================
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  // G2: Qualify Modal State
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);

  // G3: Convert Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // G4: Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset states when lead changes or drawer closes
  useEffect(() => {
    setIsEditing(false);
    setEditedLead({});
    setIsSaving(false);
    setIsQualifyModalOpen(false);
    setIsConvertModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
    setCurrentLead(lead);
  }, [lead?.id, isOpen, lead]);

  // Handle field change in edit mode
  const handleFieldChange = useCallback(
    (field: string, value: string | null) => {
      setEditedLead((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Handle save
  const handleSave = useCallback(async () => {
    if (!lead) return;

    // Check if there are changes
    if (Object.keys(editedLead).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare data for server action
      const updateData: UpdateLeadData = {};

      // Only include fields that were actually edited
      if (editedLead.first_name !== undefined)
        updateData.first_name = editedLead.first_name || undefined;
      if (editedLead.last_name !== undefined)
        updateData.last_name = editedLead.last_name || undefined;
      if (editedLead.email !== undefined)
        updateData.email = editedLead.email || undefined;
      if (editedLead.phone !== undefined)
        updateData.phone = editedLead.phone || null;
      if (editedLead.company_name !== undefined)
        updateData.company_name = editedLead.company_name || undefined;
      if (editedLead.fleet_size !== undefined)
        updateData.fleet_size = editedLead.fleet_size || null;
      if (editedLead.current_software !== undefined)
        updateData.current_software = editedLead.current_software || null;
      if (editedLead.website_url !== undefined)
        updateData.website_url = editedLead.website_url || null;
      if (editedLead.priority !== undefined)
        updateData.priority = editedLead.priority as UpdateLeadData["priority"];
      if (editedLead.message !== undefined)
        updateData.message = editedLead.message || null;
      if (editedLead.assigned_to_id !== undefined)
        updateData.assigned_to_id = editedLead.assigned_to_id || null;
      // Handle next_action_date - convert string to Date
      if (editedLead.next_action_date !== undefined) {
        updateData.next_action_date = editedLead.next_action_date
          ? new Date(editedLead.next_action_date as unknown as string)
          : null;
      }

      const result = await updateLeadAction(lead.id, updateData);

      if (result.success) {
        toast.success(t("leads.drawer.save_success"));
        setIsEditing(false);
        setEditedLead({});

        // Notify parent of update
        if (onLeadUpdated && result.lead) {
          onLeadUpdated(result.lead as unknown as Lead);
        }
      } else {
        toast.error(result.error || t("leads.drawer.save_error"));
      }
    } catch {
      toast.error(t("leads.drawer.save_error"));
    } finally {
      setIsSaving(false);
    }
  }, [lead, editedLead, onLeadUpdated, t]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedLead({});
  }, []);

  // Handle enter edit mode
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // G2: Handle qualify
  const handleQualify = useCallback(() => {
    setIsQualifyModalOpen(true);
  }, []);

  // G2: Handle qualify success
  const handleQualifySuccess = useCallback(
    (updatedLead: Lead) => {
      setCurrentLead(updatedLead);
      onLeadUpdated?.(updatedLead);
    },
    [onLeadUpdated]
  );

  // G3: Handle convert
  const handleConvert = useCallback(() => {
    setIsConvertModalOpen(true);
  }, []);

  // G3: Handle convert success
  const handleConvertSuccess = useCallback(
    (result: { lead: Lead; opportunity: Record<string, unknown> }) => {
      setCurrentLead(result.lead);
      onLeadUpdated?.(result.lead);
    },
    [onLeadUpdated]
  );

  // G4: Handle delete - open modal
  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  // G4: Handle delete confirmation
  const handleDeleteConfirm = useCallback(
    async (reason: string, permanentDelete: boolean) => {
      if (!lead) return;

      setIsDeleting(true);
      try {
        const result = await deleteLeadAction(lead.id, reason, permanentDelete);

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success(
          permanentDelete
            ? t("leads.delete.success_permanent")
            : t("leads.delete.success")
        );
        setIsDeleteModalOpen(false);
        onClose();
        // Also notify parent if callback exists
        onDelete?.(lead.id);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("leads.delete.error")
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [lead, onClose, onDelete, t]
  );

  // Determine if GDPR section should be shown
  // Uses country_gdpr from database, or fallback to EU country list
  const EU_COUNTRY_CODES = [
    "FR",
    "DE",
    "IT",
    "ES",
    "BE",
    "NL",
    "PT",
    "AT",
    "IE",
    "LU",
    "GR",
    "FI",
    "SE",
    "DK",
    "PL",
    "CZ",
    "HU",
    "RO",
    "BG",
    "HR",
    "SK",
    "SI",
    "EE",
    "LV",
    "LT",
    "MT",
    "CY",
  ];

  const showGdprSection = lead
    ? (lead.country?.country_gdpr ??
      EU_COUNTRY_CODES.includes(lead.country_code?.toUpperCase() || ""))
    : false;

  // Determine button states based on dynamic stages
  // Find the index of the last stage before "opportunity" (which is the last qualifying stage)
  const lastQualifyStageIndex = useMemo(() => {
    const oppIndex = stages.findIndex((s) => s.value === "opportunity");
    return oppIndex > 0 ? oppIndex - 1 : stages.length - 2;
  }, [stages]);

  // Can qualify: not already at the last qualifying stage or beyond
  const canQualify = useMemo(() => {
    if (!currentLead?.lead_stage) return true; // No stage yet, can qualify
    const currentIndex = stages.findIndex(
      (s) => s.value === currentLead.lead_stage
    );
    return currentIndex < lastQualifyStageIndex;
  }, [currentLead?.lead_stage, stages, lastQualifyStageIndex]);

  // Can convert: only when at the last stage before "opportunity"
  const canConvert = useMemo(() => {
    if (!currentLead?.lead_stage) return false;
    const currentIndex = stages.findIndex(
      (s) => s.value === currentLead.lead_stage
    );
    return currentIndex === lastQualifyStageIndex;
  }, [currentLead?.lead_stage, stages, lastQualifyStageIndex]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-hidden sm:max-w-lg"
      >
        {/* Accessibility: Hidden title for screen readers */}
        <VisuallyHidden.Root>
          <SheetTitle>
            {lead
              ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
                "Lead Details"
              : "Lead Details"}
          </SheetTitle>
          <SheetDescription>Quick view of lead information</SheetDescription>
        </VisuallyHidden.Root>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <DrawerSkeleton />
          ) : lead ? (
            <motion.div
              variants={drawerContainerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6 py-4"
            >
              {/* Header */}
              <LeadDrawerHeader
                lead={lead}
                onOpenFullPage={
                  onOpenFullPage ? () => onOpenFullPage(lead.id) : undefined
                }
              />

              <Separator />

              {/* Sections - Assignment en haut pour accès rapide */}
              <AssignmentSection
                lead={lead}
                isEditing={isEditing}
                editedLead={editedLead}
                onFieldChange={handleFieldChange}
                owners={owners}
              />
              <ContactSection
                lead={lead}
                isEditing={isEditing}
                editedLead={editedLead}
                onFieldChange={handleFieldChange}
              />
              <CompanySection
                lead={lead}
                isEditing={isEditing}
                editedLead={editedLead}
                onFieldChange={handleFieldChange}
              />
              <LocationSection lead={lead} />
              <ScoringSection lead={lead} />
              <SourceSection lead={lead} />
              <GdprSection lead={lead} visible={showGdprSection} />
              <NotesSection lead={lead} />
              <TimelineSection lead={lead} />
              <MessageSection
                lead={lead}
                isEditing={isEditing}
                editedLead={editedLead}
                onFieldChange={handleFieldChange}
              />
            </motion.div>
          ) : null}
        </div>

        {/* Footer with action buttons */}
        {lead && !isLoading && (
          <div className="mt-auto border-t pt-4">
            {isEditing ? (
              // Edit mode: Save/Cancel buttons
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4" />
                  {t("leads.drawer.cancel")}
                </Button>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("leads.drawer.saving")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t("leads.drawer.save")}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              // Read mode: Action buttons
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleEdit}
                >
                  <Pencil className="h-4 w-4" />
                  {t("leads.drawer.actions.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleQualify}
                  disabled={!canQualify}
                >
                  <CheckCircle className="h-4 w-4" />
                  {t("leads.drawer.actions.qualify")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={handleConvert}
                  disabled={!canConvert}
                >
                  <ArrowRightCircle className="h-4 w-4" />
                  {t("leads.drawer.actions.convert")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                  onClick={handleDelete}
                >
                  <Trash className="h-4 w-4" />
                  {t("leads.drawer.actions.delete")}
                </Button>
              </div>
            )}
          </div>
        )}
      </SheetContent>

      {/* G2: Qualify Modal */}
      {currentLead && (
        <QualifyModal
          lead={currentLead}
          isOpen={isQualifyModalOpen}
          onClose={() => setIsQualifyModalOpen(false)}
          onSuccess={handleQualifySuccess}
        />
      )}

      {/* G3: Convert to Opportunity Modal */}
      {currentLead && (
        <ConvertToOpportunityModal
          lead={currentLead}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* G4: Delete Lead Modal */}
      {currentLead && (
        <DeleteLeadModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          leadName={`${currentLead.first_name} ${currentLead.last_name}`}
          leadEmail={currentLead.email}
          isLoading={isDeleting}
        />
      )}
    </Sheet>
  );
}
