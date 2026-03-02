"use client";

import * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";
import { useDroppable } from "@dnd-kit/core";

import {
  Kanban,
  Board as KanbanBoard,
  Column as KanbanColumn,
  Overlay as KanbanOverlay,
} from "@/components/ui/kanban";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import { getStatusConfig } from "@/lib/config/pipeline-status";
import { cn } from "@/lib/utils";
import type { Lead } from "../types/lead.types";
import { LeadsKanbanCard } from "./leads-kanban-card";

// ── Props ───────────────────────────────────────────────────────────

interface LeadsKanbanBoardProps {
  columns: Record<string, Lead[]>;
  columnOrder: string[];
  outcomeCounts: Record<string, number>;
  isLoading: boolean;
  onColumnsChange: (columns: Record<string, Lead[]>) => void;
  onView?: (leadId: string) => void;
  onEdit?: (leadId: string) => void;
  onOutcomeClick?: (status: string) => void;
}

// ── Component ───────────────────────────────────────────────────────

export function LeadsKanbanBoardComponent({
  columns,
  columnOrder,
  outcomeCounts,
  isLoading,
  onColumnsChange,
  onView,
  onEdit,
  onOutcomeClick,
}: LeadsKanbanBoardProps) {
  const { t } = useTranslation("crm");
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const { getLabel } = useLeadStatuses();

  if (isLoading) {
    return <KanbanSkeleton />;
  }

  return (
    <Kanban
      value={columns}
      onValueChange={onColumnsChange}
      getItemValue={(lead: Lead) => lead.id}
    >
      <KanbanBoard className="flex w-full gap-2 pb-4">
        {columnOrder.map((status) => {
          const leads = columns[status] ?? [];

          return (
            <KanbanColumn
              key={status}
              value={status}
              className="bg-muted flex-1 p-1.5"
              disabled
            >
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-md px-3 py-1.5",
                  getStatusConfig(status).bgMedium
                )}
              >
                <span className="text-foreground text-sm font-semibold">
                  {getLabel(status, locale)}
                </span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs leading-none font-bold",
                    leads.length > 0
                      ? cn(getStatusConfig(status).bg, "text-white")
                      : "bg-foreground/10 text-foreground/50"
                  )}
                >
                  {leads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2">
                {leads.map((lead) => (
                  <LeadsKanbanCard
                    key={lead.id}
                    lead={lead}
                    onView={onView}
                    onEdit={onEdit}
                  />
                ))}
                {leads.length === 0 && (
                  <div className="text-muted-foreground flex flex-col justify-center gap-4 pt-4 text-center text-sm">
                    {t("leads.kanban.empty_column")}
                  </div>
                )}
              </div>
            </KanbanColumn>
          );
        })}
      </KanbanBoard>

      {/* Outcomes bar — droppable targets styled as compact badges */}
      <OutcomesBar
        counts={outcomeCounts}
        locale={locale}
        onClick={onOutcomeClick}
      />

      <KanbanOverlay>
        {({ variant }) =>
          variant === "item" ? (
            <div className="bg-primary/10 h-20 w-48 rounded-md" />
          ) : null
        }
      </KanbanOverlay>
    </Kanban>
  );
}

// ── Droppable outcome button ────────────────────────────────────────

const OUTCOME_CONFIGS = [
  { status: "nurturing" },
  { status: "disqualified" },
] as const;

interface DroppableOutcomeButtonProps {
  status: string;
  count: number;
  locale: string;
  onClick?: (status: string) => void;
}

function DroppableOutcomeButton({
  status,
  count,
  locale,
  onClick,
}: DroppableOutcomeButtonProps) {
  const { getLabel } = useLeadStatuses();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = getStatusConfig(status);

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onClick?.(status)}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
        count > 0
          ? cn("cursor-pointer hover:opacity-80", config.bgSubtle, config.text)
          : cn(
              "cursor-pointer border border-dashed",
              config.borderSubtle,
              config.text,
              "opacity-60"
            ),
        isOver && "opacity-100 ring-2 ring-offset-1"
      )}
    >
      <span>{getLabel(status, locale)}</span>
      {count > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] leading-none font-bold",
            config.bgMedium
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ── Outcomes bar ────────────────────────────────────────────────────

interface OutcomesBarProps {
  counts: Record<string, number>;
  locale: string;
  onClick?: (status: string) => void;
}

function OutcomesBar({ counts, locale, onClick }: OutcomesBarProps) {
  return (
    <div className="flex items-center gap-3 px-1 pt-1">
      {OUTCOME_CONFIGS.map(({ status }) => (
        <DroppableOutcomeButton
          key={status}
          status={status}
          count={counts[status] ?? 0}
          locale={locale}
          onClick={onClick}
        />
      ))}
    </div>
  );
}

// ── Loading skeleton ────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex gap-2 pb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="bg-muted/40 flex flex-1 flex-col gap-2 rounded-lg p-1.5"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-6" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <Skeleton key={j} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-1">
        <Skeleton className="h-7 w-28 rounded-md" />
        <Skeleton className="h-7 w-32 rounded-md" />
      </div>
    </div>
  );
}
