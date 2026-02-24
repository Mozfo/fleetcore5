"use client";

import { Building2, Clock, Mail, Users } from "lucide-react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import type { SettingsTenant } from "../types/tenant.types";

interface TenantMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface TenantInvitation {
  id: string;
  email: string;
  role: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

interface TenantDetail {
  members: TenantMember[];
  invitations: TenantInvitation[];
}

async function fetcher(url: string): Promise<TenantDetail> {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

interface TenantExpandedRowProps {
  tenant: SettingsTenant;
}

export function TenantExpandedRow({ tenant }: TenantExpandedRowProps) {
  const { data, isLoading } = useSWR<TenantDetail>(
    `/api/admin/tenants/${tenant.id}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const members = data?.members ?? [];
  const pendingInvitations =
    data?.invitations?.filter((inv) => inv.status === "pending") ?? [];

  return (
    <div className="grid gap-4 text-sm md:grid-cols-3">
      {/* Info */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Building2 className="text-muted-foreground size-3.5" />
          <span className="text-muted-foreground text-xs font-medium">
            Details
          </span>
        </div>
        <dl className="space-y-1 text-xs">
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-20 shrink-0">Slug</dt>
            <dd className="font-mono">{tenant.slug || "—"}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted-foreground w-20 shrink-0">Timezone</dt>
            <dd>{tenant.timezone || "—"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt className="text-muted-foreground w-20 shrink-0">Created</dt>
            <dd>
              <Clock className="mr-1 inline size-3" />
              {new Date(tenant.createdAt).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Members */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Users className="text-muted-foreground size-3.5" />
          <span className="text-muted-foreground text-xs font-medium">
            Members ({members.length})
          </span>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground text-xs italic">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">No members</p>
        ) : (
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.id} className="flex items-center gap-2 text-xs">
                <span className="truncate">{m.name}</span>
                <Badge variant="outline" className="px-1 py-0 text-[10px]">
                  {m.role}
                </Badge>
                <Badge
                  variant={m.status === "active" ? "success" : "secondary"}
                  className="px-1 py-0 text-[10px]"
                >
                  {m.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending Invitations */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <Mail className="text-muted-foreground size-3.5" />
          <span className="text-muted-foreground text-xs font-medium">
            Pending Invitations ({pendingInvitations.length})
          </span>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground text-xs italic">Loading...</p>
        ) : pendingInvitations.length === 0 ? (
          <p className="text-muted-foreground text-xs italic">
            No pending invitations
          </p>
        ) : (
          <ul className="space-y-1">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="flex items-center gap-2 text-xs">
                <span className="truncate">{inv.email}</span>
                <Badge variant="warning" className="px-1 py-0 text-[10px]">
                  pending
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
