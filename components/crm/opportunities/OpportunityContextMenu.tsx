"use client";

/**
 * OpportunityContextMenu - Right-click context menu for opportunity rows/cards
 *
 * Best practices implemented:
 * - WAI-ARIA compliant via Radix UI
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Disabled items shown (not hidden) per NN/g guidelines
 * - Frequency-ordered items (most common first)
 *
 * @see https://www.nngroup.com/articles/contextual-menus/
 * @see https://www.radix-ui.com/primitives/docs/components/context-menu
 */

import {
  Eye,
  Pencil,
  Mail,
  RefreshCw,
  Trophy,
  XCircle,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useOpportunityStages } from "@/lib/hooks/useOpportunityStages";
import type { Opportunity, OpportunityStage } from "@/types/crm";

// Tailwind color mapping for stage colors
const STAGE_COLOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  green: "bg-green-500",
  gray: "bg-gray-500",
  red: "bg-red-500",
};

interface OpportunityContextMenuProps {
  opportunity: Opportunity;
  children: React.ReactNode;
  onView?: () => void;
  onEdit?: () => void;
  onStageChange?: (stage: OpportunityStage) => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function OpportunityContextMenu({
  opportunity,
  children,
  onView,
  onEdit,
  onStageChange,
  onMarkWon,
  onMarkLost,
  onDelete,
  disabled = false,
}: OpportunityContextMenuProps) {
  const { t } = useTranslation("crm");

  // Load stages dynamically from crm_settings
  const { stages, getLabel, getColor } = useOpportunityStages();

  // If disabled (e.g., during drag), just render children
  if (disabled) {
    return <>{children}</>;
  }

  const isOpen = opportunity.status === "open";
  const _hasPhone = opportunity.lead?.email; // We don't have phone in lead relation
  const hasEmail = opportunity.lead?.email;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* PRIMARY ACTIONS - Most frequent */}
        <ContextMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          {t("opportunity.context_menu.view", "View")}
        </ContextMenuItem>

        <ContextMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("opportunity.context_menu.edit", "Edit")}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* COMMUNICATION ACTIONS - Disabled if no contact info */}
        <ContextMenuItem disabled={!hasEmail} asChild={!!hasEmail}>
          {hasEmail ? (
            <a href={`mailto:${opportunity.lead?.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              {t("opportunity.context_menu.email", "Send Email")}
            </a>
          ) : (
            <span>
              <Mail className="mr-2 h-4 w-4" />
              {t("opportunity.context_menu.email", "Send Email")}
            </span>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* WORKFLOW ACTIONS - Stage change */}
        <ContextMenuSub>
          <ContextMenuSubTrigger disabled={!isOpen}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("opportunity.context_menu.change_stage", "Change Stage")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {stages.map((stage) => (
              <ContextMenuItem
                key={stage.value}
                onClick={() => onStageChange?.(stage.value)}
                className={opportunity.stage === stage.value ? "bg-accent" : ""}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${STAGE_COLOR_CLASSES[getColor(stage.value)] || "bg-gray-500"}`}
                />
                {getLabel(stage.value, "en")}
                {opportunity.stage === stage.value && (
                  <span className="ml-auto text-xs opacity-60">
                    {t("opportunity.context_menu.current", "Current")}
                  </span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        {/* OUTCOME ACTIONS */}
        <ContextMenuItem
          onClick={onMarkWon}
          disabled={!isOpen}
          className="text-green-600 focus:text-green-600 dark:text-green-400"
        >
          <Trophy className="mr-2 h-4 w-4" />
          {t("opportunity.context_menu.mark_won", "Mark as Won")}
        </ContextMenuItem>

        <ContextMenuItem
          onClick={onMarkLost}
          disabled={!isOpen}
          className="text-orange-600 focus:text-orange-600 dark:text-orange-400"
        >
          <XCircle className="mr-2 h-4 w-4" />
          {t("opportunity.context_menu.mark_lost", "Mark as Lost")}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* DESTRUCTIVE ACTION - Always last */}
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          {t("opportunity.context_menu.delete", "Delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
