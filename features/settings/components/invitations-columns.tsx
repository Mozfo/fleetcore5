"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";

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
import type { SettingsInvitation } from "../types/invitation.types";

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? "\u2014" : d.toLocaleDateString();
}

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "destructive" | "warning" | "secondary"
> = {
  pending: "warning",
  accepted: "success",
  canceled: "destructive",
  rejected: "secondary",
};

const ROLE_LABELS: Record<string, string> = {
  "org:adm_admin": "Admin",
  "org:owner": "Owner",
  admin: "Admin",
  member: "Member",
};

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

interface GetInvitationsColumnsOptions {
  onResend?: (invitationId: string) => void;
  onRevoke?: (invitationId: string) => void;
  onDelete?: (invitationId: string) => void;
}

export function getInvitationsColumns(
  options?: GetInvitationsColumnsOptions
): ColumnDef<SettingsInvitation>[] {
  const { onResend, onRevoke, onDelete } = options ?? {};
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
    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("email")}</span>
      ),
      meta: { label: "Email" },
    },
    // Tenant
    {
      accessorKey: "tenantName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tenant" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("tenantName")}
        </span>
      ),
      meta: { label: "Tenant" },
    },
    // Role
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue<string | null>("role") ?? "member";
        return <Badge variant="outline">{ROLE_LABELS[role] ?? role}</Badge>;
      },
      meta: { label: "Role" },
    },
    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const expired =
          status === "pending" && isExpired(row.original.expiresAt);
        if (expired) {
          return <Badge variant="destructive">expired</Badge>;
        }
        const variant = STATUS_VARIANT[status] ?? "default";
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: {
        label: "Status",
        variant: "select" as const,
        options: [
          { label: "Pending", value: "pending" },
          { label: "Accepted", value: "accepted" },
          { label: "Canceled", value: "canceled" },
          { label: "Rejected", value: "rejected" },
        ],
      },
      enableColumnFilter: true,
    },
    // Inviter
    {
      accessorKey: "inviterName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Invited by" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("inviterName") ?? "\u2014"}
        </span>
      ),
      meta: { label: "Invited by" },
    },
    // Expires
    {
      accessorKey: "expiresAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Expires" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("expiresAt"))}
        </span>
      ),
      meta: { label: "Expires" },
    },
    // Created
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("createdAt"))}
        </span>
      ),
      meta: { label: "Created" },
    },
    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const invitation = row.original;
        const isPending = invitation.status === "pending";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isPending && (
                <>
                  <DropdownMenuItem onClick={() => onResend?.(invitation.id)}>
                    <RefreshCw className="mr-2 size-4" />
                    Resend
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onRevoke?.(invitation.id)}>
                    <XCircle className="mr-2 size-4" />
                    Revoke
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(invitation.id)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
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
