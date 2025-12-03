/**
 * LeadDetailPage - Client Component for lead detail view
 * Premium card-based layout with edit mode support
 */

"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CheckCircle, ArrowRightCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadDetailHeader } from "./LeadDetailHeader";
import { LeadDetailCards } from "./LeadDetailCards";
import { QualifyModal } from "./QualifyModal";
import { ConvertToOpportunityModal } from "./ConvertToOpportunityModal";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import type { Lead } from "@/types/crm";

interface LeadNavigation {
  prevId: string | null;
  nextId: string | null;
  currentPosition: number;
  totalCount: number;
}

interface LeadDetailPageProps {
  lead: Lead;
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  locale: "en" | "fr";
  navigation: LeadNavigation;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function LeadDetailPage({
  lead,
  owners,
  locale,
  navigation,
}: LeadDetailPageProps) {
  const router = useRouter();
  const { t } = useTranslation("crm");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead>(lead);

  // Toggle edit mode
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      // Cancel - reset changes
      setEditedLead({});
    }
    setIsEditing(!isEditing);
  }, [isEditing]);

  // Handle field change
  const handleFieldChange = useCallback(
    (field: string, value: string | null) => {
      setEditedLead((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  // Save changes
  const handleSave = useCallback(async () => {
    if (Object.keys(editedLead).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/crm/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedLead),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to update lead");
      }

      // Update local state with the response data
      if (result.data) {
        setCurrentLead(result.data as Lead);
      }

      toast.success(t("leads.drawer.save_success"));
      setIsEditing(false);
      setEditedLead({});
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("leads.drawer.save_error")
      );
    } finally {
      setIsSaving(false);
    }
  }, [editedLead, lead.id, router, t]);

  // Delete lead - open modal
  const handleDelete = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  // Handle delete confirmation from modal
  const handleDeleteConfirm = useCallback(
    async (reason: string, permanentDelete: boolean) => {
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
        router.push(`/${locale}/crm/leads`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("leads.delete.error")
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [lead.id, locale, router, t]
  );

  // Qualify lead
  const handleQualify = useCallback(() => {
    setIsQualifyModalOpen(true);
  }, []);

  // Handle qualify success
  const handleQualifySuccess = useCallback(
    (updatedLead: Lead) => {
      setCurrentLead(updatedLead);
      router.refresh();
    },
    [router]
  );

  // Convert to opportunity
  const handleConvert = useCallback(() => {
    setIsConvertModalOpen(true);
  }, []);

  // Handle convert success
  const handleConvertSuccess = useCallback(
    (result: { lead: Lead; opportunity: Record<string, unknown> }) => {
      setCurrentLead(result.lead);
      router.refresh();
    },
    [router]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-950">
      {/* Sticky Header */}
      <LeadDetailHeader
        lead={currentLead}
        locale={locale}
        isEditing={isEditing}
        isSaving={isSaving}
        onEdit={handleEditToggle}
        onSave={handleSave}
        onDelete={handleDelete}
        onQualify={handleQualify}
        onConvert={handleConvert}
        navigation={navigation}
      />

      {/* Scrollable Content - Full width for cards */}
      <motion.div
        className="flex-1 overflow-y-auto p-6 pb-24"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LeadDetailCards
          lead={currentLead}
          isEditing={isEditing}
          editedLead={editedLead}
          onFieldChange={handleFieldChange}
          owners={owners}
        />
      </motion.div>

      {/* Sticky Footer Actions Bar */}
      {!isEditing && (
        <div className="sticky right-0 bottom-0 left-0 border-t border-gray-200 bg-white/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-gray-800 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/80">
          <div className="flex items-center justify-between">
            {/* Lead Code */}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {lead.lead_code && `#${lead.lead_code}`}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQualify}
                disabled={
                  currentLead.lead_stage === "sales_qualified" ||
                  currentLead.lead_stage === "opportunity"
                }
                className="gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                {t("leads.drawer.actions.qualify")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConvert}
                disabled={currentLead.lead_stage !== "sales_qualified"}
                className="gap-1.5"
              >
                <ArrowRightCircle className="h-4 w-4" />
                {t("leads.drawer.actions.convert")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                {t("leads.drawer.actions.delete")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Qualify Modal */}
      <QualifyModal
        lead={currentLead}
        isOpen={isQualifyModalOpen}
        onClose={() => setIsQualifyModalOpen(false)}
        onSuccess={handleQualifySuccess}
      />

      {/* Convert to Opportunity Modal */}
      <ConvertToOpportunityModal
        lead={currentLead}
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        onSuccess={handleConvertSuccess}
      />

      {/* Delete Lead Modal */}
      <DeleteLeadModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        leadName={`${currentLead.first_name} ${currentLead.last_name}`}
        leadEmail={currentLead.email}
        isLoading={isDeleting}
      />
    </div>
  );
}
