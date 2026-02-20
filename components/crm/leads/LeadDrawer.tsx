/**
 * LeadDrawer - 2-column workstation popup for lead quick view
 *
 * LEFT (w-2/5): Consultable info during a call (header, contact, company, etc.)
 * RIGHT (w-3/5): Actions + Timeline (inline activity form, status actions, timeline)
 *
 * Uses Dialog (centered, fade+scale). Supports read-only and edit mode.
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Pencil,
  Ban,
  Trash,
  CheckCircle,
  X,
  Loader2,
  CalendarCheck,
  Clock,
} from "lucide-react";
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
  NotesSection,
  MessageSection,
  TimelineSection,
} from "./LeadDrawerSections";
import { InlineActivityForm } from "./InlineActivityForm";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { DisqualifyLeadModal } from "./DisqualifyLeadModal";
import { LeadStatusActions, type BookingData } from "./LeadStatusActions";
import { drawerContainerVariants } from "@/lib/animations/drawer-variants";
import {
  updateLeadAction,
  updateLeadStatusAction,
  type UpdateLeadData,
} from "@/lib/actions/crm/lead.actions";
import { useInvalidate } from "@refinedev/core";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import { usePermission } from "@/lib/hooks/usePermission";
import type { Lead } from "@/types/crm";
import type { PendingTransition } from "@/features/crm/leads/hooks/use-leads-kanban";

interface LeadDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onOpenFullPage?: (id: string) => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
  isLoading?: boolean;
  owners?: Array<{
    id: string;
    first_name: string;
    last_name: string | null;
  }>;
  transition?: PendingTransition | null;
  onTransitionComplete?: () => void;
  onTransitionCancel?: () => void;
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
  onLeadUpdated,
  isLoading = false,
  owners = [],
  transition = null,
  onTransitionComplete,
  onTransitionCancel,
}: LeadDrawerProps) {
  const { t } = useTranslation("crm");
  const { can } = usePermission();
  const invalidate = useInvalidate();

  // ── Edit Mode States ─────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── State ────────────────────────────────────────────────────────────
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Timeline refresh counter — incremented by InlineActivityForm
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Cal.com inline embed state — lifted from LeadStatusActions
  const [showCalEmbed, setShowCalEmbed] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData | null>(null);

  // Reset states when lead changes or popup closes
  useEffect(() => {
    setIsEditing(false);
    setEditedLead({});
    setIsSaving(false);
    setIsDisqualifyModalOpen(false);
    setIsDeleteModalOpen(false);
    setIsDeleting(false);
    setShowCalEmbed(false);
    setBookingData(null);
    setCurrentLead(lead);
  }, [lead?.id, isOpen, lead]);

  // ── Edit mode handlers ───────────────────────────────────────────────

  const handleFieldChange = useCallback(
    (field: string, value: string | null) => {
      setEditedLead((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSave = useCallback(async () => {
    if (!lead) return;

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

      const result = await updateLeadAction(lead.id, updateData);

      if (result.success) {
        toast.success(t("leads.drawer.save_success"));
        setIsEditing(false);
        setEditedLead({});
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

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedLead({});
  }, []);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  // ── Booking success handler ──────────────────────────────────────────

  const handleBookingSuccess = useCallback(
    (data: BookingData) => {
      // Store booking data for display
      setBookingData(data);

      // Update lead status to "demo" immediately
      void updateLeadStatusAction(lead?.id ?? "", "demo", {
        reasonDetail: "Demo booked via Cal.com",
      }).then((result) => {
        if (result.success) {
          toast.success(t("leads.step_actions.success"));
          // Update local lead to reflect new status without page reload
          if (lead) {
            const updatedLead = { ...lead, status: "demo" };
            setCurrentLead(updatedLead);
            onLeadUpdated?.(updatedLead);
          }
          // Invalidate kanban list so cards update in background
          void invalidate({ resource: "leads", invalidates: ["list"] });
        }
      });
    },
    [lead, t, invalidate, onLeadUpdated]
  );

  // ── Disqualify handlers ──────────────────────────────────────────────

  const handleDisqualify = useCallback(() => {
    setIsDisqualifyModalOpen(true);
  }, []);

  const handleDisqualifySuccess = useCallback(() => {
    setIsDisqualifyModalOpen(false);
    onClose();
    if (lead) {
      onLeadUpdated?.({ ...lead, status: "disqualified" });
    }
  }, [lead, onClose, onLeadUpdated]);

  // ── Delete handlers ──────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

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

  const showGdprSection = lead
    ? (lead.country?.country_gdpr ??
      EU_COUNTRY_CODES.includes(lead.country_code?.toUpperCase() || ""))
    : false;

  // ── Handle close ─────────────────────────────────────────────────────

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        if (transition) onTransitionCancel?.();
        onClose();
      }
    },
    [transition, onTransitionCancel, onClose]
  );

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent
          data-testid="lead-drawer"
          showCloseIcon
          className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        >
          {/* Accessibility */}
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
            {isLoading ? (
              <div className="flex-1 px-6 py-5">
                <DrawerSkeleton />
              </div>
            ) : lead ? (
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
                      lead={lead}
                      onOpenFullPage={
                        onOpenFullPage
                          ? () => onOpenFullPage(lead.id)
                          : undefined
                      }
                    />
                    <Separator />
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
                    <AssignmentSection
                      lead={lead}
                      isEditing={isEditing}
                      editedLead={editedLead}
                      onFieldChange={handleFieldChange}
                      owners={owners}
                    />
                    <LocationSection lead={lead} />
                    <SourceSection lead={lead} />
                    <GdprSection lead={lead} visible={showGdprSection} />
                    <NotesSection lead={lead} />
                    <MessageSection
                      lead={lead}
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
                      leadId={lead.id}
                      leadEmail={lead.email}
                      leadPhone={lead.phone}
                      onSuccess={() => setRefreshTrigger((prev) => prev + 1)}
                    />

                    <Separator />

                    {/* Booking confirmation — shown after Cal.com booking */}
                    {bookingData && (
                      <>
                        <div className="bg-accent/50 space-y-2 rounded-lg border p-4">
                          <div className="flex items-center gap-2">
                            <CalendarCheck className="text-foreground size-4" />
                            <h4 className="text-foreground text-xs font-semibold tracking-wider uppercase">
                              {t(
                                "leads.step_actions.booking_confirmed",
                                "Démo planifiée"
                              )}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="text-muted-foreground size-3.5" />
                            <span>
                              {new Date(
                                bookingData.startTime
                              ).toLocaleDateString(undefined, {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                              {" — "}
                              {new Date(
                                bookingData.startTime
                              ).toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" - "}
                              {new Date(bookingData.endTime).toLocaleTimeString(
                                undefined,
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Step Actions (manual + drag & drop + Cal embed) */}
                    <LeadStatusActions
                      lead={currentLead || lead}
                      onStatusChanged={() => {
                        if (transition) {
                          onTransitionComplete?.();
                        }
                        onClose();
                      }}
                      pendingTransition={transition}
                      onTransitionCancel={onTransitionCancel}
                      showCalEmbed={showCalEmbed}
                      onShowCalEmbed={setShowCalEmbed}
                      onBookingSuccess={handleBookingSuccess}
                    />

                    <Separator />

                    {/* Timeline */}
                    <TimelineSection
                      lead={lead}
                      hideAddButton={true}
                      refreshTrigger={refreshTrigger}
                    />
                  </motion.div>
                </div>
              </>
            ) : null}
          </div>

          {/* Footer with action buttons */}
          {lead && !isLoading && (
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
      {currentLead && (
        <DisqualifyLeadModal
          isOpen={isDisqualifyModalOpen}
          onClose={() => setIsDisqualifyModalOpen(false)}
          lead={currentLead}
          onSuccess={handleDisqualifySuccess}
        />
      )}

      {currentLead && (
        <DeleteLeadModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          leadName={
            currentLead.first_name || currentLead.last_name
              ? `${currentLead.first_name || ""} ${currentLead.last_name || ""}`.trim()
              : currentLead.email || "Unknown contact"
          }
          leadEmail={currentLead.email}
          isLoading={isDeleting}
        />
      )}
    </>
  );
}
