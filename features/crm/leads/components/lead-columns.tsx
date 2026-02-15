"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

/**
 * Build lead column definitions for DataTable.
 * Pure function — call via useMemo in consuming component.
 *
 * @param t - Translation function (from useTranslation)
 * @param statuses - Dynamic status configs (from useLeadStatuses)
 */
export function getLeadColumns(
  t: TranslationFn,
  statuses: LeadStatusConfig[]
): ColumnDef<Lead>[] {
  const statusOptions: Option[] = statuses.map((s) => ({
    label: s.label_en,
    value: s.value,
  }));

  return [
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
      size: 40,
    },
    {
      id: "lead_code",
      accessorKey: "lead_code",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.ref")}
        />
      ),
      meta: { label: t("leads.table.columns.ref") },
    },
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
    },
    {
      id: "contact",
      accessorFn: (row) =>
        [row.first_name, row.last_name].filter(Boolean).join(" ") || "—",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.contact")}
        />
      ),
      cell: ({ row }) => {
        const lead = row.original;
        const fullName =
          [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "—";
        const initials =
          [lead.first_name?.[0], lead.last_name?.[0]]
            .filter(Boolean)
            .join("")
            .toUpperCase() || "?";
        return (
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span>{fullName}</span>
          </div>
        );
      },
      meta: { label: t("leads.table.columns.contact") },
    },
    {
      id: "email",
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.email")}
        />
      ),
      meta: { label: t("leads.table.columns.email") },
    },
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
          { label: t("leads.card.priority.low"), value: "low" },
          { label: t("leads.card.priority.medium"), value: "medium" },
          { label: t("leads.card.priority.high"), value: "high" },
          { label: t("leads.card.priority.urgent"), value: "urgent" },
        ],
      },
    },
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
      meta: { label: t("leads.table.columns.country") },
    },
    {
      id: "created_at",
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t("leads.table.columns.created")}
        />
      ),
      cell: ({ row }) => {
        const date = row.getValue<string>("created_at");
        return date ? new Date(date).toLocaleDateString() : "—";
      },
      meta: { label: t("leads.table.columns.created") },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const lead = row.original;
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
              <DropdownMenuItem>
                <Pencil className="mr-2 size-4" />
                {t("leads.actions.edit")}
              </DropdownMenuItem>
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
      size: 40,
    },
  ];
}
