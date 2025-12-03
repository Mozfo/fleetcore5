/**
 * KanbanCard - Card lead style Linear (dense, hover premium)
 * Affiche: company, contact, score, fleet, priority, owner, time
 * Draggable via @dnd-kit pour D&D entre colonnes
 *
 * Integration dnd-kit + framer-motion selon le pattern officiel:
 * @see https://github.com/clauderic/dnd-kit/blob/master/stories/2%20-%20Presets/Sortable/FramerMotion.tsx
 * @see https://github.com/clauderic/dnd-kit/issues/969
 *
 * Uses dynamic lead stages from crm_settings via useLeadStages hook.
 */

"use client";

import { useRef, useCallback, memo } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import {
  Building2,
  Car,
  User,
  Phone,
  Mail,
  Eye,
  MoreHorizontal,
  Pencil,
  ArrowRightCircle,
  Trash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProgressBar } from "@/components/ui/progress-bar";
import { useTranslation } from "react-i18next";
import { useDraggable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useLeadStages } from "@/lib/hooks/useLeadStages";
import type { Lead, LeadStatus } from "@/types/crm";
import { LeadContextMenu } from "./LeadContextMenu";

interface KanbanCardProps {
  lead: Lead;
  onClick?: () => void;
  onDoubleClick?: () => void; // Navigate to full page
  isDragging?: boolean; // Pour DragOverlay - card en cours de drag
  onView?: (leadId: string) => void; // Navigate to detail
  onEdit?: (leadId: string) => void; // Open edit modal (TODO)
  onConvert?: (leadId: string) => void; // Convert to opportunity (TODO)
  onDelete?: (leadId: string) => void; // Delete with confirmation (TODO)
  onStatusChange?: (leadId: string, status: LeadStatus) => void; // Change status
}

/**
 * Retourne les initiales d'un nom complet
 */
function getInitials(assigned: {
  first_name: string;
  last_name: string | null;
}) {
  const first = assigned.first_name?.[0]?.toUpperCase() || "";
  const last = assigned.last_name?.[0]?.toUpperCase() || "";
  return `${first}${last}`;
}

/**
 * Formate le temps relatif (ex: "2h ago")
 */
function formatTimeAgo(
  isoDate: string,
  t: ReturnType<typeof useTranslation<"crm">>["t"]
): string {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return t("leads.time.just_now");
  if (seconds < 3600)
    return t("leads.time.minutes_ago", { count: Math.floor(seconds / 60) });
  if (seconds < 86400)
    return t("leads.time.hours_ago", { count: Math.floor(seconds / 3600) });
  if (seconds < 604800)
    return t("leads.time.days_ago", { count: Math.floor(seconds / 86400) });
  return t("leads.time.weeks_ago", { count: Math.floor(seconds / 604800) });
}

/**
 * Retourne la variante Badge pour la priority
 */
function getPriorityVariant(
  priority: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "secondary";
  return "outline";
}

