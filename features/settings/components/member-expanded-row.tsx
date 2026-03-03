"use client";

import { Building2, Calendar, Clock, Globe, Mail, Phone } from "lucide-react";

import type { SettingsMember } from "../types/member.types";

interface MemberExpandedRowProps {
  member: SettingsMember;
}

import { formatDateCompact as formatDateTime } from "@/lib/format";

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
