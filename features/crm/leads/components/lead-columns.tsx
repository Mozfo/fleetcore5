"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Eye,
  Minus,
  MoreHorizontal,
  Pencil,
  Pin,
  PinOff,
  Trash2,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/table/data-table-column-header";
import type { Option } from "@/types/data-table";
import type { Lead, LeadStatusConfig } from "../types/lead.types";

type TranslationFn = (key: string) => string;

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function formatBoolean(value: unknown): string {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "—";
}

function formatJson(value: unknown): string {
  if (!value) return "—";
  try {
    const s = JSON.stringify(value);
    return s.length > 60 ? s.slice(0, 57) + "..." : s;
  } catch {
    return "—";
  }
}

function truncate(value: unknown, max = 80): string {
  if (!value) return "—";
  const s = String(value);
  return s.length > max ? s.slice(0, max - 3) + "..." : s;
}

// ── Column builder ───────────────────────────────────────────────────────

/**
 * Build lead column definitions for DataTable.
 * Pure function — call via useMemo in consuming component.
 */
export function getLeadColumns(
  t: TranslationFn,
  statuses: LeadStatusConfig[],
  onEdit?: (leadId: string) => void
): ColumnDef<Lead>[] {
  const statusOptions: Option[] = statuses.map((s) => ({
    label: s.label_en,
    value: s.value,
  }));

  return [
    // ── Select ────────────────────────────────────────────────────────
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 40,
    },

    // ── Expander ───────────────────────────────────────────────────────
    {
      id: "expander",
      header: () => null,
      cell: ({ row }) => {
        if (!row.getCanExpand()) return null;
        return (
          <button
            className="flex items-center"
            onClick={row.getToggleExpandedHandler()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </button>
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 30,
    },

    // ── Core identifiers ──────────────────────────────────────────────
    {
      id: "id",
      accessorKey: "id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.id")}
        />
      ),
      meta: { label: t("leads.table.columns.id") },
      size: 100,
    },
    {
      id: "lead_code",
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.client_account")}
        />
      ),
      meta: { label: t("leads.table.columns.client_account") },
      size: 120,
    },

    // ── Contact information ───────────────────────────────────────────
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email")}
        />
      ),
      cell: ({ row }) => {
        const email = row.getValue<string>("email");
        const verified = row.original.email_verified;
        return (
          <div className="flex items-center gap-1.5">
            <span className="truncate">{email ?? "—"}</span>
            {verified === true && (
              <BadgeCheck className="size-4 shrink-0 text-green-600" />
            )}
          </div>
        );
      },
      meta: { label: t("leads.table.columns.email") },
      size: 200,
    },
    {
      id: "first_name",
      accessorKey: "first_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.first_name")}
        />
      ),
      meta: { label: t("leads.table.columns.first_name") },
      size: 120,
    },
    {
      id: "last_name",
      accessorKey: "last_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.last_name")}
        />
      ),
      meta: { label: t("leads.table.columns.last_name") },
      size: 120,
    },
    {
      id: "phone",
      accessorKey: "phone",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.phone")}
        />
      ),
      meta: { label: t("leads.table.columns.phone") },
      size: 140,
    },

    // ── Company information ───────────────────────────────────────────
    {
      id: "company_name",
      accessorKey: "company_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.company")}
        />
      ),
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.company"),
        variant: "text",
        placeholder: t("leads.filters.search"),
      },
      size: 180,
    },
    {
      id: "industry",
      accessorKey: "industry",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.industry")}
        />
      ),
      meta: { label: t("leads.table.columns.industry") },
      size: 140,
    },
    {
      id: "company_size",
      accessorKey: "company_size",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.company_size")}
        />
      ),
      meta: { label: t("leads.table.columns.company_size") },
      size: 80,
    },
    {
      id: "fleet_size",
      accessorKey: "fleet_size",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.fleet_size")}
        />
      ),
      meta: { label: t("leads.table.columns.fleet_size") },
      size: 100,
    },
    {
      id: "current_software",
      accessorKey: "current_software",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.current_software")}
        />
      ),
      meta: {
        label: t("leads.table.columns.current_software"),
        className: "hidden lg:table-cell",
      },
      size: 160,
    },
    {
      id: "website_url",
      accessorKey: "website_url",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.website_url")}
        />
      ),
      meta: {
        label: t("leads.table.columns.website_url"),
        className: "hidden lg:table-cell",
      },
      size: 200,
    },
    {
      id: "linkedin_url",
      accessorKey: "linkedin_url",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.linkedin_url")}
        />
      ),
      meta: { label: t("leads.table.columns.linkedin_url") },
      size: 200,
    },

    // ── Location ──────────────────────────────────────────────────────
    {
      id: "country_code",
      accessorKey: "country_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.country")}
        />
      ),
      cell: ({ row }) => {
        const lead = row.original;
        return `${lead.country?.flag_emoji ?? ""} ${lead.country_code ?? "—"}`;
      },
      meta: {
        label: t("leads.table.columns.country"),
        className: "hidden lg:table-cell",
      },
      size: 100,
    },
    {
      id: "city",
      accessorKey: "city",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.city")}
        />
      ),
      meta: {
        label: t("leads.table.columns.city"),
        className: "hidden lg:table-cell",
      },
      size: 120,
    },

    // ── Status & Stage ────────────────────────────────────────────────
    {
      id: "status",
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.status")}
        />
      ),
      cell: ({ row }) => {
        const value = row.getValue<string>("status");
        const config = statuses.find((s) => s.value === value);
        return (
          <Badge
            variant="outline"
            style={{ borderColor: config?.color, color: config?.color }}
          >
            <span
              className="size-1.5 rounded-full"
              style={{ backgroundColor: config?.color }}
            />
            {config?.label_en ?? value}
          </Badge>
        );
      },
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.status"),
        variant: "multiSelect",
        options: statusOptions,
      },
      size: 120,
    },
    {
      id: "lead_stage",
      accessorKey: "lead_stage",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.stage")}
        />
      ),
      meta: { label: t("leads.table.columns.stage") },
      size: 140,
    },
    {
      id: "priority",
      accessorKey: "priority",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.priority")}
        />
      ),
      enableColumnFilter: true,
      meta: {
        label: t("leads.table.columns.priority"),
        variant: "multiSelect",
        options: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
          { label: "Urgent", value: "urgent" },
        ],
      },
      size: 100,
    },

    // ── Scoring ───────────────────────────────────────────────────────
    {
      id: "fit_score",
      accessorKey: "fit_score",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.fit_score")}
        />
      ),
      meta: { label: t("leads.table.columns.fit_score") },
      size: 80,
    },
    {
      id: "engagement_score",
      accessorKey: "engagement_score",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.engagement")}
        />
      ),
      meta: { label: t("leads.table.columns.engagement") },
      size: 80,
    },
    {
      id: "qualification_score",
      accessorKey: "qualification_score",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.score")}
        />
      ),
      meta: { label: t("leads.table.columns.score") },
      size: 80,
    },
    {
      id: "scoring",
      accessorKey: "scoring",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.scoring")}
        />
      ),
      cell: ({ row }) => formatJson(row.original.scoring),
      meta: { label: t("leads.table.columns.scoring") },
      size: 120,
    },

    // ── Source & Attribution ───────────────────────────────────────────
    {
      id: "source",
      accessorKey: "source",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.source")}
        />
      ),
      meta: { label: t("leads.table.columns.source") },
      size: 120,
    },
    {
      id: "source_id",
      accessorKey: "source_id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.source_id")}
        />
      ),
      meta: { label: t("leads.table.columns.source_id") },
      size: 100,
    },
    {
      id: "utm_source",
      accessorKey: "utm_source",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.utm_source")}
        />
      ),
      meta: { label: t("leads.table.columns.utm_source") },
      size: 120,
    },
    {
      id: "utm_medium",
      accessorKey: "utm_medium",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.utm_medium")}
        />
      ),
      meta: { label: t("leads.table.columns.utm_medium") },
      size: 120,
    },
    {
      id: "utm_campaign",
      accessorKey: "utm_campaign",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.utm_campaign")}
        />
      ),
      meta: { label: t("leads.table.columns.utm_campaign") },
      size: 140,
    },

    // ── Message & Notes ───────────────────────────────────────────────
    {
      id: "message",
      accessorKey: "message",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.message")}
        />
      ),
      cell: ({ row }) => truncate(row.original.message),
      meta: { label: t("leads.table.columns.message") },
      size: 200,
    },
    {
      id: "qualification_notes",
      accessorKey: "qualification_notes",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.qualification_notes")}
        />
      ),
      cell: ({ row }) => truncate(row.original.qualification_notes),
      meta: { label: t("leads.table.columns.qualification_notes") },
      size: 200,
    },

    // ── Assignment ────────────────────────────────────────────────────
    {
      id: "assigned_to",
      accessorFn: (row) =>
        row.assigned_to
          ? [row.assigned_to.first_name, row.assigned_to.last_name]
              .filter(Boolean)
              .join(" ")
          : null,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.assigned")}
        />
      ),
      meta: { label: t("leads.table.columns.assigned") },
      size: 160,
    },

    // ── GDPR ──────────────────────────────────────────────────────────
    {
      id: "gdpr_consent",
      accessorKey: "gdpr_consent",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.gdpr_consent")}
        />
      ),
      cell: ({ row }) => {
        const v = row.original.gdpr_consent;
        if (v === true)
          return <CheckCircle2 className="size-4 text-green-600" />;
        if (v === false) return <XCircle className="size-4 text-red-500" />;
        return <Minus className="text-muted-foreground size-4" />;
      },
      meta: { label: t("leads.table.columns.gdpr_consent") },
      size: 80,
    },
    {
      id: "consent_at",
      accessorKey: "consent_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.consent_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.consent_at),
      meta: { label: t("leads.table.columns.consent_at") },
      size: 150,
    },
    {
      id: "consent_ip",
      accessorKey: "consent_ip",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.consent_ip")}
        />
      ),
      meta: { label: t("leads.table.columns.consent_ip") },
      size: 120,
    },

    // ── Dates ─────────────────────────────────────────────────────────
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.created")}
        />
      ),
      cell: ({ row }) => formatDate(row.getValue<string>("created_at")),
      meta: {
        label: t("leads.table.columns.created"),
        className: "hidden md:table-cell",
      },
      size: 150,
    },
    {
      id: "updated_at",
      accessorKey: "updated_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.updated_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.updated_at),
      meta: { label: t("leads.table.columns.updated_at") },
      size: 150,
    },
    {
      id: "qualified_date",
      accessorKey: "qualified_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.qualified_date")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.qualified_date),
      meta: { label: t("leads.table.columns.qualified_date") },
      size: 150,
    },
    {
      id: "converted_date",
      accessorKey: "converted_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.converted_date")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.converted_date),
      meta: { label: t("leads.table.columns.converted_date") },
      size: 150,
    },
    {
      id: "next_action_date",
      accessorKey: "next_action_date",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.next_action_date")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.next_action_date),
      meta: { label: t("leads.table.columns.next_action_date") },
      size: 150,
    },

    // ── Opportunity link ──────────────────────────────────────────────
    {
      id: "opportunity_id",
      accessorKey: "opportunity_id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.opportunity_id")}
        />
      ),
      meta: { label: t("leads.table.columns.opportunity_id") },
      size: 100,
    },

    // ── Metadata ──────────────────────────────────────────────────────
    {
      id: "metadata",
      accessorKey: "metadata",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.metadata")}
        />
      ),
      cell: ({ row }) => formatJson(row.original.metadata),
      meta: { label: t("leads.table.columns.metadata") },
      size: 120,
    },

    // ── Payment (V6.2.1 Stripe) ──────────────────────────────────────
    {
      id: "stripe_checkout_session_id",
      accessorKey: "stripe_checkout_session_id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.stripe_session")}
        />
      ),
      meta: { label: t("leads.table.columns.stripe_session") },
      size: 180,
    },
    {
      id: "stripe_payment_link_url",
      accessorKey: "stripe_payment_link_url",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.payment_link")}
        />
      ),
      meta: { label: t("leads.table.columns.payment_link") },
      size: 200,
    },
    {
      id: "payment_link_created_at",
      accessorKey: "payment_link_created_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.payment_link_created")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.payment_link_created_at),
      meta: { label: t("leads.table.columns.payment_link_created") },
      size: 150,
    },
    {
      id: "payment_link_expires_at",
      accessorKey: "payment_link_expires_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.payment_link_expires")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.payment_link_expires_at),
      meta: { label: t("leads.table.columns.payment_link_expires") },
      size: 150,
    },

    // ── Audit (soft delete) ───────────────────────────────────────────
    {
      id: "deleted_at",
      accessorKey: "deleted_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.deleted_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.deleted_at),
      meta: { label: t("leads.table.columns.deleted_at") },
      size: 150,
    },
    {
      id: "deleted_by",
      accessorKey: "deleted_by",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.deleted_by")}
        />
      ),
      meta: { label: t("leads.table.columns.deleted_by") },
      size: 100,
    },
    {
      id: "deletion_reason",
      accessorKey: "deletion_reason",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.deletion_reason")}
        />
      ),
      meta: { label: t("leads.table.columns.deletion_reason") },
      size: 180,
    },
    {
      id: "created_by",
      accessorKey: "created_by",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.created_by")}
        />
      ),
      meta: { label: t("leads.table.columns.created_by") },
      size: 100,
    },
    {
      id: "updated_by",
      accessorKey: "updated_by",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.updated_by")}
        />
      ),
      meta: {
        label: t("leads.table.columns.updated_by"),
        className: "hidden md:table-cell",
      },
      size: 100,
    },

    // ── Activity tracking ─────────────────────────────────────────────
    {
      id: "last_activity_at",
      accessorKey: "last_activity_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.last_activity_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.last_activity_at),
      meta: { label: t("leads.table.columns.last_activity_at") },
      size: 150,
    },

    // ── Provider ──────────────────────────────────────────────────────
    {
      id: "provider_id",
      accessorKey: "provider_id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.provider_id")}
        />
      ),
      meta: { label: t("leads.table.columns.provider_id") },
      size: 100,
    },

    // ── Stage tracking (V5: CLOSING) ──────────────────────────────────
    {
      id: "stage_entered_at",
      accessorKey: "stage_entered_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.stage_entered_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.stage_entered_at),
      meta: { label: t("leads.table.columns.stage_entered_at") },
      size: 150,
    },
    {
      id: "loss_reason_code",
      accessorKey: "loss_reason_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.loss_reason_code")}
        />
      ),
      meta: { label: t("leads.table.columns.loss_reason_code") },
      size: 120,
    },
    {
      id: "loss_reason_detail",
      accessorKey: "loss_reason_detail",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.loss_reason_detail")}
        />
      ),
      cell: ({ row }) => truncate(row.original.loss_reason_detail),
      meta: { label: t("leads.table.columns.loss_reason_detail") },
      size: 200,
    },
    {
      id: "competitor_name",
      accessorKey: "competitor_name",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.competitor_name")}
        />
      ),
      meta: { label: t("leads.table.columns.competitor_name") },
      size: 140,
    },

    // ── Booking (V6.2: CAL.COM) ───────────────────────────────────────
    {
      id: "booking_slot_at",
      accessorKey: "booking_slot_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.booking_slot_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.booking_slot_at),
      meta: {
        label: t("leads.table.columns.booking_slot_at"),
        className: "hidden md:table-cell",
      },
      size: 150,
    },
    {
      id: "booking_confirmed_at",
      accessorKey: "booking_confirmed_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.booking_confirmed_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.booking_confirmed_at),
      meta: { label: t("leads.table.columns.booking_confirmed_at") },
      size: 150,
    },
    {
      id: "booking_calcom_uid",
      accessorKey: "booking_calcom_uid",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.booking_calcom_uid")}
        />
      ),
      meta: { label: t("leads.table.columns.booking_calcom_uid") },
      size: 140,
    },

    // ── Wizard & Platforms (V6.2) ─────────────────────────────────────
    {
      id: "platforms_used",
      accessorKey: "platforms_used",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.platforms_used")}
        />
      ),
      cell: ({ row }) => {
        const val = row.original.platforms_used;
        return Array.isArray(val) ? val.join(", ") : "—";
      },
      meta: { label: t("leads.table.columns.platforms_used") },
      size: 160,
    },
    {
      id: "wizard_completed",
      accessorKey: "wizard_completed",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.wizard_completed")}
        />
      ),
      cell: ({ row }) => formatBoolean(row.original.wizard_completed),
      meta: {
        label: t("leads.table.columns.wizard_completed"),
        className: "hidden md:table-cell",
      },
      size: 80,
    },

    // ── Tenant ────────────────────────────────────────────────────────
    {
      id: "tenant_id",
      accessorKey: "tenant_id",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.tenant_id")}
        />
      ),
      meta: { label: t("leads.table.columns.tenant_id") },
      size: 100,
    },

    // ── Conversion (V6.2) ─────────────────────────────────────────────
    {
      id: "converted_at",
      accessorKey: "converted_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.converted_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.converted_at),
      meta: { label: t("leads.table.columns.converted_at") },
      size: 150,
    },

    // ── Email verification (V6.2.2) ──────────────────────────────────
    {
      id: "email_verified",
      accessorKey: "email_verified",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email_verified")}
        />
      ),
      cell: ({ row }) => formatBoolean(row.original.email_verified),
      meta: { label: t("leads.table.columns.email_verified") },
      size: 80,
    },
    {
      id: "email_verification_code",
      accessorKey: "email_verification_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email_verification_code")}
        />
      ),
      meta: { label: t("leads.table.columns.email_verification_code") },
      size: 160,
    },
    {
      id: "email_verification_expires_at",
      accessorKey: "email_verification_expires_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email_verification_expires_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.email_verification_expires_at),
      meta: { label: t("leads.table.columns.email_verification_expires_at") },
      size: 150,
    },
    {
      id: "email_verification_attempts",
      accessorKey: "email_verification_attempts",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email_verification_attempts")}
        />
      ),
      meta: { label: t("leads.table.columns.email_verification_attempts") },
      size: 80,
    },

    // ── Attendance confirmation (V6.2.6) ──────────────────────────────
    {
      id: "confirmation_token",
      accessorKey: "confirmation_token",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.confirmation_token")}
        />
      ),
      meta: { label: t("leads.table.columns.confirmation_token") },
      size: 160,
    },
    {
      id: "attendance_confirmed",
      accessorKey: "attendance_confirmed",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.attendance_confirmed")}
        />
      ),
      cell: ({ row }) => formatBoolean(row.original.attendance_confirmed),
      meta: { label: t("leads.table.columns.attendance_confirmed") },
      size: 80,
    },
    {
      id: "attendance_confirmed_at",
      accessorKey: "attendance_confirmed_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.attendance_confirmed_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.attendance_confirmed_at),
      meta: { label: t("leads.table.columns.attendance_confirmed_at") },
      size: 150,
    },

    // ── J-1 reminder (V6.2.6) ─────────────────────────────────────────
    {
      id: "j1_reminder_sent_at",
      accessorKey: "j1_reminder_sent_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.j1_reminder_sent_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.j1_reminder_sent_at),
      meta: { label: t("leads.table.columns.j1_reminder_sent_at") },
      size: 150,
    },

    // ── Reschedule (V6.3.3) ───────────────────────────────────────────
    {
      id: "reschedule_token",
      accessorKey: "reschedule_token",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.reschedule_token")}
        />
      ),
      meta: { label: t("leads.table.columns.reschedule_token") },
      size: 100,
    },

    // ── GeoIP detection (V6.4) ────────────────────────────────────────
    {
      id: "detected_country_code",
      accessorKey: "detected_country_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.detected_country_code")}
        />
      ),
      meta: { label: t("leads.table.columns.detected_country_code") },
      size: 100,
    },
    {
      id: "ip_address",
      accessorKey: "ip_address",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.ip_address")}
        />
      ),
      meta: { label: t("leads.table.columns.ip_address") },
      size: 120,
    },

    // ── Language (V6.4-3) ─────────────────────────────────────────────
    {
      id: "language",
      accessorKey: "language",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.language")}
        />
      ),
      meta: { label: t("leads.table.columns.language") },
      size: 80,
    },

    // ── Callback (V6.6) ───────────────────────────────────────────────
    {
      id: "callback_requested",
      accessorKey: "callback_requested",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.callback_requested")}
        />
      ),
      cell: ({ row }) => formatBoolean(row.original.callback_requested),
      meta: {
        label: t("leads.table.columns.callback_requested"),
        className: "hidden md:table-cell",
      },
      size: 80,
    },
    {
      id: "callback_requested_at",
      accessorKey: "callback_requested_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.callback_requested_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.callback_requested_at),
      meta: {
        label: t("leads.table.columns.callback_requested_at"),
        className: "hidden md:table-cell",
      },
      size: 150,
    },
    {
      id: "callback_completed_at",
      accessorKey: "callback_completed_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.callback_completed_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.callback_completed_at),
      meta: { label: t("leads.table.columns.callback_completed_at") },
      size: 150,
    },
    {
      id: "callback_notes",
      accessorKey: "callback_notes",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.callback_notes")}
        />
      ),
      cell: ({ row }) => truncate(row.original.callback_notes),
      meta: { label: t("leads.table.columns.callback_notes") },
      size: 200,
    },

    // ── Disqualification (V6.6) ───────────────────────────────────────
    {
      id: "disqualified_at",
      accessorKey: "disqualified_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.disqualified_at")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.disqualified_at),
      meta: { label: t("leads.table.columns.disqualified_at") },
      size: 150,
    },
    {
      id: "disqualification_reason",
      accessorKey: "disqualification_reason",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.disqualification_reason")}
        />
      ),
      meta: { label: t("leads.table.columns.disqualification_reason") },
      size: 140,
    },
    {
      id: "disqualification_comment",
      accessorKey: "disqualification_comment",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.disqualification_comment")}
        />
      ),
      cell: ({ row }) => truncate(row.original.disqualification_comment),
      meta: { label: t("leads.table.columns.disqualification_comment") },
      size: 200,
    },
    {
      id: "disqualified_by",
      accessorKey: "disqualified_by",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.disqualified_by")}
        />
      ),
      meta: { label: t("leads.table.columns.disqualified_by") },
      size: 100,
    },

    // ── Recovery notification (V6.6) ──────────────────────────────────
    {
      id: "recovery_notification_sent_at",
      accessorKey: "recovery_notification_sent_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.recovery_sent")}
        />
      ),
      cell: ({ row }) => formatDate(row.original.recovery_notification_sent_at),
      meta: { label: t("leads.table.columns.recovery_sent") },
      size: 150,
    },
    {
      id: "recovery_notification_clicked_at",
      accessorKey: "recovery_notification_clicked_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.recovery_clicked")}
        />
      ),
      cell: ({ row }) =>
        formatDate(row.original.recovery_notification_clicked_at),
      meta: { label: t("leads.table.columns.recovery_clicked") },
      size: 150,
    },

    // ── Actions ───────────────────────────────────────────────────────
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
        const isPinned = row.getIsPinned();
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/crm/leads/${lead.id}`}>
                  <Eye className="mr-2 size-4" />
                  {t("leads.actions.view")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(lead.id)}>
                <Pencil className="mr-2 size-4" />
                {t("leads.actions.edit")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPinned ? (
                <DropdownMenuItem onClick={() => row.pin(false)}>
                  <PinOff className="mr-2 size-4" />
                  {t("leads.actions.unpin_row")}
                </DropdownMenuItem>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => row.pin("top")}>
                    <Pin className="mr-2 size-4" />
                    {t("leads.actions.pin_top")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => row.pin("bottom")}>
                    <Pin className="mr-2 size-4" />
                    {t("leads.actions.pin_bottom")}
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 size-4" />
                {t("leads.actions.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      enableColumnFilter: false,
      enableResizing: false,
      enablePinning: false,
      enableGrouping: false,
      size: 40,
    },
  ];
}