export const KanbanCard = memo(
  function KanbanCard({
    lead,
    onClick,
    onDoubleClick,
    isDragging,
    onView,
    onEdit,
    onConvert,
    onDelete,
    onStatusChange,
  }: KanbanCardProps) {
    const { t } = useTranslation("crm");
    const params = useParams();
    const locale = (params.locale as string) || "en";

    // Load stages dynamically from crm_settings
    const { getLabel: getStageLabel } = useLeadStages();

    // Click delay mechanism to distinguish single click from double click
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const CLICK_DELAY = 250; // ms to wait before confirming single click

    // Handle click with delay - waits to see if double click follows
    const handleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
      clickTimeoutRef.current = setTimeout(() => {
        onClick?.();
        clickTimeoutRef.current = null;
      }, CLICK_DELAY);
    }, [onClick]);

    // Handle double click - cancels pending single click
    const handleDoubleClick = useCallback(() => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
        clickTimeoutRef.current = null;
      }
      onDoubleClick?.();
    }, [onDoubleClick]);

    // Hook dnd-kit pour rendre la card draggable
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      isDragging: isBeingDragged,
    } = useDraggable({
      id: lead.id,
    });

    // Determine si on affiche l'état dragging (soit via prop isDragging, soit via hook)
    const showDraggingState = isDragging || isBeingDragged;

    return (
      <LeadContextMenu
        lead={lead}
        onView={() => onView?.(lead.id)}
        onEdit={() => onEdit?.(lead.id)}
        onStatusChange={(status) => onStatusChange?.(lead.id, status)}
        onConvert={() => onConvert?.(lead.id)}
        onDelete={() => onDelete?.(lead.id)}
        disabled={showDraggingState}
      >
        <motion.div
          ref={setNodeRef}
          // Pattern officiel dnd-kit + framer-motion: utiliser animate au lieu de style.transform
          // @see https://github.com/clauderic/dnd-kit/blob/master/stories/2%20-%20Presets/Sortable/FramerMotion.tsx
          animate={
            transform
              ? {
                  x: transform.x,
                  y: transform.y,
                  scale: showDraggingState ? 1.02 : 1,
                  zIndex: showDraggingState ? 50 : 0,
                }
              : { x: 0, y: 0, scale: 1, zIndex: 0 }
          }
          transition={{
            // Duration 0 pendant le drag pour un suivi immédiat du curseur
            duration: showDraggingState ? 0 : 0.2,
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          // touch-action: none est OBLIGATOIRE selon la doc officielle dnd-kit
          // @see https://docs.dndkit.com/api-documentation/draggable
          style={{ touchAction: "none" }}
          {...attributes}
          {...listeners}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          className={cn(
            "group cursor-grab space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900",
            "relative overflow-hidden",
            "before:absolute before:inset-0",
            "before:bg-gradient-to-br before:from-blue-50/50 before:to-transparent",
            "before:opacity-0 before:transition-opacity",
            "hover:before:opacity-100",
            "dark:before:from-blue-900/20",
            // États drag & drop
            showDraggingState &&
              "cursor-grabbing opacity-60 shadow-2xl ring-2 ring-blue-500"
          )}
        >
          {/* Hover Action Bar */}
          <div
            className="bg-background/95 absolute top-2 right-2 z-20 flex gap-1 rounded-md border p-1 opacity-0 shadow-sm backdrop-blur transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Call - conditional */}
            {lead.phone && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={`tel:${lead.phone}`} title="Call">
                  <Phone className="h-4 w-4" />
                </a>
              </Button>
            )}

            {/* Email */}
            {lead.email && (
              <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                <a href={`mailto:${lead.email}`} title="Email">
                  <Mail className="h-4 w-4" />
                </a>
              </Button>
            )}

            {/* View */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onView?.(lead.id);
              }}
              title="View details"
            >
              <Eye className="h-4 w-4" />
            </Button>

            {/* More Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(lead.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConvert?.(lead.id)}>
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  Convert to Opportunity
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete?.(lead.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Header: Company + Flag + Stage */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
              <span className="truncate text-sm font-medium">
                {lead.company_name || "Unknown Company"}
              </span>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              {lead.country?.flag_emoji && (
                <span className="text-lg" title={lead.country.country_name_en}>
                  {lead.country.flag_emoji}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {lead.lead_stage
                  ? getStageLabel(lead.lead_stage, locale)
                  : t("leads.card.stage.indetermined")}
              </Badge>
            </div>
          </div>

          {/* Contact Name (secondary) */}
          <p className="relative z-10 text-sm text-gray-600 dark:text-gray-400">
            {lead.first_name} {lead.last_name}
          </p>

          {/* Progress Bar - Qualification Score */}
          {lead.qualification_score !== null && (
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{t("leads.card.score")}</span>
                <span className="font-medium">
                  {lead.qualification_score}/100
                </span>
              </div>
              <ProgressBar value={lead.qualification_score} max={100} />
            </div>
          )}

          {/* Fleet Size + Priority */}
          <div className="relative z-10 flex items-center gap-3 text-xs text-gray-500">
            {lead.fleet_size && (
              <div className="flex items-center gap-1">
                <Car className="h-3 w-3" />
                <span>
                  {lead.fleet_size} {t("leads.card.vehicles")}
                </span>
              </div>
            )}
            {lead.priority && (
              <Badge
                variant={getPriorityVariant(lead.priority)}
                className="text-xs"
              >
                {t(`leads.card.priority.${lead.priority}`)}
              </Badge>
            )}
          </div>

          {/* Footer: Owner + Time + Action */}
          <div className="relative z-10 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-800">
            <div className="flex items-center gap-2">
              {lead.assigned_to ? (
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white"
                  title={`${lead.assigned_to.first_name} ${lead.assigned_to.last_name}`}
                >
                  {getInitials(lead.assigned_to)}
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-800">
                  <User className="h-3 w-3 text-gray-400" />
                </div>
              )}
              <span className="text-xs text-gray-500">
                {formatTimeAgo(lead.created_at, t)}
              </span>
            </div>
          </div>
        </motion.div>
      </LeadContextMenu>
    );
  },
  (prevProps, nextProps) => {
    // Comparaison intelligente: re-render uniquement si les données critiques changent
    return (
      prevProps.lead.id === nextProps.lead.id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.updated_at === nextProps.lead.updated_at &&
      prevProps.lead.qualification_score ===
        nextProps.lead.qualification_score &&
      prevProps.lead.assigned_to?.id === nextProps.lead.assigned_to?.id &&
      prevProps.isDragging === nextProps.isDragging
    );
  }
);
