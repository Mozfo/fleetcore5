/**
 * LeadDrawer - 2-column workstation popup for lead quick view
 *
 * LEFT (w-2/5): Consultable info during a call (header, contact, company, etc.)
 * RIGHT (w-3/5): Actions + Timeline (inline activity form, status actions, timeline)
 *
 * Uses Dialog (centered, fade+scale). Supports read-only and edit mode.
 *
 * Data flow (B2 refonte):
 * - Single source of truth: Refine useOne (replaces dual lead prop + currentLead state)
 * - Dirty tracking via useRef for conditional Kanban invalidation on close
 * - onMutationSuccess callback passed to all mutating children
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOne, useInvalidate } from "@refinedev/core";
import { motion } from "framer-motion";
import { Pencil, Ban, Trash, CheckCircle, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  AssignmentSection,
  GdprSection,
  MessageSection,
  TimelineSection,
} from "./LeadDrawerSections";
import { InlineActivityForm } from "@/components/crm/leads/InlineActivityForm";
import { DeleteLeadModal } from "@/components/crm/leads/DeleteLeadModal";
import { DisqualifyLeadModal } from "@/components/crm/leads/DisqualifyLeadModal";
import { LeadBantSection } from "./LeadBantSection";
import { LeadStatusActions } from "@/components/crm/leads/LeadStatusActions";
import { drawerContainerVariants } from "@/lib/animations/drawer-variants";
import {
  updateLeadAction,
  type UpdateLeadData,
} from "@/lib/actions/crm/lead.actions";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import { usePermission } from "@/lib/hooks/usePermission";
import type { Lead } from "@/types/crm";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onOpenFullPage?: (id: string) => void;
  isLoading?: boolean;
  owners?: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
  }>;
}

/**
 * Loading skeleton for popup content
 */
