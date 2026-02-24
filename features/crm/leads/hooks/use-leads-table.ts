"use client";

import { useList, type CrudFilter, type CrudSort } from "@refinedev/core";
import type { ColumnDef, VisibilityState } from "@tanstack/react-table";
import {
  type Parser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryState,
  useQueryStates,
} from "nuqs";
import * as React from "react";

import { useDataTable } from "@/hooks/use-data-table";
import { getSortingStateParser } from "@/lib/parsers";
import type { Lead } from "../types/lead.types";

/** Columns hidden by default — only the 22 CEO-selected columns are visible. */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  id: false,
  industry: false,
  company_size: false,
  linkedin_url: false,
  source: false,
  source_id: false,
  utm_source: false,
  utm_medium: false,
  utm_campaign: false,
  message: false,
  qualification_notes: false,
  scoring: false,
  fit_score: false,
  engagement_score: false,
  qualification_score: false,
  consent_at: false,
  consent_ip: false,
  updated_at: false,
  qualified_date: false,
  converted_date: false,
  next_action_date: false,
  opportunity_id: false,
  metadata: false,
  stripe_checkout_session_id: false,
  stripe_payment_link_url: false,
  payment_link_created_at: false,
  payment_link_expires_at: false,
  deleted_at: false,
  deleted_by: false,
  deletion_reason: false,
  created_by: false,
  last_activity_at: false,
  stage_entered_at: false,
  loss_reason_code: false,
  loss_reason_detail: false,
  competitor_name: false,
  booking_confirmed_at: false,
  booking_calcom_uid: false,
  platforms_used: false,
  tenant_id: false,
  converted_at: false,
  email_verified: false,
  email_verification_code: false,
  email_verification_expires_at: false,
  email_verification_attempts: false,
  confirmation_token: false,
  attendance_confirmed: false,
  attendance_confirmed_at: false,
  j1_reminder_sent_at: false,
  reschedule_token: false,
  detected_country_code: false,
  ip_address: false,
  language: false,
  callback_completed_at: false,
  callback_notes: false,
  disqualified_at: false,
  disqualification_reason: false,
  disqualification_comment: false,
  disqualified_by: false,
  recovery_notification_sent_at: false,
  recovery_notification_clicked_at: false,
};

// ── Sidebar filter parsers (shared with sidebar component) ───────────────

/**
 * nuqs parsers for sidebar-only filters.
 * These are READ by the hook (for Refine data-fetching) and
 * READ+WRITTEN by the sidebar component (for UI).
 * nuqs deduplicates across multiple useQueryStates calls.
 */
export const SIDEBAR_FILTER_PARSERS = {
  // Multi-select (CSV → Prisma IN)
  lead_stage: parseAsArrayOf(parseAsString, ","),
  source: parseAsArrayOf(parseAsString, ","),
  fleet_size: parseAsArrayOf(parseAsString, ","),
  language: parseAsArrayOf(parseAsString, ","),
  industry: parseAsArrayOf(parseAsString, ","),
  country_code: parseAsArrayOf(parseAsString, ","),
  loss_reason_code: parseAsArrayOf(parseAsString, ","),
  disqualification_reason: parseAsArrayOf(parseAsString, ","),
  platforms_used: parseAsArrayOf(parseAsString, ","),
  // Range (min/max → Prisma gte/lte)
  min_qualification_score: parseAsInteger,
  max_qualification_score: parseAsInteger,
  min_fit_score: parseAsInteger,
  max_fit_score: parseAsInteger,
  min_engagement_score: parseAsInteger,
  max_engagement_score: parseAsInteger,
  // Date range (ISO strings → Prisma gte/lte)
  min_last_activity_at: parseAsString,
  max_last_activity_at: parseAsString,
  min_created_at: parseAsString,
  max_created_at: parseAsString,
  min_next_action_date: parseAsString,
  max_next_action_date: parseAsString,
  min_booking_slot_at: parseAsString,
  max_booking_slot_at: parseAsString,
  // Boolean (string "true"/"false" → Prisma eq)
  email_verified: parseAsString,
  callback_requested: parseAsString,
  gdpr_consent: parseAsString,
  attendance_confirmed: parseAsString,
  wizard_completed: parseAsString,
} as const;

export type SidebarFilterValues = {
  [K in keyof typeof SIDEBAR_FILTER_PARSERS]: ReturnType<
    (typeof SIDEBAR_FILTER_PARSERS)[K]["parseServerSide"]
  >;
};

/**
 * Convert sidebar filter values (from nuqs) into CrudFilter[] for Refine.
 * Uses the same operator conventions as refine-mappers.ts.
 */
