"use client";

import {
  ArrowLeft,
  Building2,
  Globe,
  KeyRound,
  ShieldCheck,
  User,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SettingsMember } from "../types/member.types";
import { ResetPasswordDialog } from "./reset-password-dialog";

interface MemberDetailPageProps {
  memberId: string;
}

function generateAvatarFallback(name: string): string {
  const parts = name.split(" ").filter(Boolean);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("");
}

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
  inactive: "secondary",
  suspended: "destructive",
};

export function MemberDetailPage({ memberId }: MemberDetailPageProps) {
  const { localizedPath } = useLocalizedPath();
  const [member, setMember] = React.useState<SettingsMember | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [resetPwdOpen, setResetPwdOpen] = React.useState(false);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/members/${memberId}`);
        if (!res.ok) throw new Error("Failed to fetch member");
        const data: SettingsMember = await res.json();
        setMember(data);
      } catch {
        // Error handled by null state
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [memberId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={localizedPath("admin/members")}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Members
          </Link>
        </Button>
        <p className="text-destructive">Member not found.</p>
      </div>
    );
  }

  const statusVariant = STATUS_VARIANT[member.status] ?? "outline";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={localizedPath("admin/members")}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>
          <Avatar className="size-10">
            <AvatarFallback>
              {generateAvatarFallback(member.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-medium">{member.name}</h3>
            <p className="text-muted-foreground text-sm">{member.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setResetPwdOpen(true)}
        >
          <KeyRound className="mr-2 size-4" />
          Reset Password
        </Button>
      </div>

      {/* Member info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5" />
            Member Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                First Name
              </dt>
              <dd className="mt-1">{member.firstName ?? "\u2014"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Last Name
              </dt>
              <dd className="mt-1">{member.lastName ?? "\u2014"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Email
              </dt>
              <dd className="mt-1">{member.email}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Phone
              </dt>
              <dd className="mt-1">{member.phone || "\u2014"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Role
              </dt>
              <dd className="mt-1">
                <Badge
                  variant={member.role === "admin" ? "default" : "secondary"}
                >
                  {member.role}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Status
              </dt>
              <dd className="mt-1">
                <Badge variant={statusVariant} className="capitalize">
                  {member.status}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                <ShieldCheck className="mr-1 inline size-3.5" />
                2FA
              </dt>
              <dd className="mt-1">
                <Badge
                  variant={member.twoFactorEnabled ? "success" : "outline"}
                >
                  {member.twoFactorEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Language
              </dt>
              <dd className="mt-1">{member.preferredLanguage ?? "\u2014"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Last Login
              </dt>
              <dd className="mt-1">
                {member.lastLoginAt
                  ? new Date(member.lastLoginAt).toLocaleString()
                  : "\u2014"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(member.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Tenant card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Tenant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-3">
              {member.tenantCountryCode && (
                <span className="text-lg">
                  {countryFlag(member.tenantCountryCode)}
                </span>
              )}
              <Globe className="text-muted-foreground size-4" />
              <Link
                href={localizedPath(`admin/tenants/${member.tenantId}`)}
                className="font-medium hover:underline"
              >
                {member.tenantName}
              </Link>
            </div>
            <Badge variant="outline">{member.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <ResetPasswordDialog
        userId={member.authUserId}
        open={resetPwdOpen}
        onOpenChange={setResetPwdOpen}
      />
    </div>
  );
}
