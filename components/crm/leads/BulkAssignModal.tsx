"use client";

/**
 * BulkAssignModal - Modal for bulk assigning leads to a team member
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserPlus, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  first_name: string;
  last_name: string | null;
}

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assigneeId: string) => Promise<void>;
  selectedCount: number;
  teamMembers: TeamMember[];
  isLoading?: boolean;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  teamMembers,
  isLoading = false,
}: BulkAssignModalProps) {
  const { t } = useTranslation("crm");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!selectedMemberId) return;
    await onConfirm(selectedMemberId);
    setSelectedMemberId(null);
  };

  const handleClose = () => {
    setSelectedMemberId(null);
    onClose();
  };

  // Get initials for avatar
  const getInitials = (member: TeamMember): string => {
    const first = member.first_name?.[0]?.toUpperCase() || "";
    const last = member.last_name?.[0]?.toUpperCase() || "";
    return `${first}${last}` || "?";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t("leads.bulk_actions.assign_modal.title", {
              count: selectedCount,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("leads.bulk_actions.assign_modal.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("leads.bulk_actions.assign_modal.select_assignee")}
          </label>

          <div className="mt-3 max-h-[240px] space-y-1 overflow-y-auto rounded-lg border p-2">
            {teamMembers.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                {t("leads.bulk_actions.assign_modal.no_members")}
              </p>
            ) : (
              teamMembers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => setSelectedMemberId(member.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition-colors",
                    selectedMemberId === member.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                    {getInitials(member)}
                  </div>
                  <span className="flex-1 text-sm">
                    {member.first_name} {member.last_name || ""}
                  </span>
                  {selectedMemberId === member.id && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t("common:cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMemberId || isLoading}
          >
            {isLoading
              ? t("leads.bulk_actions.assign_modal.assigning")
              : t("leads.bulk_actions.assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
