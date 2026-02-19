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
import { PaymentLinkSection } from "./PaymentLinkSection";
import { LeadQuoteSection } from "./LeadQuoteSection";
import { CPTQualificationModal } from "./CPTQualificationModal";
import { ConvertToOpportunityModal } from "./ConvertToOpportunityModal";
import { DeleteLeadModal } from "./DeleteLeadModal";
import { deleteLeadAction } from "@/lib/actions/crm/delete.actions";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import type { Lead } from "@/types/crm";

interface LeadsBrowserClientProps {
  leads: Lead[];
  owners: Array<{ id: string; first_name: string; last_name: string | null }>;
  locale: "en" | "fr";
}

// Status colors — delegated to pipeline-status config

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

  // Get status color from pipeline config
  const getStatusColor = (status: string) => {
    const cfg = getStatusConfig(status);
    return { bg: cfg.bgMedium, text: cfg.text };
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

  // G2: Handle qualify success (CPT framework)
  const handleQualifySuccess = useCallback(() => {
    // Refresh the page to get updated lead data
    window.location.reload();
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
      <div className="border-border bg-background flex w-72 flex-col border-r lg:w-80">
        {/* Search Header */}
        <div className="border-border border-b p-3">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("leads.search.placeholder_short")}
              className="border-input bg-muted focus:border-primary focus:bg-background w-full rounded-lg border py-2 pr-8 pl-9 text-sm transition-colors outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-muted-foreground hover:bg-accent hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="text-muted-foreground mt-1.5 text-xs">
            {filteredLeads.length}{" "}
            {filteredLeads.length === 1 ? "lead" : "leads"}
          </div>
        </div>

        {/* Lead List */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <Search className="text-muted-foreground/50 mb-2 h-8 w-8" />
              <p className="text-muted-foreground text-sm">
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
                    "border-border/50 w-full border-b px-3 py-2.5 text-left transition-colors",
                    selectedLeadId === lead.id
                      ? "bg-primary/10"
                      : highlightedIndex === index
                        ? "bg-accent"
                        : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Company Icon */}
                    <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <Building2 className="text-primary h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-foreground truncate text-sm font-medium">
                          {lead.company_name ||
                            t("leads.drawer.empty.unknown_company")}
                        </span>
                        {lead.country?.flag_emoji && (
                          <span className="text-xs">
                            {lead.country.flag_emoji}
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
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
                        <span className="text-muted-foreground text-[10px]">
                          {formatRelativeTime(lead.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight
                      className={cn(
                        "text-muted-foreground/50 mt-1 h-4 w-4 shrink-0 transition-colors",
                        selectedLeadId === lead.id && "text-primary"
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
      <div className="bg-muted/50 flex flex-1 flex-col overflow-hidden">
        {selectedLead ? (
          <>
            {/* Header with Edit Controls */}
            <header className="border-border bg-background shrink-0 border-b px-6 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Company + Contact Info */}
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                    <Building2 className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="text-foreground text-xl font-semibold">
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
                    <div className="text-muted-foreground mt-0.5 flex items-center gap-3 text-sm">
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
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                            className="text-destructive focus:text-destructive"
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

              {/* V6.2-11: Payment Link Section */}
              {!isEditing && (
                <div className="mt-6">
                  <PaymentLinkSection lead={selectedLead} />
                </div>
              )}

              {/* V6.2-11: Quote Section for Segment 4 */}
              {!isEditing && (
                <div className="mt-6">
                  <LeadQuoteSection lead={selectedLead} />
                </div>
              )}
            </motion.div>
          </>
        ) : (
          // Empty State
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="bg-muted mb-4 flex h-16 w-16 items-center justify-center rounded-2xl">
              <Search className="text-muted-foreground h-8 w-8" />
            </div>
            <h3 className="text-foreground text-lg font-medium">
              {t("leads.search.title")}
            </h3>
            <p className="text-muted-foreground mt-2 max-w-sm text-sm">
              {t("leads.search.start_typing")}
            </p>
            <div className="text-muted-foreground/70 mt-4 text-xs">
              {t("leads.search.hint_navigate")} •{" "}
              {t("leads.search.hint_select")}
            </div>
          </div>
        )}
      </div>

      {/* G2: CPT Qualification Modal */}
      {selectedLead && (
        <CPTQualificationModal
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
