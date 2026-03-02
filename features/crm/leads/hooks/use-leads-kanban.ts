"use client";

import { useList, type CrudFilter } from "@refinedev/core";
import { useQueryStates } from "nuqs";
import * as React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { Lead } from "../types/lead.types";
import { SIDEBAR_FILTER_PARSERS } from "./use-leads-table";

// ── Kanban column order (V7: 3 active columns) ────────────────────────

const KANBAN_STATUSES = [
  "email_verified",
  "callback_requested",
  "qualified",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

// ── Outcome statuses (drop zones below the board) ─────────────────────

const OUTCOME_STATUSES = ["nurturing", "disqualified"] as const;

/** All statuses fetched by the kanban query (columns + outcomes) */
const ALL_KANBAN_STATUSES = [...KANBAN_STATUSES, ...OUTCOME_STATUSES] as const;

// ── Drag routing ──────────────────────────────────────────────────────

export type DragType =
  | "complete_profile"
  | "qualify"
  | "nurturing"
  | "disqualify";

export interface PendingDrag {
  type: DragType;
  lead: Lead;
  fromStatus: string;
  toStatus: string;
}

/**
 * Allowed drag transitions — more restrictive than the workflow's transitions_to.
 * Drags not listed here are rejected with a toast.
 */
const DRAG_ROUTES: Record<string, DragType> = {
  "email_verified→callback_requested": "complete_profile",
  "callback_requested→qualified": "qualify",
  "callback_requested→nurturing": "nurturing",
  "callback_requested→disqualified": "disqualify",
  "qualified→nurturing": "nurturing",
  "qualified→disqualified": "disqualify",
  "email_verified→disqualified": "disqualify",
};

// ── Sidebar → CrudFilter conversion (same logic as use-leads-table) ────

function sidebarToCrudFilters(
  values: Record<string, string | string[] | number | null>
): CrudFilter[] {
  const filters: CrudFilter[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;

    if (Array.isArray(value) && value.length > 0) {
      filters.push({ field: key, operator: "in", value });
      continue;
    }

    if (key.startsWith("min_")) {
      const field = key.slice(4);
      if (typeof value === "number" || (typeof value === "string" && value)) {
        filters.push({ field, operator: "gte", value });
      }
      continue;
    }

    if (key.startsWith("max_")) {
      const field = key.slice(4);
      if (typeof value === "number" || (typeof value === "string" && value)) {
        filters.push({ field, operator: "lte", value });
      }
      continue;
    }

    if (value === "true" || value === "false") {
      filters.push({ field: key, operator: "eq", value });
      continue;
    }
  }

  return filters;
}

// ── Hook ───────────────────────────────────────────────────────────────

/** @deprecated Use PendingDrag instead */
export type PendingTransition = PendingDrag;

export function useLeadsKanban() {
  const { t } = useTranslation("crm");

  // Read sidebar filters from URL (shared with table view via nuqs)
  const [sidebarValues] = useQueryStates(SIDEBAR_FILTER_PARSERS);
  const sidebarFilters = React.useMemo<CrudFilter[]>(
    () => sidebarToCrudFilters(sidebarValues),
    [sidebarValues]
  );

  // Fetch leads in kanban columns + outcome statuses (for counts)
  const statusFilter: CrudFilter = React.useMemo(
    () => ({
      field: "status",
      operator: "in" as const,
      value: [...ALL_KANBAN_STATUSES],
    }),
    []
  );

  const filters = React.useMemo<CrudFilter[]>(
    () => [statusFilter, ...sidebarFilters],
    [statusFilter, sidebarFilters]
  );

  // Kanban card fields — only what the card component renders.
  // Reduces API payload from ~90 columns to ~15 per lead.
  const kanbanFields = React.useMemo(
    () => [
      "id",
      "lead_code",
      "status",
      "company_name",
      "first_name",
      "last_name",
      "email",
      "phone",
      "fleet_size",
      "source",
      "country_code",
      "created_at",
      "updated_at",
      "next_action_date",
      "priority",
      // BANT fields — needed for drawer + qualify drag dialog
      "bant_budget",
      "bant_authority",
      "bant_need",
      "bant_timeline",
      "bant_qualified_at",
      "bant_qualified_by",
    ],
    []
  );

  // Fetch all pipeline leads (no pagination for kanban)
  const { query, result } = useList<Lead>({
    resource: "leads",
    pagination: { mode: "off" },
    filters,
    sorters: [{ field: "created_at", order: "desc" }],
    meta: { select: kanbanFields },
  });

  const leads = React.useMemo(() => result.data ?? [], [result.data]);

  // ── Group leads by status into columns ─────────────────────────────
  // Includes outcome statuses as empty arrays for DnD drop zone support.

  const columns = React.useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const status of KANBAN_STATUSES) grouped[status] = [];
    for (const status of OUTCOME_STATUSES) grouped[status] = [];
    for (const lead of leads) {
      const status = lead.status;
      if (status in grouped) {
        grouped[status].push(lead);
      }
    }
    return grouped;
  }, [leads]);

  // ── Outcome counts (derived from columns) ──────────────────────────

  const outcomeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of OUTCOME_STATUSES) {
      counts[status] = (columns[status] ?? []).length;
    }
    return counts;
  }, [columns]);

  // ── Local optimistic state ─────────────────────────────────────────

  const [optimisticColumns, setOptimisticColumns] =
    React.useState<Record<string, Lead[]>>(columns);

  // Sync optimistic state when server data changes
  React.useEffect(() => {
    setOptimisticColumns(columns);
  }, [columns]);

  // ── Drag modal state ───────────────────────────────────────────────

  const [pendingDrag, setPendingDrag] = React.useState<PendingDrag | null>(
    null
  );

  // ── Validate and handle column change from DnD ─────────────────────

  const handleColumnsChange = React.useCallback(
    (newColumns: Record<string, Lead[]>) => {
      // Guard: if a drag confirmation is pending, ignore further DnD events
      if (pendingDrag) return;

      const ALL = [...KANBAN_STATUSES, ...OUTCOME_STATUSES];
      for (const status of ALL) {
        const oldLeads = optimisticColumns[status] ?? [];
        const newLeads = newColumns[status] ?? [];

        for (const lead of newLeads) {
          if (!oldLeads.some((l) => l.id === lead.id)) {
            const from = lead.status;
            const to = status;

            if (from === to) {
              setOptimisticColumns(newColumns);
              return;
            }

            const routeKey = `${from}→${to}`;
            const dragType = DRAG_ROUTES[routeKey];
            if (!dragType) {
              toast.error(t("leads.kanban.drag.transition_not_allowed"));
              return; // Card reverts visually — optimisticColumns unchanged
            }

            // Do NOT update optimisticColumns — card stays in source column
            setPendingDrag({
              type: dragType,
              lead,
              fromStatus: from,
              toStatus: to,
            });
            return;
          }
        }
      }

      // Fallback: same-column reorder
      setOptimisticColumns(newColumns);
    },
    [optimisticColumns, pendingDrag, t]
  );

  // ── Cancel drag (no rollback needed — optimisticColumns never changed)

  const cancelDrag = React.useCallback(() => {
    setPendingDrag(null);
  }, []);

  // ── Confirm drag (caller already called API — just clear state) ─────

  const confirmDrag = React.useCallback(() => {
    setPendingDrag(null);
  }, []);

  return {
    columns: optimisticColumns,
    columnOrder: [...KANBAN_STATUSES],
    outcomeOrder: [...OUTCOME_STATUSES],
    outcomeCounts,
    isLoading: query.isLoading,
    total: leads.length,
    handleColumnsChange,
    pendingDrag,
    cancelDrag,
    confirmDrag,
  };
}
