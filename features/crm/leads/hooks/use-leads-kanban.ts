"use client";

import { useList, type CrudFilter } from "@refinedev/core";
import { useQueryStates } from "nuqs";
import * as React from "react";
import { toast } from "sonner";

import { useLeadStatuses } from "@/lib/hooks/useLeadStatuses";
import type { Lead } from "../types/lead.types";
import { SIDEBAR_FILTER_PARSERS } from "./use-leads-table";

// ── Kanban column order (V7: 3 active columns) ────────────────────────

const KANBAN_STATUSES = [
  "email_verified",
  "callback_requested",
  "qualified",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

// ── Outcome statuses (shown as counts below the board) ─────────────────

const OUTCOME_STATUSES = ["nurturing", "disqualified"] as const;

/** All statuses fetched by the kanban query (columns + outcomes) */
const ALL_KANBAN_STATUSES = [...KANBAN_STATUSES, ...OUTCOME_STATUSES] as const;

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

export interface PendingTransition {
  leadId: string;
  lead: Lead;
  fromStatus: string;
  toStatus: string;
}

export function useLeadsKanban() {
  const { canTransitionTo, getLabel } = useLeadStatuses();

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
      "fleet_size",
      "source",
      "country_code",
      "created_at",
      "updated_at",
      "next_action_date",
      "priority",
      // BANT fields — needed for drawer to show BANT immediately
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

  const columns = React.useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const status of KANBAN_STATUSES) {
      grouped[status] = [];
    }
    for (const lead of leads) {
      const status = lead.status;
      if (status in grouped) {
        grouped[status].push(lead);
      }
    }
    return grouped;
  }, [leads]);

  // ── Outcome counts (nurturing / disqualified) ────────────────────

  const outcomeCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const status of OUTCOME_STATUSES) {
      counts[status] = 0;
    }
    for (const lead of leads) {
      if (lead.status in counts) {
        counts[lead.status]++;
      }
    }
    return counts;
  }, [leads]);

  // ── Local optimistic state ─────────────────────────────────────────

  const [optimisticColumns, setOptimisticColumns] =
    React.useState<Record<string, Lead[]>>(columns);

  // Sync optimistic state when server data changes
  React.useEffect(() => {
    setOptimisticColumns(columns);
  }, [columns]);

  // ── Transition modal state ─────────────────────────────────────────

  const [pendingTransition, setPendingTransition] =
    React.useState<PendingTransition | null>(null);

  // ── Validate and handle column change from DnD ─────────────────────

  const handleColumnsChange = React.useCallback(
    (newColumns: Record<string, Lead[]>) => {
      // Find which lead moved and to which column
      for (const status of KANBAN_STATUSES) {
        const oldLeads = optimisticColumns[status] ?? [];
        const newLeads = newColumns[status] ?? [];

        // Find lead that appeared in this column
        for (const lead of newLeads) {
          const wasHere = oldLeads.some((l) => l.id === lead.id);
          if (!wasHere) {
            // This lead was moved TO this column
            const fromStatus = lead.status;
            const toStatus = status;

            if (fromStatus === toStatus) {
              // Same column reorder — allow
              setOptimisticColumns(newColumns);
              return;
            }

            // Validate transition
            if (!canTransitionTo(fromStatus, toStatus)) {
              const fromLabel = getLabel(fromStatus);
              const toLabel = getLabel(toStatus);
              toast.error(`Cannot move from ${fromLabel} to ${toLabel}`);
              return;
            }

            // Valid transition — update visual immediately, open modal
            setOptimisticColumns(newColumns);
            setPendingTransition({
              leadId: lead.id,
              lead,
              fromStatus,
              toStatus,
            });
            return;
          }
        }
      }

      // Fallback: same-column reorder
      setOptimisticColumns(newColumns);
    },
    [optimisticColumns, canTransitionTo, getLabel]
  );

  // ── Cancel transition (revert to server state) ─────────────────────

  const cancelTransition = React.useCallback(() => {
    setPendingTransition(null);
    setOptimisticColumns(columns);
  }, [columns]);

  // ── Confirm transition (called after modal submission) ─────────────

  const confirmTransition = React.useCallback(() => {
    setPendingTransition(null);
    // Refine will refetch and update columns automatically
  }, []);

  return {
    columns: optimisticColumns,
    columnOrder: [...KANBAN_STATUSES],
    outcomeCounts,
    isLoading: query.isLoading,
    total: leads.length,
    handleColumnsChange,
    pendingTransition,
    cancelTransition,
    confirmTransition,
  };
}
