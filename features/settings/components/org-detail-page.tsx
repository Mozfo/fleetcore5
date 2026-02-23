"use client";

import { ArrowLeft, Building2, Mail, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SettingsOrgDetail } from "../types/org.types";

interface OrgDetailPageProps {
  orgId: string;
}

const TENANT_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "info" | "outline"
> = {
  headquarters: "info",
  division: "secondary",
  client: "default",
};

export function OrgDetailPage({ orgId }: OrgDetailPageProps) {
  const [org, setOrg] = React.useState<SettingsOrgDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/adm/settings/organizations/${orgId}`);
        if (!res.ok) throw new Error("Failed to fetch organization");
        const data: SettingsOrgDetail = await res.json();
        setOrg(data);
      } catch {
        // Error handled by null state
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [orgId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/adm/settings/organizations">
            <ArrowLeft className="mr-2 size-4" />
            Back to Organizations
          </Link>
        </Button>
        <p className="text-destructive">Organization not found.</p>
      </div>
    );
  }

  const variant = TENANT_TYPE_VARIANT[org.tenantType] ?? "outline";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/adm/settings/organizations">
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h3 className="text-lg font-medium">{org.name}</h3>
          <p className="text-muted-foreground font-mono text-sm">{org.slug}</p>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Organization Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Name
              </dt>
              <dd className="mt-1">{org.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Slug
              </dt>
              <dd className="mt-1 font-mono text-sm">{org.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Type
              </dt>
              <dd className="mt-1">
                <Badge variant={variant}>{org.tenantType}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(org.createdAt).toLocaleDateString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Members card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5" />
            Members ({org.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {org.members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {org.members.map((m) => (
                  <TableRow key={m.userId}>
                    <TableCell>
                      <Link
                        href={`/adm/settings/users/${m.userId}`}
                        className="font-medium hover:underline"
                      >
                        {m.userName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.userEmail}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/adm/settings/invitations">
                <Mail className="mr-2 size-4" />
                Invite member
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
