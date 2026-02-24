"use client";

import { Building2, Calendar, Clock, Globe, Mail, Phone } from "lucide-react";

import type { SettingsMember } from "../types/member.types";

interface MemberExpandedRowProps {
  member: SettingsMember;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function MemberExpandedRow({ member }: MemberExpandedRowProps) {
  return (
    <div className="text-sm">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Mail className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Email</dt>
          <dd className="truncate">{member.email}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Phone</dt>
          <dd>{member.phone || "—"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Tenant</dt>
          <dd className="truncate">{member.tenantName}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Globe className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Language</dt>
          <dd>{member.preferredLanguage?.toUpperCase() || "—"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Last Login</dt>
          <dd>{formatDateTime(member.lastLoginAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Created</dt>
          <dd>{formatDateTime(member.createdAt)}</dd>
        </div>
      </dl>
    </div>
  );
}
