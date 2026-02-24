"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  KeyRound,
  MoreHorizontal,
  Pencil,
  Power,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
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
import type { SettingsMember } from "../types/member.types";

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDate(value: unknown): string {
  if (!value) return "\u2014";
  const d = new Date(value as string);
  if (isNaN(d.getTime())) return "\u2014";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function generateAvatarFallback(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

const STATUS_VARIANT: Record<
  string,
  "success" | "destructive" | "warning" | "secondary" | "outline"
> = {
  active: "success",
  pending: "warning",
  inactive: "secondary",
  suspended: "destructive",
};

// ── Column builder ───────────────────────────────────────────────────────

interface GetMembersColumnsOptions {
  localizedPath: (path: string) => string;
  onResetPassword?: (memberId: string) => void;
  onToggleStatus?: (memberId: string, currentStatus: string) => void;
  onDelete?: (memberId: string) => void;
}

export function getMembersColumns({
  localizedPath,
  onResetPassword,
  onToggleStatus,
  onDelete,
}: GetMembersColumnsOptions): ColumnDef<SettingsMember>[] {
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
    // Name with Avatar
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {generateAvatarFallback(member.name)}
              </AvatarFallback>
            </Avatar>
            <Link
              href={localizedPath(`admin/members/${member.id}`)}
              className="font-medium capitalize hover:underline"
            >
              {member.name}
            </Link>
          </div>
        );
      },
      meta: { label: "Name" },
    },
    // Email
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.getValue("email")}</span>
      ),
      meta: { label: "Email" },
    },
    // Role
    {
      accessorKey: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const role = row.getValue<string>("role");
        return (
          <Badge variant={role === "admin" ? "default" : "secondary"}>
            {role}
          </Badge>
        );
      },
      meta: {
        label: "Role",
        variant: "select" as const,
        options: [
          { label: "Admin", value: "admin" },
          { label: "Member", value: "member" },
        ],
      },
      enableColumnFilter: true,
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
    // Country
    {
      accessorKey: "tenantCountryCode",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Country" />
      ),
      cell: ({ row }) => {
        const cc = row.getValue<string>("tenantCountryCode");
        return (
          <span className="text-muted-foreground">
            {cc ? `${countryFlag(cc)} ${cc}` : "\u2014"}
          </span>
        );
      },
      meta: { label: "Country" },
    },
    // Status
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue<string>("status");
        const variant = STATUS_VARIANT[status] ?? "outline";
        return (
          <Badge variant={variant} className="capitalize">
            {status}
          </Badge>
        );
      },
      meta: {
        label: "Status",
        variant: "select" as const,
        options: [
          { label: "Active", value: "active" },
          { label: "Pending", value: "pending" },
          { label: "Inactive", value: "inactive" },
          { label: "Suspended", value: "suspended" },
        ],
      },
      enableColumnFilter: true,
    },
    // 2FA
    {
      accessorKey: "twoFactorEnabled",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="2FA" />
      ),
      cell: ({ row }) => {
        const enabled = row.getValue<boolean>("twoFactorEnabled");
        return enabled ? (
          <ShieldCheck className="text-success size-4" />
        ) : (
          <span className="text-muted-foreground text-sm">{"\u2014"}</span>
        );
      },
      meta: { label: "2FA" },
      size: 60,
    },
    // Last Login
    {
      accessorKey: "lastLoginAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Last Login" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {formatDate(row.getValue("lastLoginAt"))}
        </span>
      ),
      meta: { label: "Last Login" },
    },
    // Actions
    {
      id: "actions",
      cell: ({ row }) => {
        const member = row.original;
        const isActive = member.status === "active";
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
                <Link href={localizedPath(`admin/members/${member.id}`)}>
                  <User className="mr-2 size-4" />
                  View detail
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={localizedPath(`admin/members/${member.id}`)}>
                  <Pencil className="mr-2 size-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {member.authUserId && (
                <DropdownMenuItem
                  onClick={() => onResetPassword?.(member.authUserId)}
                >
                  <KeyRound className="mr-2 size-4" />
                  Reset password
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => onToggleStatus?.(member.id, member.status)}
              >
                <Power className="mr-2 size-4" />
                {isActive ? "Deactivate" : "Reactivate"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete?.(member.id)}
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
