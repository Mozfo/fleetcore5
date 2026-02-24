"use client";

import {
  AlertCircle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { SettingsInvitation } from "../types/invitation.types";

interface InvitationExpandedRowProps {
  invitation: SettingsInvitation;
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

function getDetailedStatus(invitation: SettingsInvitation) {
  const now = new Date();
  const expiresAt = new Date(invitation.expiresAt);

  if (invitation.status === "accepted") {
    return {
      label: "Accepted",
      variant: "success" as const,
      icon: CheckCircle2,
      description: "The recipient has accepted this invitation",
    };
  }

  if (invitation.status === "canceled") {
    return {
      label: "Canceled",
      variant: "destructive" as const,
      icon: XCircle,
      description: "This invitation was revoked by an administrator",
    };
  }

  if (invitation.status === "rejected") {
    return {
      label: "Rejected",
      variant: "secondary" as const,
      icon: XCircle,
      description: "The recipient declined this invitation",
    };
  }

  // Pending status — check if expired
  if (expiresAt < now) {
    return {
      label: "Expired",
      variant: "destructive" as const,
      icon: AlertCircle,
      description: `This invitation expired on ${formatDateTime(invitation.expiresAt)}`,
    };
  }

  // Still pending and not expired
  const diffMs = expiresAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return {
    label: "Pending",
    variant: "warning" as const,
    icon: Clock,
    description: `Expires in ${diffDays} day${diffDays !== 1 ? "s" : ""}`,
  };
}

export function InvitationExpandedRow({
  invitation,
}: InvitationExpandedRowProps) {
  const detailedStatus = getDetailedStatus(invitation);
  const StatusIcon = detailedStatus.icon;

  return (
    <div className="text-sm">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs md:grid-cols-3">
        <div className="flex items-center gap-2">
          <Calendar className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Sent</dt>
          <dd>{formatDateTime(invitation.createdAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Expires</dt>
          <dd>{formatDateTime(invitation.expiresAt)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className="text-muted-foreground size-3.5 shrink-0" />
          <dt className="text-muted-foreground shrink-0">Status</dt>
          <dd className="flex items-center gap-1.5">
            <Badge variant={detailedStatus.variant}>
              {detailedStatus.label}
            </Badge>
            <span className="text-muted-foreground">
              {detailedStatus.description}
            </span>
          </dd>
        </div>
      </dl>
    </div>
  );
}
