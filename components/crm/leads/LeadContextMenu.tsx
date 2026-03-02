"use client";

/**
 * LeadContextMenu - Right-click context menu for lead rows/cards (V7)
 *
 * Best practices implemented:
 * - WAI-ARIA compliant via Radix UI
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Disabled items shown (not hidden) per NN/g guidelines
 * - Change Status filtered dynamically by transitions_to from crm_settings
 *
 * @see https://www.nngroup.com/articles/contextual-menus/
 * @see https://www.radix-ui.com/primitives/docs/components/context-menu
 */

import {
  Eye,
  Pencil,
  Phone,
  Mail,
  RefreshCw,
  ArrowRightCircle,
  Ban,
  Trash,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
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
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import type { Lead, LeadStatus } from "@/types/crm";

interface LeadContextMenuProps {
  lead: Lead;
  children: React.ReactNode;
  onView?: () => void;
  onEdit?: () => void;
  onStatusChange?: (status: LeadStatus) => void;
  onConvert?: () => void;
  onDisqualify?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export function LeadContextMenu({
  lead,
  children,
  onView,
  onEdit,
  onStatusChange,
  onConvert,
  onDisqualify,
  onDelete,
  disabled = false,
}: LeadContextMenuProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { getValidTransitions, getLabel } = useLeadStatuses();

  // If disabled (e.g., during drag), just render children
  if (disabled) {
    return <>{children}</>;
  }

  // Dynamic transitions from crm_settings
  const validTransitions = getValidTransitions(lead.status);
  const isConverted = lead.status === "converted";
  const isQualified = lead.status === "qualified";

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* PRIMARY ACTIONS - Most frequent */}
        <ContextMenuItem onClick={onView}>
          <Eye className="mr-2 h-4 w-4" />
          {t("leads.context_menu.view")}
        </ContextMenuItem>

        <ContextMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          {t("leads.context_menu.edit")}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* COMMUNICATION ACTIONS - Disabled if no contact info */}
        <ContextMenuItem disabled={!lead.phone} asChild={!!lead.phone}>
          {lead.phone ? (
            <a href={`tel:${lead.phone}`}>
              <Phone className="mr-2 h-4 w-4" />
              {t("leads.context_menu.call")}
            </a>
          ) : (
            <span>
              <Phone className="mr-2 h-4 w-4" />
              {t("leads.context_menu.call")}
            </span>
          )}
        </ContextMenuItem>

        <ContextMenuItem disabled={!lead.email} asChild={!!lead.email}>
          {lead.email ? (
            <a href={`mailto:${lead.email}`}>
              <Mail className="mr-2 h-4 w-4" />
              {t("leads.context_menu.email")}
            </a>
          ) : (
            <span>
              <Mail className="mr-2 h-4 w-4" />
              {t("leads.context_menu.email")}
            </span>
          )}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* WORKFLOW ACTIONS — filtered by transitions_to */}
        {validTransitions.length > 0 && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("leads.context_menu.change_status")}
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {validTransitions.map((statusConfig) => {
                const config = getStatusConfig(statusConfig.value);
                return (
                  <ContextMenuItem
                    key={statusConfig.value}
                    onClick={() => onStatusChange?.(statusConfig.value)}
                  >
                    <span
                      className={`mr-2 h-2 w-2 rounded-full ${config.bg}`}
                    />
                    {getLabel(statusConfig.value, locale)}
                  </ContextMenuItem>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}

        {/* Convert — only for qualified leads */}
        {isQualified && (
          <ContextMenuItem onClick={onConvert}>
            <ArrowRightCircle className="mr-2 h-4 w-4" />
            {t("leads.context_menu.convert")}
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* DESTRUCTIVE ACTIONS — hidden for converted */}
        {!isConverted && (
          <ContextMenuItem
            onClick={onDisqualify}
            className="text-orange-600 focus:text-orange-600"
          >
            <Ban className="mr-2 h-4 w-4" />
            {t("leads.context_menu.disqualify")}
          </ContextMenuItem>
        )}
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash className="mr-2 h-4 w-4" />
          {t("leads.context_menu.delete")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
