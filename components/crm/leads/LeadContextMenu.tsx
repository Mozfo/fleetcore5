"use client";

/**
 * LeadContextMenu - Right-click context menu for lead rows/cards
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
  Phone,
  Mail,
  RefreshCw,
  ArrowRightCircle,
  Ban,
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
import type { Lead, LeadStatus } from "@/types/crm";

// V6.3: 8 statuts
const STATUS_OPTIONS: { value: LeadStatus; colorClass: string }[] = [
  { value: "new", colorClass: "bg-gray-500" },
  { value: "demo", colorClass: "bg-blue-500" },
  { value: "proposal_sent", colorClass: "bg-orange-500" },
  { value: "payment_pending", colorClass: "bg-amber-500" },
  { value: "converted", colorClass: "bg-green-500" },
  { value: "lost", colorClass: "bg-red-500" },
  { value: "nurturing", colorClass: "bg-purple-500" },
  { value: "disqualified", colorClass: "bg-gray-400" },
];

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

  // If disabled (e.g., during drag), just render children
  if (disabled) {
    return <>{children}</>;
  }

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

        {/* WORKFLOW ACTIONS */}
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t("leads.context_menu.change_status")}
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            {STATUS_OPTIONS.map((option) => (
              <ContextMenuItem
                key={option.value}
                onClick={() => onStatusChange?.(option.value)}
                className={lead.status === option.value ? "bg-accent" : ""}
              >
                <span
                  className={`mr-2 h-2 w-2 rounded-full ${option.colorClass}`}
                />
                {t(`leads.columns.${option.value}`)}
                {lead.status === option.value && (
                  <span className="ml-auto text-xs opacity-60">
                    {t("leads.context_menu.current")}
                  </span>
                )}
              </ContextMenuItem>
            ))}
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuItem onClick={onConvert}>
          <ArrowRightCircle className="mr-2 h-4 w-4" />
          {t("leads.context_menu.convert")}
        </ContextMenuItem>

        <ContextMenuSeparator />

        {/* DESTRUCTIVE ACTIONS */}
        <ContextMenuItem
          onClick={onDisqualify}
          className="text-orange-600 focus:text-orange-600"
        >
          <Ban className="mr-2 h-4 w-4" />
          {t("leads.context_menu.disqualify")}
        </ContextMenuItem>
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
