"use client";

/**
 * OpportunityDrawer - Main drawer component for opportunity quick view
 *
 * Opens on opportunity click (single click = drawer)
 * Features:
 * - Edit Mode: inline editing for key fields
 * - Read-only sections displaying opportunity data
 * - Mark as Won/Lost actions
 * - Delete action
 */

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  XCircle,
  Trash,
  DollarSign,
  GitBranch,
  Calendar,
  User,
  FileText,
  Copy,
  Mail,
  Clock,
  AlertTriangle,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select-native";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { OpportunityDrawerHeader } from "./OpportunityDrawerHeader";
import { MarkAsWonModal } from "./MarkAsWonModal";
import { MarkAsLostModal } from "./MarkAsLostModal";
import {
  drawerContainerVariants,
  drawerSectionVariants,
} from "@/lib/animations/drawer-variants";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import { useOpportunityLossReasons } from "@/lib/hooks/useOpportunityLossReasons";
import { ActivityTimeline } from "@/components/crm/shared";
import {
  deleteOpportunityAction,
  updateOpportunityAction,
} from "@/lib/actions/crm/opportunity.actions";
import type { Opportunity } from "@/types/crm";
import type { LucideIcon } from "lucide-react";
import type { UpdateOpportunityData } from "@/lib/actions/crm/opportunity.actions";

