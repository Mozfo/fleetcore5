"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";

import { facetedFilter } from "@/lib/table-filters";
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
import type { SettingsTenantCountry } from "../types/tenant-country.types";

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
}

const TENANT_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "info" | "outline"
> = {
  headquarters: "info",
  division: "secondary",
  client: "default",
  expansion: "outline",
};

interface GetTenantCountriesColumnsOptions {
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function getTenantCountriesColumns({
  onEdit,
  onDelete,
}: GetTenantCountriesColumnsOptions): ColumnDef<SettingsTenantCountry>[] {
  return [
    // Select
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
    // Expand toggle
    {
      id: "expand",
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
      size: 32,
    },
    // Country (flag + code + name)
    {
      accessorKey: "countryName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        const { flagEmoji, countryCode, countryName } = row.original;
        return (
          <span className="font-medium">
            {flagEmoji && <span className="mr-2">{flagEmoji}</span>}
            <span className="text-muted-foreground mr-2 font-mono text-sm">
              {countryCode}
            </span>
            {countryName}
          </span>
        );
      },
      meta: { label: "Country" },
    },
    // Managing Team
    {
      accessorKey: "tenantName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Managing Team" />
      ),
      cell: ({ row }) => {
        const { tenantName, tenantType } = row.original;
        const variant = TENANT_TYPE_VARIANT[tenantType] ?? "outline";
        return (
          <div className="flex items-center gap-2">
            <span>{tenantName}</span>
            <Badge variant={variant} className="text-[10px]">
              {tenantType}
            </Badge>
          </div>
        );
      },
      meta: {
        label: "Managing Team",
        variant: "select" as const,
        options: [
          { label: "Headquarters", value: "headquarters" },
          { label: "Division", value: "division" },
        ],
      },
      filterFn: (row, _columnId, filterValue: string[]) => {
        return filterValue.includes(row.original.tenantType);
      },
      enableColumnFilter: true,
    },
    // Role
    {
      accessorKey: "isPrimary",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const isPrimary = row.getValue<boolean>("isPrimary");
        return isPrimary ? (
          <Badge variant="success">Main</Badge>
        ) : (
          <Badge variant="outline">Support</Badge>
        );
      },
      meta: {
        label: "Role",
        variant: "select" as const,
        options: [
          { label: "Main", value: "true" },
          { label: "Support", value: "false" },
        ],
      },
      filterFn: facetedFilter,
      enableColumnFilter: true,
    },
    // Effective Since
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Effective Since" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      meta: { label: "Effective Since" },
    },
    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const mapping = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(mapping.id)}>
                <Pencil className="mr-2 size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(mapping.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];
}