function DrawerSkeleton() {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
      <Separator />
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
  isLoading = false,
  owners = [],
}: LeadDrawerProps) {
  const { t } = useTranslation("crm");
  const { can } = usePermission();
  const invalidate = useInvalidate();

  // ── Single source of truth: Refine useOne ───────────────────────────
  const { result: fullLead, query: leadQuery } = useOne<Lead>({
    resource: "leads",
    id: lead?.id ?? "",
    queryOptions: { enabled: !!lead?.id && isOpen },
  });

  // ── Dirty tracking — mutations set true, Kanban invalidation on close
  const dirtyRef = useRef(false);

  // ── Edit Mode States ─────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Modal States ─────────────────────────────────────────────────────
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeline refresh counter — incremented by InlineActivityForm
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Reset states when lead changes or drawer closes
  useEffect(() => {
    setIsEditing(false);
    setEditedLead({});
    setIsSaving(false);
    setIsDisqualifyModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
    dirtyRef.current = false;
    setRefreshTrigger(0);
  }, [lead?.id, isOpen]);

  // ── Mutation success callback — passed to all mutating children ─────
  const handleMutationSuccess = useCallback(() => {
    dirtyRef.current = true;
    void leadQuery.refetch();
  }, [leadQuery]);

  // ── Close with conditional Kanban invalidation ─────────────────────
  const closeWithInvalidation = useCallback(() => {
    if (dirtyRef.current) {
      void invalidate({ resource: "leads", invalidates: ["list"] });
      dirtyRef.current = false;
    }
    onClose();
  }, [onClose, invalidate]);

  // ── Edit mode handlers ───────────────────────────────────────────────

  const handleFieldChange = useCallback(
    (field: string, value: string | null) => {
      setEditedLead((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!fullLead) return;

    if (Object.keys(editedLead).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updateData: UpdateLeadData = {};

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
      if (editedLead.next_action_date !== undefined) {
        updateData.next_action_date = editedLead.next_action_date
          ? new Date(editedLead.next_action_date as unknown as string)
          : null;
      }

      const result = await updateLeadAction(fullLead.id, updateData);

      if (result.success) {
        toast.success(t("leads.drawer.save_success"));
        setIsEditing(false);
        setEditedLead({});
        handleMutationSuccess();
      } else {
        toast.error(result.error || t("leads.drawer.save_error"));
      }
    } catch {
      toast.error(t("leads.drawer.save_error"));
    } finally {
      setIsSaving(false);
    }
  }, [fullLead, editedLead, t, handleMutationSuccess]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedLead({});
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // ── Disqualify handlers ──────────────────────────────────────────────

  const handleDisqualify = useCallback(() => {
    setIsDisqualifyModalOpen(true);
  }, []);

  const handleDisqualifySuccess = useCallback(() => {
    setIsDisqualifyModalOpen(false);
    dirtyRef.current = true;
    closeWithInvalidation();
  }, [closeWithInvalidation]);

  // ── Delete handlers ──────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(
    async (reason: string, permanentDelete: boolean) => {
      if (!fullLead) return;

      setIsDeleting(true);
      try {
        const result = await deleteLeadAction(
          fullLead.id,
          reason,
          permanentDelete
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        toast.success(
          permanentDelete
            ? t("leads.delete.success_permanent")
            : t("leads.delete.success")
        );
        setIsDeleteModalOpen(false);
        dirtyRef.current = true;
        closeWithInvalidation();
        onDelete?.(fullLead.id);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("leads.delete.error")
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [fullLead, closeWithInvalidation, onDelete, t]
  );

  // ── GDPR ─────────────────────────────────────────────────────────────

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

  const showGdprSection = fullLead
    ? (fullLead.country?.country_gdpr ??
      EU_COUNTRY_CODES.includes(fullLead.country_code?.toUpperCase() || ""))
    : false;

  // ── Handle dialog close ────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        closeWithInvalidation();
      }
    },
    [closeWithInvalidation]
  );

  // Show skeleton when loading full data
  const showSkeleton = isLoading || (!!lead && !fullLead);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          data-testid="lead-drawer"
          showCloseIcon
          className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        >
          {/* Accessibility — use prop lead for immediate title */}
          <VisuallyHidden.Root>
            <DialogTitle>
              {lead
                ? `${lead.first_name || ""} ${lead.last_name || ""}`.trim() ||
                  "Lead Details"
                : "Lead Details"}
            </DialogTitle>
            <DialogDescription>
              Quick view of lead information
            </DialogDescription>
          </VisuallyHidden.Root>

          {/* 2-column content area */}
          <div className="flex min-h-0 flex-1">
            {showSkeleton ? (
              <div className="flex-1 px-6 py-5">
                <DrawerSkeleton />
              </div>
            ) : fullLead ? (
              <>
                {/* ── LEFT COLUMN (w-2/5) — Info sections ── */}
                <div className="w-2/5 overflow-y-auto border-r px-5 py-5">
                  <motion.div
                    variants={drawerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    <LeadDrawerHeader
                      lead={fullLead}
                      onOpenFullPage={
                        onOpenFullPage
                          ? () => onOpenFullPage(fullLead.id)
                          : undefined
                      }
                    />
                    <Separator />
                    <ContactSection
                      lead={fullLead}
                      isEditing={isEditing}
                      editedLead={editedLead}
                      onFieldChange={handleFieldChange}
                    />
                    <CompanySection
                      lead={fullLead}
                      isEditing={isEditing}
                      editedLead={editedLead}
                      onFieldChange={handleFieldChange}
                    />
                    <AssignmentSection
                      lead={fullLead}
                      isEditing={isEditing}
                      editedLead={editedLead}
                      onFieldChange={handleFieldChange}
                      owners={owners}
                    />
                    <LocationSection lead={fullLead} />
                    <SourceSection lead={fullLead} />
                    <GdprSection lead={fullLead} visible={showGdprSection} />
                    <MessageSection
                      lead={fullLead}
                      isEditing={isEditing}
                      editedLead={editedLead}
                      onFieldChange={handleFieldChange}
                    />
                  </motion.div>
                </div>

                {/* ── RIGHT COLUMN (w-3/5) — Actions + Timeline ── */}
                <div className="w-3/5 overflow-y-auto px-5 py-5">
                  <motion.div
                    variants={drawerContainerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Inline Activity Form */}
                    <InlineActivityForm
                      leadId={fullLead.id}
                      leadEmail={fullLead.email}
                      leadPhone={fullLead.phone}
                      onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
                    />

                    <Separator />

                    {/* BANT Qualification — key forces remount when BANT data changes */}
                    <LeadBantSection
                      key={`bant-${fullLead.id}-${fullLead.bant_budget ?? "empty"}`}
                      lead={fullLead}
                      onMutationSuccess={handleMutationSuccess}
                    />

                    <Separator />

                    {/* Step Actions (V7) */}
                    <LeadStatusActions
                      lead={fullLead}
                      onMutationSuccess={handleMutationSuccess}
                    />

                    <Separator />

                    {/* Timeline */}
                    <TimelineSection
                      lead={fullLead}
                      hideAddButton={true}
                      refreshTrigger={refreshTrigger}
                    />
                  </motion.div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer with action buttons */}
          {fullLead && !showSkeleton && (
            <div className="bg-muted/50 border-t px-6 py-4">
              {isEditing ? (
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
                    className="gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-600"
                    onClick={handleDisqualify}
                  >
                    <Ban className="h-4 w-4" />
                    {t("leads.drawer.actions.disqualify")}
                  </Button>
                  {can("lead.delete") && (
                    <Button
                      variant="outline"
                      size="sm"
                      data-testid="drawer-delete-button"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                      onClick={handleDelete}
                    >
                      <Trash className="h-4 w-4" />
                      {t("leads.drawer.actions.delete")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sub-modals rendered outside Dialog to avoid nested portal issues */}
      {fullLead && (
        <DisqualifyLeadModal
          isOpen={isDisqualifyModalOpen}
          onClose={() => setIsDisqualifyModalOpen(false)}
          lead={fullLead}
          onSuccess={handleDisqualifySuccess}
        />
      )}

      {fullLead && (
        <DeleteLeadModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          leadName={
            fullLead.first_name || fullLead.last_name
              ? `${fullLead.first_name || ""} ${fullLead.last_name || ""}`.trim()
              : fullLead.email || "Unknown contact"
          }
          leadEmail={fullLead.email}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