interface OpportunityDrawerProps {
  opportunity:
    | (Opportunity & { days_in_stage?: number; is_rotting?: boolean })
    | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onOpenFullPage?: (id: string) => void;
  onOpportunityUpdated?: (updated: Opportunity) => void;
  isLoading?: boolean;
  owners?: Array<{ id: string; first_name: string; last_name: string | null }>;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

function DrawerSkeleton() {
  return (
    <div className="space-y-6 py-4">
      {/* Header skeleton */}
      <div className="flex items-start gap-4">
        <Skeleton className="h-14 w-14 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Badges skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
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

// ============================================================================
// SECTION COMPONENTS (Inline, adapted from LeadDrawerSections pattern)
// ============================================================================

interface DrawerSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  visible?: boolean;
}

function DrawerSection({
  icon: Icon,
  title,
  children,
  visible = true,
}: DrawerSectionProps) {
  if (!visible) return null;

  return (
    <motion.div variants={drawerSectionVariants} className="space-y-3">
      <div className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4" />
        <span>{title}</span>
      </div>
      <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        {children}
      </div>
      <Separator className="mt-4" />
    </motion.div>
  );
}

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  actions?: Array<{
    icon: LucideIcon;
    label: string;
    href?: string;
    onClick?: () => void;
  }>;
  emptyText?: string;
  className?: string;
}

function InfoRow({
  label,
  value,
  actions,
  emptyText = "—",
  className,
}: InfoRowProps) {
  const displayValue =
    value !== null && value !== undefined ? String(value) : emptyText;
  const isEmpty = value === null || value === undefined || value === "";

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            isEmpty && "text-muted-foreground italic"
          )}
        >
          {displayValue}
        </p>
      </div>
      {actions && actions.length > 0 && (
        <div className="flex items-center gap-1">
          {actions.map((action, i) => {
            const ActionIcon = action.icon;
            if (action.href) {
              return (
                <Button
                  key={i}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                  asChild
                >
                  <a href={action.href} title={action.label}>
                    <ActionIcon className="h-4 w-4" />
                  </a>
                </Button>
              );
            }
            return (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="h-7 w-7 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950"
                onClick={action.onClick}
                title={action.label}
              >
                <ActionIcon className="h-4 w-4" />
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// EDITABLE INFO ROW (Edit Mode)
// ============================================================================

interface SelectOption {
  value: string;
  label: string;
}

interface EditableInfoRowProps {
  label: string;
  field: string;
  value: string | number | null | undefined;
  editedValue?: string | number | null;
  isEditing: boolean;
  onChange: (field: string, value: string | number | null) => void;
  type?: "text" | "number" | "date" | "textarea" | "select";
  options?: SelectOption[];
  placeholder?: string;
  emptyText?: string;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

function EditableInfoRow({
  label,
  field,
  value,
  editedValue,
  isEditing,
  onChange,
  type = "text",
  options,
  placeholder,
  emptyText = "—",
  min,
  max,
  step,
  suffix,
}: EditableInfoRowProps) {
  // Use edited value if available, otherwise original value
  const currentValue = editedValue !== undefined ? editedValue : value;
  const displayValue = currentValue?.toString() || emptyText;
  const isEmpty = !currentValue && currentValue !== 0;

  // Read mode
  if (!isEditing) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-muted-foreground text-xs">{label}</p>
          <p
            className={cn(
              "truncate text-sm font-medium",
              isEmpty && "text-muted-foreground italic"
            )}
          >
            {displayValue}
            {suffix && !isEmpty && ` ${suffix}`}
          </p>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      {type === "select" && options ? (
        <Select
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          className="h-9"
        >
          <option value="">{placeholder || "Select..."}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          placeholder={placeholder}
          rows={3}
          className="resize-none"
        />
      ) : type === "number" ? (
        <div className="relative">
          <Input
            type="number"
            value={currentValue?.toString() || ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange(field, val ? parseFloat(val) : null);
            }}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
            className={cn("h-9", suffix && "pr-12")}
          />
          {suffix && (
            <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
              {suffix}
            </span>
          )}
        </div>
      ) : type === "date" ? (
        <Input
          type="date"
          value={
            currentValue
              ? new Date(currentValue.toString()).toISOString().split("T")[0]
              : ""
          }
          onChange={(e) => {
            const val = e.target.value;
            onChange(field, val ? new Date(val).toISOString() : null);
          }}
          className="h-9"
        />
      ) : (
        <Input
          type="text"
          value={currentValue?.toString() || ""}
          onChange={(e) => onChange(field, e.target.value || null)}
          placeholder={placeholder}
          className="h-9"
        />
      )}
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrency(
  value: number | null,
  currency: string = "EUR"
): string {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OpportunityDrawer({
  opportunity,
  isOpen,
  onClose,
  onDelete,
  onOpenFullPage,
  onOpportunityUpdated,
  isLoading = false,
  owners = [],
}: OpportunityDrawerProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { getLabel, getMaxDays } = useOpportunityStages();

  // Load loss reasons dynamically from crm_settings
  const { reasons: dynamicLossReasons } = useOpportunityLossReasons();

  // Current opportunity state (for local updates)
  const [currentOpportunity, setCurrentOpportunity] = useState(opportunity);

  // Modal states
  const [isWonModalOpen, setIsWonModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editedOpportunity, setEditedOpportunity] = useState<
    Partial<UpdateOpportunityData>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync current opportunity with prop
  useEffect(() => {
    setCurrentOpportunity(opportunity);
  }, [opportunity]);

  // Reset states when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsWonModalOpen(false);
      setIsLostModalOpen(false);
      setIsDeleting(false);
      setIsEditing(false);
      setEditedOpportunity({});
    }
  }, [isOpen]);

  // Handle Won success (Quote-to-Cash: returns both opportunity and order)
  const handleWonSuccess = useCallback(
    (data: {
      opportunity: {
        id: string;
        status: string;
        won_date: string;
        won_value: number;
      };
      order: {
        id: string;
        order_reference: string;
        order_code: string;
        total_value: number;
        monthly_value: number;
        annual_value: number;
        effective_date: string;
        expiry_date: string;
      };
    }) => {
      if (currentOpportunity) {
        const updated = {
          ...currentOpportunity,
          status: data.opportunity.status,
          won_date: data.opportunity.won_date || null,
          won_value: data.opportunity.won_value ?? null,
        };
        setCurrentOpportunity(updated);
        onOpportunityUpdated?.(updated as Opportunity);
      }
    },
    [currentOpportunity, onOpportunityUpdated]
  );

  // Handle Lost success
  const handleLostSuccess = useCallback(
    (data: { id: string; status: string; lost_date?: string }) => {
      if (currentOpportunity) {
        const updated = {
          ...currentOpportunity,
          status: data.status,
          lost_date: data.lost_date || null,
        };
        setCurrentOpportunity(updated);
        onOpportunityUpdated?.(updated as Opportunity);
      }
    },
    [currentOpportunity, onOpportunityUpdated]
  );

  // Handle Delete
  const handleDelete = useCallback(async () => {
    if (!currentOpportunity) return;

    if (!confirm(t("opportunity.delete_modal.description"))) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteOpportunityAction(currentOpportunity.id);

      if (result.success) {
        toast.success(t("opportunity.delete_modal.success"));
        onDelete?.(currentOpportunity.id);
        onClose();
      } else {
        toast.error(result.error || t("opportunity.delete_modal.error"));
      }
    } catch {
      toast.error(t("opportunity.delete_modal.error"));
    } finally {
      setIsDeleting(false);
    }
  }, [currentOpportunity, t, onDelete, onClose]);

  // ============================================================================
  // EDIT MODE HANDLERS
  // ============================================================================

  // Enter edit mode
  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedOpportunity({});
  }, []);

  // Cancel edit mode
  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedOpportunity({});
  }, []);

  // Handle field change in edit mode
  const handleFieldChange = useCallback(
    (field: string, value: string | number | null) => {
      setEditedOpportunity((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Save changes
  const handleSave = useCallback(async () => {
    if (!currentOpportunity) return;

    // No changes to save
    if (Object.keys(editedOpportunity).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      // Prepare update data
      const updateData: UpdateOpportunityData = {};

      // Map edited fields to update data
      if (editedOpportunity.expected_value !== undefined) {
        updateData.expected_value = editedOpportunity.expected_value;
      }
      if (editedOpportunity.probability_percent !== undefined) {
        updateData.probability_percent = editedOpportunity.probability_percent;
      }
      if (editedOpportunity.expected_close_date !== undefined) {
        updateData.expected_close_date = editedOpportunity.expected_close_date;
      }
      if (editedOpportunity.assigned_to !== undefined) {
        updateData.assigned_to = editedOpportunity.assigned_to;
      }
      if (editedOpportunity.notes !== undefined) {
        updateData.notes = editedOpportunity.notes;
      }

      const result = await updateOpportunityAction(
        currentOpportunity.id,
        updateData
      );

      if (result.success) {
        toast.success(t("opportunity.drawer.save_success"));
        setIsEditing(false);
        setEditedOpportunity({});

        // Update local state with returned data
        if (result.opportunity) {
          const updated = {
            ...currentOpportunity,
            ...result.opportunity,
          };
          setCurrentOpportunity(updated);
          onOpportunityUpdated?.(updated as Opportunity);
        }
      } else {
        toast.error(result.error ?? t("opportunity.drawer.save_error"));
      }
    } catch {
      toast.error(t("opportunity.drawer.save_error"));
    } finally {
      setIsSaving(false);
    }
  }, [currentOpportunity, editedOpportunity, t, onOpportunityUpdated]);

  // Copy email to clipboard
  const handleCopyEmail = useCallback(() => {
    if (currentOpportunity?.lead?.email) {
      void navigator.clipboard.writeText(currentOpportunity.lead.email);
      toast.success("Email copied to clipboard");
    }
  }, [currentOpportunity]);

  // Get assigned owner name
  const ownerFromList = owners.find(
    (o) => o.id === currentOpportunity?.assigned_to
  );
  const ownerName = currentOpportunity?.assignedTo
    ? `${currentOpportunity.assignedTo.first_name} ${currentOpportunity.assignedTo.last_name || ""}`.trim()
    : ownerFromList
      ? `${ownerFromList.first_name} ${ownerFromList.last_name || ""}`.trim()
      : null;

  // Build owner options for select dropdown
  const ownerOptions: SelectOption[] = owners.map((o) => ({
    value: o.id,
    label: `${o.first_name} ${o.last_name || ""}`.trim(),
  }));

  const isOpen_ = currentOpportunity?.status === "open";
  const isWon = currentOpportunity?.status === "won";
  const isLost = currentOpportunity?.status === "lost";

  // Mark as Won is only allowed for contract_sent or negotiation stages
  const MARK_WON_ALLOWED_STAGES = ["contract_sent", "negotiation"];
  const canMarkAsWon =
    isOpen_ &&
    currentOpportunity?.stage &&
    MARK_WON_ALLOWED_STAGES.includes(currentOpportunity.stage);

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent
          side="right"
          className="flex w-full flex-col overflow-hidden sm:max-w-lg"
        >
          {/* Accessibility: Hidden title for screen readers */}
          <VisuallyHidden.Root>
            <SheetTitle>
              {currentOpportunity?.lead?.company_name || "Opportunity Details"}
            </SheetTitle>
            <SheetDescription>
              Quick view of opportunity information
            </SheetDescription>
          </VisuallyHidden.Root>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto pr-2">
            {isLoading ? (
              <DrawerSkeleton />
            ) : currentOpportunity ? (
              <motion.div
                variants={drawerContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6 py-4"
              >
                {/* Header */}
                <OpportunityDrawerHeader
                  opportunity={currentOpportunity}
                  onOpenFullPage={
                    onOpenFullPage
                      ? () => onOpenFullPage(currentOpportunity.id)
                      : undefined
                  }
                />

                <Separator />

                {/* Value Section */}
                <DrawerSection
                  icon={DollarSign}
                  title={t("opportunity.drawer.sections.value")}
                >
                  <EditableInfoRow
                    label={t("opportunity.drawer.fields.expected_value")}
                    field="expected_value"
                    value={currentOpportunity.expected_value}
                    editedValue={editedOpportunity.expected_value}
                    isEditing={isEditing && isOpen_}
                    onChange={handleFieldChange}
                    type="number"
                    min={0}
                    step={100}
                    suffix={currentOpportunity.currency || "EUR"}
                    emptyText={formatCurrency(null)}
                  />
                  <EditableInfoRow
                    label={t("opportunity.drawer.fields.probability")}
                    field="probability_percent"
                    value={currentOpportunity.probability_percent}
                    editedValue={editedOpportunity.probability_percent}
                    isEditing={isEditing && isOpen_}
                    onChange={handleFieldChange}
                    type="number"
                    min={0}
                    max={100}
                    step={5}
                    suffix="%"
                  />
                  <InfoRow
                    label={t("opportunity.drawer.fields.forecast_value")}
                    value={formatCurrency(
                      currentOpportunity.forecast_value,
                      currentOpportunity.currency || "EUR"
                    )}
                  />
                  {isWon && (
                    <InfoRow
                      label={t("opportunity.table.columns.won_value")}
                      value={formatCurrency(
                        currentOpportunity.won_value,
                        currentOpportunity.currency || "EUR"
                      )}
                      className="text-green-600 dark:text-green-400"
                    />
                  )}
                </DrawerSection>

                {/* Pipeline Section */}
                <DrawerSection
                  icon={GitBranch}
                  title={t("opportunity.drawer.sections.pipeline")}
                >
                  <InfoRow
                    label={t("opportunity.drawer.fields.stage")}
                    value={getLabel(currentOpportunity.stage, "en")}
                  />
                  <InfoRow
                    label={t("opportunity.drawer.fields.status")}
                    value={t(`opportunity.status.${currentOpportunity.status}`)}
                  />
                  {isOpen_ && (
                    <>
                      <InfoRow
                        label={t("opportunity.drawer.fields.days_in_stage")}
                        value={currentOpportunity.days_in_stage ?? 0}
                      />
                      <InfoRow
                        label={t("opportunity.drawer.fields.max_days")}
                        value={
                          getMaxDays(currentOpportunity.stage) ??
                          currentOpportunity.max_days_in_stage ??
                          14
                        }
                      />
                      {currentOpportunity.is_rotting && (
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {t("opportunity.rotting.action_required")}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </DrawerSection>

                {/* Dates Section */}
                <DrawerSection
                  icon={Calendar}
                  title={t("opportunity.drawer.sections.dates")}
                >
                  <EditableInfoRow
                    label={t("opportunity.drawer.fields.expected_close_date")}
                    field="expected_close_date"
                    value={currentOpportunity.expected_close_date}
                    editedValue={editedOpportunity.expected_close_date}
                    isEditing={isEditing && isOpen_}
                    onChange={handleFieldChange}
                    type="date"
                    emptyText={formatDate(null)}
                  />
                  <InfoRow
                    label={t("opportunity.drawer.fields.created_at")}
                    value={formatDate(currentOpportunity.created_at)}
                  />
                  {currentOpportunity.updated_at && (
                    <InfoRow
                      label={t("opportunity.drawer.fields.updated_at")}
                      value={formatDate(currentOpportunity.updated_at)}
                    />
                  )}
                  {isWon && currentOpportunity.won_date && (
                    <InfoRow
                      label={t("opportunity.table.columns.won_date")}
                      value={formatDate(currentOpportunity.won_date)}
                      className="text-green-600 dark:text-green-400"
                    />
                  )}
                  {isLost && currentOpportunity.lost_date && (
                    <InfoRow
                      label={t("opportunity.table.columns.lost_date")}
                      value={formatDate(currentOpportunity.lost_date)}
                      className="text-gray-500 dark:text-gray-400"
                    />
                  )}
                </DrawerSection>

                {/* Contact Section (from Lead) */}
                {currentOpportunity.lead && (
                  <DrawerSection
                    icon={User}
                    title={t("opportunity.drawer.sections.contact")}
                  >
                    <InfoRow
                      label={t("opportunity.drawer.fields.contact_name")}
                      value={`${currentOpportunity.lead.first_name} ${currentOpportunity.lead.last_name}`.trim()}
                    />
                    <InfoRow
                      label={t("opportunity.drawer.fields.email")}
                      value={currentOpportunity.lead.email}
                      actions={
                        currentOpportunity.lead.email
                          ? [
                              {
                                icon: Copy,
                                label: "Copy email",
                                onClick: handleCopyEmail,
                              },
                              {
                                icon: Mail,
                                label: "Send email",
                                href: `mailto:${currentOpportunity.lead.email}`,
                              },
                            ]
                          : undefined
                      }
                    />
                  </DrawerSection>
                )}

                {/* Assignment Section */}
                <DrawerSection
                  icon={Clock}
                  title={t("opportunity.drawer.sections.assignment")}
                >
                  <EditableInfoRow
                    label={t("opportunity.drawer.fields.assigned_to")}
                    field="assigned_to"
                    value={currentOpportunity.assigned_to}
                    editedValue={editedOpportunity.assigned_to}
                    isEditing={isEditing && isOpen_}
                    onChange={handleFieldChange}
                    type="select"
                    options={ownerOptions}
                    placeholder={t("opportunity.drawer.unassigned")}
                    emptyText={ownerName || t("opportunity.drawer.unassigned")}
                  />
                </DrawerSection>

                {/* Notes Section */}
                <DrawerSection
                  icon={FileText}
                  title={t("opportunity.drawer.sections.notes")}
                  visible={!!currentOpportunity.notes || isEditing}
                >
                  <EditableInfoRow
                    label={t("opportunity.drawer.fields.notes")}
                    field="notes"
                    value={currentOpportunity.notes}
                    editedValue={editedOpportunity.notes}
                    isEditing={isEditing && isOpen_}
                    onChange={handleFieldChange}
                    type="textarea"
                    placeholder={t("opportunity.drawer.notes_placeholder")}
                    emptyText={t("opportunity.drawer.no_notes")}
                  />
                </DrawerSection>

                {/* Activity Timeline Section */}
                <DrawerSection
                  icon={Clock}
                  title={t("activities.timeline.title")}
                >
                  <ActivityTimeline
                    opportunityId={currentOpportunity.id}
                    email={currentOpportunity.lead?.email}
                    phone={currentOpportunity.lead?.phone}
                    showAddButton={isOpen_}
                    maxHeight="300px"
                  />
                </DrawerSection>
              </motion.div>
            ) : null}
          </div>

          {/* Footer with action buttons */}
          {currentOpportunity && !isLoading && (
            <div className="mt-auto border-t pt-4">
              {isEditing ? (
                /* Edit Mode Footer: Save / Cancel */
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t("opportunity.drawer.cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {t("opportunity.drawer.save")}
                  </Button>
                </div>
              ) : (
                /* Read Mode Footer: Edit / Won / Lost / Delete */
                <div className="flex flex-wrap gap-2">
                  {/* Edit - Only for open opportunities */}
                  {isOpen_ && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                      onClick={handleEdit}
                    >
                      <Pencil className="h-4 w-4" />
                      {t("opportunity.drawer.actions.edit")}
                    </Button>
                  )}

                  {/* Mark as Won - Only for contract_sent/negotiation stages */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-green-600 hover:bg-green-50 hover:text-green-700 dark:text-green-400 dark:hover:bg-green-950"
                    onClick={() => setIsWonModalOpen(true)}
                    disabled={!canMarkAsWon}
                    title={
                      isOpen_ && !canMarkAsWon
                        ? t("opportunity.drawer.mark_won_stage_required")
                        : undefined
                    }
                  >
                    <Trophy className="h-4 w-4" />
                    {t("opportunity.drawer.actions.mark_won")}
                  </Button>

                  {/* Mark as Lost - Only for open opportunities */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                    onClick={() => setIsLostModalOpen(true)}
                    disabled={!isOpen_}
                  >
                    <XCircle className="h-4 w-4" />
                    {t("opportunity.drawer.actions.mark_lost")}
                  </Button>

                  {/* Delete */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                    {t("opportunity.drawer.actions.delete")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mark as Won Modal */}
      {currentOpportunity && (
        <MarkAsWonModal
          opportunity={currentOpportunity}
          isOpen={isWonModalOpen}
          onClose={() => setIsWonModalOpen(false)}
          onSuccess={handleWonSuccess}
        />
      )}

      {/* Mark as Lost Modal */}
      {currentOpportunity && (
        <MarkAsLostModal
          opportunity={currentOpportunity}
          isOpen={isLostModalOpen}
          onClose={() => setIsLostModalOpen(false)}
          onSuccess={handleLostSuccess}
          lossReasons={dynamicLossReasons}
        />
      )}
    </>
  );
}
