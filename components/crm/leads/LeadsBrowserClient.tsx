"use client";

/**
 * LeadsBrowserClient - Split view with master list (left) + FULL detail panel (right)
 * Features:
 * - Instant search with keyboard navigation
 * - Click to select and view FULL details (no additional navigation needed)
 * - Edit mode with save functionality
 * - Same detail view as the dedicated page
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Building2,
  ChevronRight,
  X,
  Pencil,
  Save,
  Trash2,
  Mail,
  Phone,
  MoreHorizontal,
  Loader2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadDetailCards } from "./LeadDetailCards";
import { QualifyModal } from "./QualifyModal";
import { ConvertToOpportunityModal } from "./ConvertToOpportunityModal";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import type { Lead, LeadStatus } from "@/types/crm";

interface LeadsBrowserClientProps {
  leads: Lead[];
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  locale: "en" | "fr";
}

// Status colors
const statusConfig: Record<LeadStatus, { bg: string; text: string }> = {
  new: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-300",
  },
  working: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
  },
  qualified: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  lost: {
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-600 dark:text-gray-400",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export function LeadsBrowserClient({
  leads: initialLeads,
  owners,
  locale: _locale,
}: LeadsBrowserClientProps) {
  const { t } = useTranslation("crm");
  const _router = useRouter();

  // State for lead list (may be refreshed after edits)
  const [leads, setLeads] = useState(initialLeads);

  // Search and selection state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedLead, setEditedLead] = useState<Partial<Lead>>({});

  // G4: Delete Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // G2: Qualify Modal state
  const [isQualifyModalOpen, setIsQualifyModalOpen] = useState(false);

  // G3: Convert Modal state
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  // Refs
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;

    const query = searchQuery.toLowerCase();
    return leads.filter((lead) => {
      const searchableFields = [
        lead.first_name,
        lead.last_name,
        lead.email,
        lead.company_name,
        lead.phone,
        lead.city,
        lead.lead_code,
      ];
      return searchableFields.some(
        (field) => field && field.toLowerCase().includes(query)
      );
    });
  }, [leads, searchQuery]);

  // Get selected lead
  const selectedLead = useMemo(() => {
    if (!selectedLeadId) return null;
    return leads.find((lead) => lead.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  // Get status color
  const getStatusColor = (status: string) => {
    const config = statusConfig[status] || statusConfig.new;
    return config;
  };

  // Handle lead selection - simple and reliable
  const handleSelectLead = useCallback((leadId: string) => {
    // Reset edit mode when changing selection
    setIsEditing(false);
    setEditedLead({});
    // Update selection
    setSelectedLeadId(leadId);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) =>
          Math.min(prev + 1, filteredLeads.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && filteredLeads[highlightedIndex]) {
        e.preventDefault();
        handleSelectLead(filteredLeads[highlightedIndex].id);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setSearchQuery("");
        inputRef.current?.blur();
      }
    },
    [filteredLeads, highlightedIndex, handleSelectLead]
  );

  // Reset highlighted index when search changes
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    const listElement = listRef.current;
    if (!listElement) return;

    const highlightedElement = listElement.querySelector(
      `[data-index="${highlightedIndex}"]`
    );
    if (highlightedElement) {
      highlightedElement.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Edit mode handlers
  const handleEditToggle = useCallback(() => {
    if (isEditing) {
      setEditedLead({});
    }
    setIsEditing(!isEditing);
  }, [isEditing]);

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
    if (!selectedLead || Object.keys(editedLead).length === 0) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/v1/crm/leads/${selectedLead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedLead),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Failed to update lead");
      }

      const updatedLead = await response.json();

      // Update the lead in our local state
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id ? { ...l, ...updatedLead.data } : l
        )
      );

      toast.success(t("leads.drawer.save_success"));
      setIsEditing(false);
      setEditedLead({});
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("leads.drawer.save_error")
      );
    } finally {
      setIsSaving(false);
    }
  }, [editedLead, selectedLead, t]);

  // G4: Delete lead - open modal
  const handleDeleteClick = useCallback(() => {
    setIsDeleteModalOpen(true);
  }, []);

  // G4: Handle delete confirmation
  const handleDeleteConfirm = useCallback(
    async (reason: string, permanentDelete: boolean) => {
      if (!selectedLead) return;

      setIsDeleting(true);
      try {
        const result = await deleteLeadAction(
          selectedLead.id,
          reason,
          permanentDelete
        );

        if (!result.success) {
          throw new Error(result.error);
        }

        // Remove from local state
        setLeads((prev) => prev.filter((l) => l.id !== selectedLead.id));
        setSelectedLeadId(null);
        toast.success(
          permanentDelete
            ? t("leads.delete.success_permanent")
            : t("leads.delete.success")
        );
        setIsDeleteModalOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : t("leads.delete.error")
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [selectedLead, t]
  );

  // G2: Handle qualify
  const handleQualify = useCallback(() => {
    setIsQualifyModalOpen(true);
  }, []);

  // G2: Handle qualify success
  const handleQualifySuccess = useCallback((updatedLead: Lead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );
  }, []);

  // G3: Handle convert
  const handleConvert = useCallback(() => {
    setIsConvertModalOpen(true);
  }, []);

  // G3: Handle convert success
  const handleConvertSuccess = useCallback(
    (result: { lead: Lead; opportunity: Record<string, unknown> }) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === result.lead.id ? result.lead : l))
      );
    },
    []
  );

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("leads.time.just_now");
    if (diffMins < 60) return t("leads.time.minutes_ago", { count: diffMins });
    if (diffHours < 24) return t("leads.time.hours_ago", { count: diffHours });
    if (diffDays < 7) return t("leads.time.days_ago", { count: diffDays });
    return t("leads.time.weeks_ago", { count: Math.floor(diffDays / 7) });
  };

  return (
    <div className="flex h-full">
      {/* Left Panel - Master List */}
      <div className="flex w-72 flex-col border-r border-gray-200 bg-white lg:w-80 dark:border-gray-800 dark:bg-gray-950">
        {/* Search Header */}
        <div className="border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("leads.search.placeholder_short")}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pr-8 pl-9 text-sm transition-colors outline-none focus:border-blue-500 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:focus:border-blue-500 dark:focus:bg-gray-950"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="mt-1.5 text-xs text-gray-500">
            {filteredLeads.length}{" "}
            {filteredLeads.length === 1 ? "lead" : "leads"}
          </div>
        </div>

        {/* Lead List */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Search className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500">
                {t("leads.search.no_results")}
              </p>
            </div>
          ) : (
            filteredLeads.map((lead, index) => {
              const status = getStatusColor(lead.status);
              return (
                <button
                  key={lead.id}
                  type="button"
                  data-index={index}
                  onClick={() => handleSelectLead(lead.id)}
                  className={cn(
                    "w-full border-b border-gray-100 px-3 py-2.5 text-left transition-colors dark:border-gray-800",
                    selectedLeadId === lead.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : highlightedIndex === index
                        ? "bg-gray-50 dark:bg-gray-900"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Company Icon */}
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {lead.company_name ||
                            t("leads.drawer.empty.unknown_company")}
                        </span>
                        {lead.country?.flag_emoji && (
                          <span className="text-xs">
                            {lead.country.flag_emoji}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium",
                            status.bg,
                            status.text
                          )}
                        >
                          {t(`leads.status.${lead.status}`)}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatRelativeTime(lead.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className={cn(
                        "mt-1 h-4 w-4 shrink-0 text-gray-300 transition-colors",
                        selectedLeadId === lead.id && "text-blue-500"
                      )}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel - FULL Detail View */}
      <div className="flex flex-1 flex-col overflow-hidden bg-gray-50 dark:bg-gray-950">
        {selectedLead ? (
          <>
            {/* Header with Edit Controls */}
            <header className="shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                {/* Left: Company + Contact Info */}
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedLead.company_name ||
                          t("leads.drawer.empty.unknown_company")}
                      </h1>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          getStatusColor(selectedLead.status).bg,
                          getStatusColor(selectedLead.status).text
                        )}
                      >
                        {t(`leads.status.${selectedLead.status}`)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {selectedLead.first_name} {selectedLead.last_name}
                      </span>
                      {selectedLead.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {selectedLead.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleEditToggle}
                        disabled={isSaving}
                      >
                        <X className="mr-1.5 h-4 w-4" />
                        {t("leads.drawer.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-4 w-4" />
                        )}
                        {isSaving
                          ? t("leads.drawer.saving")
                          : t("leads.drawer.save")}
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Quick Actions */}
                      {selectedLead.email && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-9 w-9"
                        >
                          <a
                            href={`mailto:${selectedLead.email}`}
                            title={t("leads.context_menu.email")}
                          >
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      {selectedLead.phone && (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="h-9 w-9"
                        >
                          <a
                            href={`tel:${selectedLead.phone}`}
                            title={t("leads.context_menu.call")}
                          >
                            <Phone className="h-4 w-4" />
                          </a>
                        </Button>
                      )}

                      {/* Edit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditToggle}
                      >
                        <Pencil className="mr-1.5 h-4 w-4" />
                        {t("leads.drawer.actions.edit")}
                      </Button>

                      {/* More Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={handleQualify}>
                            {t("leads.drawer.actions.qualify")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleConvert}>
                            {t("leads.drawer.actions.convert")}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 dark:text-red-400"
                            onClick={handleDeleteClick}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("leads.drawer.actions.delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable Content - Full LeadDetailCards */}
            <motion.div
              className="flex-1 overflow-y-auto p-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={selectedLead.id}
            >
              <LeadDetailCards
                lead={selectedLead}
                isEditing={isEditing}
                editedLead={editedLead}
                onFieldChange={handleFieldChange}
                owners={owners}
              />
            </motion.div>
          </>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {t("leads.search.title")}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
              {t("leads.search.start_typing")}
            </p>
            <div className="mt-4 text-xs text-gray-400">
              {t("leads.search.hint_navigate")} •{" "}
              {t("leads.search.hint_select")}
            </div>
          </div>
        )}
      </div>

      {/* G2: Qualify Modal */}
      {selectedLead && (
        <QualifyModal
          lead={selectedLead}
          isOpen={isQualifyModalOpen}
          onClose={() => setIsQualifyModalOpen(false)}
          onSuccess={handleQualifySuccess}
        />
      )}

      {/* G3: Convert to Opportunity Modal */}
      {selectedLead && (
        <ConvertToOpportunityModal
          lead={selectedLead}
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          onSuccess={handleConvertSuccess}
        />
      )}

      {/* G4: Delete Lead Modal */}
      {selectedLead && (
        <DeleteLeadModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          leadName={`${selectedLead.first_name} ${selectedLead.last_name}`}
          leadEmail={selectedLead.email}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
}
