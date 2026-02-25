"use client";

import { ArrowLeft, Building2, Globe, Mail, Users } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { useLocalizedPath } from "@/lib/hooks/useLocalizedPath";

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

interface TenantDetailPageProps {
  tenantId: string;
}

/** Convert ISO 3166-1 alpha-2 country code to flag emoji */
function countryFlag(code: string): string {
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65);
  return String.fromCodePoint(...codePoints);
}

const TENANT_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "info" | "outline"
> = {
  headquarters: "info",
  division: "secondary",
  client: "default",
};

const STATUS_VARIANT: Record<
  string,
  "success" | "warning" | "destructive" | "secondary" | "outline"
> = {
  active: "success",
  suspended: "destructive",
  past_due: "warning",
  cancelled: "destructive",
};

const ROLE_LABELS: Record<string, string> = {
  "org:adm_admin": "Admin",
  "org:owner": "Owner",
  admin: "Admin",
  member: "Member",
};

interface TenantDetailData {
  id: string;
  name: string;
  slug: string;
  tenantType: string;
  countryCode: string;
  defaultCurrency: string;
  status: string;
  timezone: string;
  memberCount: number;
  createdAt: string;
  metadata: string | null;
  members: {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    joinedAt: string;
  }[];
  invitations: {
    id: string;
    email: string;
    role: string;
    status: string;
    expiresAt: string;
    createdAt: string;
  }[];
}

export function TenantDetailPage({ tenantId }: TenantDetailPageProps) {
  const { localizedPath } = useLocalizedPath();
  const [tenant, setTenant] = React.useState<TenantDetailData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/admin/tenants/${tenantId}`);
        if (!res.ok) throw new Error("Failed to fetch tenant");
        const data: TenantDetailData = await res.json();
        setTenant(data);
      } catch {
        // Error handled by null state
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [tenantId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={localizedPath("admin/tenants")}>
            <ArrowLeft className="mr-2 size-4" />
            Back to Tenants
          </Link>
        </Button>
        <p className="text-destructive">Tenant not found.</p>
      </div>
    );
  }

  const typeVariant = TENANT_TYPE_VARIANT[tenant.tenantType] ?? "outline";
  const statusVariant = STATUS_VARIANT[tenant.status] ?? "outline";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={localizedPath("admin/tenants")}>
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Link>
        </Button>
        <div>
          <h3 className="text-lg font-medium">
            {tenant.countryCode && (
              <span className="mr-2">{countryFlag(tenant.countryCode)}</span>
            )}
            {tenant.name}
          </h3>
          <p className="text-muted-foreground font-mono text-sm">
            {tenant.slug}
          </p>
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            Tenant Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Name
              </dt>
              <dd className="mt-1">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Slug
              </dt>
              <dd className="mt-1 font-mono text-sm">{tenant.slug}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Type
              </dt>
              <dd className="mt-1">
                <Badge variant={typeVariant}>{tenant.tenantType}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                <Globe className="mr-1 inline size-3.5" />
                Country
              </dt>
              <dd className="mt-1">
                {tenant.countryCode
                  ? `${countryFlag(tenant.countryCode)} ${tenant.countryCode}`
                  : "\u2014"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Currency
              </dt>
              <dd className="mt-1 font-mono text-sm">
                {tenant.defaultCurrency}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Status
              </dt>
              <dd className="mt-1">
                <Badge variant={statusVariant} className="capitalize">
                  {tenant.status.replace("_", " ")}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Timezone
              </dt>
              <dd className="mt-1 text-sm">{tenant.timezone}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-sm font-medium">
                Created
              </dt>
              <dd className="mt-1">
                {new Date(tenant.createdAt).toLocaleDateString()}
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
            Members ({tenant.members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenant.members.length === 0 ? (
            <p className="text-muted-foreground text-sm">No members.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link
                        href={localizedPath(`admin/members/${m.id}`)}
                        className="font-medium hover:underline"
                      >
                        {m.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {m.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ROLE_LABELS[m.role] ?? m.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={STATUS_VARIANT[m.status] ?? "outline"}
                        className="capitalize"
                      >
                        {m.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invitations card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-5" />
            Invitations ({tenant.invitations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tenant.invitations.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invitations.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenant.invitations.map((inv) => {
                  const expired =
                    inv.status === "pending" &&
                    new Date(inv.expiresAt) < new Date();
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ROLE_LABELS[inv.role] ?? inv.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            expired
                              ? "destructive"
                              : inv.status === "accepted"
                                ? "success"
                                : inv.status === "pending"
                                  ? "warning"
                                  : "secondary"
                          }
                        >
                          {expired ? "expired" : inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