function sidebarToCrudFilters(
  values: Record<string, string | string[] | number | null>
): CrudFilter[] {
  const filters: CrudFilter[] = [];

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined) continue;

    // Multi-select arrays → "in" operator
    if (Array.isArray(value) && value.length > 0) {
      filters.push({ field: key, operator: "in", value });
      continue;
    }

    // Range params: min_X → { field: X, operator: gte }
    if (key.startsWith("min_")) {
      const field = key.slice(4); // strip "min_"
      if (typeof value === "number") {
        filters.push({ field, operator: "gte", value });
      } else if (typeof value === "string" && value) {
        filters.push({ field, operator: "gte", value });
      }
      continue;
    }

    // Range params: max_X → { field: X, operator: lte }
    if (key.startsWith("max_")) {
      const field = key.slice(4); // strip "max_"
      if (typeof value === "number") {
        filters.push({ field, operator: "lte", value });
      } else if (typeof value === "string" && value) {
        filters.push({ field, operator: "lte", value });
      }
      continue;
    }

    // Boolean string → "eq" operator
    if (value === "true" || value === "false") {
      filters.push({ field: key, operator: "eq", value });
      continue;
    }
  }

  return filters;
}

// ── Hook ─────────────────────────────────────────────────────────────────

interface UseLeadsTableProps {
  columns: ColumnDef<Lead>[];
  initialPageSize?: number;
  savedColumnVisibility?: VisibilityState;
}

/**
 * Bridge hook: Refine useList (data fetching) + Kiranism useDataTable (UI state).
 *
 * Flow: URL state (nuqs) → Refine params → API fetch → data + pageCount → DataTable.
 * Both useList params and useDataTable read from the same nuqs URL state (safe dedup).
 */
export function useLeadsTable({
  columns,
  initialPageSize = 20,
  savedColumnVisibility,
}: UseLeadsTableProps) {
  // ── Read URL state for Refine data fetching ───────────────────────────
  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [perPage] = useQueryState(
    "perPage",
    parseAsInteger.withDefault(initialPageSize)
  );
  const columnIds = React.useMemo(
    () => new Set(columns.map((c) => c.id).filter(Boolean) as string[]),
    [columns]
  );
  const [sorting] = useQueryState(
    "sort",
    getSortingStateParser<Lead>(columnIds).withDefault([])
  );

  const sorters = React.useMemo<CrudSort[]>(
    () => sorting.map((s) => ({ field: s.id, order: s.desc ? "desc" : "asc" })),
    [sorting]
  );

  // ── Column filters (toolbar: status, priority, company_name) ──────────
  const columnFilterParsers = React.useMemo(() => {
    return columns
      .filter((c) => c.enableColumnFilter)
      .reduce<Record<string, Parser<string> | Parser<string[]>>>((acc, col) => {
        acc[col.id ?? ""] = col.meta?.options
          ? parseAsArrayOf(parseAsString, ",")
          : parseAsString;
        return acc;
      }, {});
  }, [columns]);

  const [columnFilterValues] = useQueryStates(columnFilterParsers);

  const columnFilters = React.useMemo<CrudFilter[]>(() => {
    return Object.entries(columnFilterValues).reduce<CrudFilter[]>(
      (acc, [key, value]) => {
        if (value === null || value === undefined) return acc;
        if (Array.isArray(value) && value.length > 0) {
          acc.push({ field: key, operator: "in", value });
        } else if (typeof value === "string" && value) {
          acc.push({ field: key, operator: "contains", value });
        }
        return acc;
      },
      []
    );
  }, [columnFilterValues]);

  // ── Sidebar filters (all additional filter categories) ────────────────
  const [sidebarValues] = useQueryStates(SIDEBAR_FILTER_PARSERS);

  const sidebarFilters = React.useMemo<CrudFilter[]>(
    () => sidebarToCrudFilters(sidebarValues),
    [sidebarValues]
  );

  // ── Merge all filters ─────────────────────────────────────────────────
  const filters = React.useMemo<CrudFilter[]>(
    () => [...columnFilters, ...sidebarFilters],
    [columnFilters, sidebarFilters]
  );

  // ── Refine data fetching ──────────────────────────────────────────────
  const { query, result } = useList<Lead>({
    resource: "leads",
    pagination: { currentPage: page, pageSize: perPage },
    sorters,
    filters,
  });

  const data = result.data;
  const total = result.total ?? 0;
  const pageCount = Math.ceil(total / perPage);

  // ── Kiranism DataTable (reads same URL state — nuqs deduplicates) ─────
  const { table } = useDataTable({
    data,
    columns,
    pageCount,
    shallow: true,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
      columnVisibility: savedColumnVisibility ?? DEFAULT_COLUMN_VISIBILITY,
    },
  });

  return { table, isLoading: query.isLoading, isError: query.isError, total };
}
