"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
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

function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

export function getInvitationsColumns(): ColumnDef<SettingsInvitation>[] {
  return [
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
    // Organization
    {
      accessorKey: "organizationName",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Organization" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.getValue("organizationName")}
        </span>
      ),
      meta: { label: "Organization" },
    },
    // Role
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue<string | null>("role");
        return <Badge variant="outline">{role ?? "member"}</Badge>;
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
  ];
}
